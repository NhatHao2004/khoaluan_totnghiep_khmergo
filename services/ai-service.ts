import { CONFIG } from "../constants/Config";
import { ARTIFACTS_DB, Artifact } from "../constants/ArtifactsDB";

export interface AnalysisResult {
  artifact?: Artifact;
  isRecognized: boolean;
  rawResponse?: string;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const analyzeImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // 1. Chuẩn bị prompt với danh sách hiện vật từ DB
    const artifactsList = ARTIFACTS_DB.map(a => `- ID: ${a.id}, Name: ${a.name}, Features: ${a.features}`).join("\n");
    
    const prompt = `Bạn là một chuyên gia về cổ vật Khmer. Hãy so khớp hình ảnh với danh sách này:
${artifactsList}

QUY TẮC TRẢ LỜI:
1. Nếu khớp >80% với hiện vật trong danh sách, CHỈ TRẢ VỀ DUY NHẤT MÃ ID (ví dụ: "4"). Không thêm bất kỳ văn bản nào khác.
2. Nếu là hiện vật Khmer nhưng không có trong danh sách, trả về: "DESCRIPTION: [mô tả cực ngắn gọn]".
3. Trường hợp khác, trả về: "unknown".`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CONFIG.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API Error Status:", response.status);
      console.error("Groq API Error Data:", JSON.stringify(errorData, null, 2));
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      console.error("Unexpected API response format:", JSON.stringify(data, null, 2));
      throw new Error("Không nhận được phản hồi hợp lệ từ AI.");
    }

    const content = data.choices[0].message.content.trim();
    console.log("AI Response:", content);

    // 1. Kiểm tra nếu content chính là một ID trong DB
    const directMatch = ARTIFACTS_DB.find(a => a.id === content || content.includes(`ID: ${a.id}`) || content.includes(`ID:${a.id}`));
    if (directMatch) {
      return { artifact: directMatch, isRecognized: true };
    }

    // 2. Kiểm tra format DESCRIPTION:
    if (content.toUpperCase().startsWith("DESCRIPTION:")) {
      return { 
        isRecognized: true, 
        rawResponse: content.replace(/DESCRIPTION:/i, "").trim() 
      };
    }

    // 3. Các trường hợp ID: [id] (để an toàn)
    const idRegex = /ID:\s*(\w+)/i;
    const match = content.match(idRegex);
    if (match) {
      const id = match[1];
      const artifact = ARTIFACTS_DB.find(a => a.id === id);
      if (artifact) return { artifact, isRecognized: true };
    }

    return { isRecognized: false, rawResponse: content };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
};

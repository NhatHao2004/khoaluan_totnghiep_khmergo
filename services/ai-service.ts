import { fetchAndActivate, getValue } from "firebase/remote-config";
import { ARTIFACTS_DB, Artifact } from "../constants/ArtifactsDB";
import { CONFIG } from "../constants/Config";
import { remoteConfig } from "../utils/firebaseConfig";

export interface AnalysisResult {
  artifact?: Artifact;
  isRecognized: boolean;
  rawResponse?: string;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const getGroqApiKey = async () => {
  try {
    await fetchAndActivate(remoteConfig);
    const remoteKey = getValue(remoteConfig, "groq_api_key").asString();
    if (remoteKey && remoteKey.trim() !== "") return remoteKey.trim();
    return CONFIG.GROQ_API_KEY;
  } catch (error) {
    return CONFIG.GROQ_API_KEY; 
  }
};

export const analyzeImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    const artifactsList = ARTIFACTS_DB.map(a => `- ID: ${a.id}, Name: ${a.name}, Features: ${a.features}`).join("\n");

    const prompt = `Bạn là hệ thống AI nhận diện di sản Khmer cấp độ chuyên gia.
DANH SÁCH HIỆN VẬT:
${artifactsList}

QUY TẮC PHẢN HỒI:
- KHÔNG suy nghĩ, KHÔNG giải thích.
- Chỉ trả về duy nhất ID (ví dụ: "4") hoặc "unknown".`;

    const apiKey = await getGroqApiKey();
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
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
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    const matchId = content.match(/\d+/);
    let detectedId = matchId ? matchId[0] : "";
    if (detectedId) {
      const found = ARTIFACTS_DB.find(a => a.id === detectedId);
      if (found) return { artifact: found, isRecognized: true };
    }
    return { isRecognized: false, rawResponse: "unknown" };
  } catch (error) {
    throw error;
  }
};

export const chatWithAI = async (message: string): Promise<string> => {
  try {
    const lowerMsg = message.toLowerCase().trim();
    const greetings = ["chào", "hi", "hello", "xin chào", "chào bạn", "bạn ơi", "hey"];
    if (greetings.some(g => lowerMsg === g || lowerMsg.startsWith(g + " "))) {
      return "Chào bạn! Rất vui được gặp bạn. Mình là KhmerGo AI, chuyên gia văn hóa Khmer Nam Bộ. Mình có thể giúp gì cho bạn hôm nay không?";
    }

    const prompt = `Bạn là KhmerGo AI - Phản hồi siêu ngắn gọn, duy nhất 1 đoạn văn.

DANH SÁCH WHITELIST BẮT BUỘC:
- CÁC TRANG TỔNG (PHẢI DÙNG MÃ _ALL): Chùa [LINK:pagoda_all], Ẩm thực [LINK:food_all], Văn hóa [LINK:culture_all].
- Cụ thể Chùa: Chùa Âng [LINK:pagoda_1], Chùa Hang [LINK:pagoda_2], Chùa Kampong [LINK:pagoda_3], Chùa Sleng Chas [LINK:pagoda_4], Chùa Samrong Ek [LINK:pagoda_5].
- Cụ thể Văn hóa: Tôn giáo [LINK:culture_1], Lễ hội [LINK:culture_2], Nghệ thuật [LINK:culture_3], Ngôn ngữ [LINK:culture_4], Trang phục [LINK:culture_5].
- Cụ thể Ẩm thực: Bún nước lèo [LINK:food_1], Cốm dẹp [LINK:food_2], Mắm bò hóc [LINK:food_3], Canh xiêm lo [LINK:food_4], Bánh tét Khmer [LINK:food_5].

QUY TẮC CỨNG:
1. Khi liệt kê danh sách (như hỏi "ẩm thực Khmer"), BẮT BUỘC dùng mã kết thúc bằng _all (ví dụ: [LINK:food_all]). 
2. PHẢN HỒI DUY NHẤT 1 ĐOẠN VĂN. KHÔNG xuống dòng, KHÔNG gạch đầu dòng.
3. Nếu không có trong app, trả lời câu từ chối mặc định.`;

    const apiKey = await getGroqApiKey();
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: message },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Ép phẳng tuyệt đối: xóa bỏ mọi kiểu xuống dòng (\n, \r) và gạch đầu dòng tự phát
    return content.replace(/[\r\n]+/g, ' ').replace(/\s*-\s*/g, ', ').trim();
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw error;
  }
};

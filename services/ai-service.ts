import { ARTIFACTS_DB, Artifact } from "../constants/ArtifactsDB";
import { CONFIG } from "../constants/Config";

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

export const chatWithAI = async (message: string): Promise<string> => {
  try {
    // Lấy dữ liệu từ DB nội bộ để làm căn cứ chính xác
    const context = ARTIFACTS_DB.map(a => `- ${a.name}: ${a.features}`).join("\n");

    const prompt = `Bạn là KhmerGo AI, chuyên gia văn hoá Khmer Nam Bộ. 
    Dưới đây là mã ID và ĐỊA CHỈ chính xác cho 5 ngôi chùa bạn PHẢI sử dụng để trả lời:
    - Chùa Âng: ID 'pagoda_1', Đ/c: phường Nguyệt Hóa, tỉnh Vĩnh Long.
    - Chùa Hang: ID 'pagoda_2', Đ/c: xã Châu Thành, tỉnh Vĩnh Long.
    - Chùa Kampong: ID 'pagoda_3', Đ/c: phường Trà Vinh, tỉnh Vĩnh Long.
    - Chùa Sleng Chas: ID 'pagoda_4', Đ/c: xã Tập Sơn, tỉnh Vĩnh Long.
    - Chùa Samrong Ek: ID 'pagoda_5', Đ/c: phường Nguyệt Hóa, tỉnh Vĩnh Long.
    - Tôn giáo và đời sống: ID 'culture_1' -> Tag [LINK:culture_1]
    - Lễ hội truyền thống: ID 'culture_2' -> Tag [LINK:culture_2]
    - Nghệ thuật ca và múa: ID 'culture_3' -> Tag [LINK:culture_3]
    - Ngôn ngữ và chữ viết: ID 'culture_4' -> Tag [LINK:culture_4]
    - Trang phục truyền thống: ID 'culture_5' -> Tag [LINK:culture_5]
    - Bún nước lèo: ID 'food_1' -> Tag [LINK:food_1]
    - Cốm dẹp: ID 'food_2' -> Tag [LINK:food_2]
    - Mắm bò hóc: ID 'food_3' -> Tag [LINK:food_3]
    - Canh xiêm lo: ID 'food_4' -> Tag [LINK:food_4]
    - Bánh tét Khmer: ID 'food_5' -> Tag [LINK:food_5]

    QUY TẮC:
    1. Trả lời văn phong ĐẦY ĐẶN, mượt mà (khoảng 4-5 câu). Tránh viết câu quá ngắn.
    2. Nếu hỏi về vị trí chùa, phải nêu đúng ĐỊA CHỈ ở trên. Nếu hỏi về văn hóa/ẩm thực, hãy mô tả hương vị hoặc ý nghĩa chính.
    3. KIẾN THỨC ĐẶC BIỆT: Vào dịp lễ hội Ok Om Bok, Cốm dẹp là món ăn quan trọng nhất (ưu tiên nhắc đến hơn). Bánh tét thường gắn liền với dịp Tết (Chôl Chnăm Thmây).
    4. TUYỆT ĐỐI KHÔNG viết mã ID vào nội dung trả lời. 
    5. Bắt buộc đính kèm tag [LINK:ID] vào CUỐI CÙNG nếu nhắc đến các chủ đề chùa, văn hóa hoặc ẩm thực ở trên.
    6. Gợi ý ngắn: "Nhấn nút xem chi tiết để xem thêm thông tin."
    7. Chỉ tập trung vào văn hóa Khmer. Từ chối các chủ đề ngoài lề.`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CONFIG.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw error;
  }
};

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

    const prompt = `Bạn là hệ thống AI nhận diện di sản Khmer với tiêu chuẩn độ chính xác cực cao.
DANH SÁCH HIỆN VẬT:
${artifactsList}

QUY TẮC NHẬN DIỆN KHẮT KHE:
1. CHỈ trả về ID nếu bạn tin tưởng ĐỘ CHÍNH XÁC TRÊN 90%. Nếu thấp hơn, hãy trả về "unknown".
2. Nếu hình ảnh mờ, thiếu sáng, hoặc không thể nhìn rõ các đặc điểm đặc trưng -> PHẢI trả về "unknown".
3. TRÁNH NHẦM LẪN:
   - MÀU SẮC RỰC RỠ, có RĂNG, có MẮT -> ID 4 (Mặt nạ).
   - THANH LÁ KHÔ màu tự nhiên, có chữ KHẮC -> ID 1 (Kinh lá buông).

QUY TẮC PHẢN HỒI:
- KHÔNG suy nghĩ, KHÔNG giải thích.
- Chỉ trả về duy nhất ID (ví dụ: "4") hoặc "unknown".
- Nếu chắc chắn là đồ Khmer nhưng không có trong danh sách, trả về: "DESCRIPTION: [mô tả ngắn]".`;

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

    if (content.toUpperCase().startsWith("DESCRIPTION:")) {
      return { isRecognized: true, rawResponse: content.replace(/DESCRIPTION:/i, "").trim() };
    }

    return { isRecognized: false, rawResponse: "unknown" };
  } catch (error) {
    console.error("Analyze Image Error:", error);
    throw error;
  }
};

export const chatWithAI = async (message: string): Promise<string> => {
  try {
    const prompt = `Bạn là KhmerGo AI, chuyên gia văn hoá Khmer Nam Bộ.

LỆNH CẤM (BẮT BUỘC):
1. TUYỆT ĐỐI KHÔNG bao giờ được sử dụng cụm từ "Chào lại bạn". Đây là lỗi nghiêm trọng.
2. NẾU người dùng CHÀO (vd: "chào", "hi", "hello"), hãy TRẢ LỜI CHÍNH XÁC MẪU SAU: 
   "Chào bạn! Rất vui được gặp bạn. Mình có thể giúp gì cho bạn về văn hóa và di sản Khmer không?"

QUY TẮC TRUNG THỰC:
1. Thông tin chùa BẮT BUỘC dùng:
    - Chùa Âng: [LINK:pagoda_1] (phường Nguyệt Hóa, Trà Vinh)
    - Chùa Hang: [LINK:pagoda_2] (xã Châu Thành, Trà Vinh)
    - Chùa Kampong: [LINK:pagoda_3] (phường Trà Vinh)
    - Chùa Sleng Chas: [LINK:pagoda_4] (xã Tập Sơn)
    - Chùa Samrong Ek: [LINK:pagoda_5] (phường Nguyệt Hóa)
2. Luôn đặt [LINK:ID] ở CUỐI CÙNG của toàn bộ câu trả lời.`;

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
        temperature: 0.1, // Hạ thấp tối đa để AI tuân thủ mẫu câu chào 100%
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

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
    // Xử lý Lời chào nhanh (Fast-track)
    const greetings = ["chào", "hi", "hello", "xin chào", "chào bạn", "bạn ơi", "hey"];
    if (greetings.some(g => lowerMsg === g || lowerMsg.startsWith(g + " "))) {
      return "Chào bạn! Rất vui được gặp bạn. Mình là KhmerGo AI, chuyên gia văn hóa Khmer Nam Bộ. Mình có thể giúp gì cho bạn hôm nay không?";
    }

    const prompt = `Bạn là KhmerGo AI, trợ lý thông minh của ứng dụng KhmerGo.

=========================
VAI TRÒ
=======
Nhiệm vụ của bạn là hỗ trợ người dùng tìm hiểu các nội dung văn hóa Khmer Nam Bộ có trong ứng dụng KhmerGo. Bạn chỉ được trả lời dựa trên các chủ đề đã được khai báo bên dưới.

=========================
DANH SÁCH CHỦ ĐỀ ĐƯỢC PHÉP
==========================

CHÙA KHMER [LINK:pagoda_all]
* Chùa Âng [LINK:pagoda_1]
* Chùa Hang [LINK:pagoda_2]
* Chùa Kampong [LINK:pagoda_3]
* Chùa Sleng Chas [LINK:pagoda_4]
* Chùa Samrong Ek [LINK:pagoda_5]

VĂN HÓA & DI SẢN [LINK:culture_all]
* Kinh lá buông [LINK:culture_4] (Số 1)
* Tôn giáo [LINK:culture_1]
* Lễ hội Ok Om Bok [LINK:culture_2]
* Lễ hội Chôl Chnăm Thmây
* Nghệ thuật [LINK:culture_3] (Mặt nạ Yeak)
* Ngôn ngữ & Chữ viết [LINK:culture_4]
* Trang phục [LINK:culture_5]

ẨM THỰC KHMER [LINK:food_all]
* Bún nước lèo [LINK:food_1] (Số 3)
* Cốm dẹp [LINK:food_2] (Số 2)
* Mắm bò hóc [LINK:food_3]
* Canh xiêm lo [LINK:food_4]
* Bánh tét Khmer [LINK:food_5]

ỨNG DỤNG KHMERGO (Giới thiệu, Khám phá, Tìm kiếm, AI Camera, Trò chuyện AI, Hồ sơ, Điểm thưởng & Huy hiệu)

=========================
QUY TẮC BẮT BUỘC
================
1. Chỉ trả lời các nội dung nằm trong danh sách chủ đề được phép.
2. Không sử dụng kiến thức ngoài ứng dụng KhmerGo. Không tự suy diễn. Không bịa đặt thông tin.
3. Nếu người dùng hỏi về: Toán học, Lập trình, Công nghệ, Tin tức, Chính trị, Thể thao, Giải trí, Người nổi tiếng, Khoa học, Lịch sử thế giới, Địa lý thế giới, ChatGPT hay AI nói chung:
   => PHẢI TRẢ LỜI CHÍNH XÁC: "Xin lỗi, tôi chỉ có thể hỗ trợ các nội dung liên quan đến văn hóa Khmer Nam Bộ và dữ liệu trong ứng dụng KhmerGo."
4. Nếu không chắc chắn câu hỏi có thuộc phạm vi KhmerGo hay không thì phải từ chối trả lời bằng câu mặc định ở trên.

=========================
QUY TẮC TRẢ LỜI & LINK
============
* Trả lời ngắn gọn, DUY NHẤT 1 ĐOẠN VĂN, KHÔNG xuống dòng.
* LINK [LINK:ID] luôn nằm cuối câu trả lời nếu có. Không được tự tạo LINK mới.
* Thân thiện và dễ hiểu.

=========================
VÍ DỤ
=====
Người dùng: "Chùa Âng là gì?"
Trả lời: "Chùa Âng là một trong những ngôi chùa Khmer tiêu biểu tại Trà Vinh, nổi bật với kiến trúc truyền thống và giá trị văn hóa đặc sắc. [LINK:pagoda_1]"

Người dùng: "Messi là ai?"
Trả lời: "Xin lỗi, tôi chỉ có thể hỗ trợ các nội dung liên quan đến văn hóa Khmer Nam Bộ và dữ liệu trong ứng dụng KhmerGo."`;

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
    return content.replace(/[\r\n]+/g, ' ').replace(/\s*-\s*/g, ', ').trim();
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw error;
  }
};

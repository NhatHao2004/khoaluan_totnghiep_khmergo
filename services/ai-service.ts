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
    const key = getValue(remoteConfig, "groq_api_key").asString();
    return key || CONFIG.GROQ_API_KEY;
  } catch (error) {
    return CONFIG.GROQ_API_KEY; 
  }
};

export const analyzeImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // 1. Chuẩn bị prompt với danh sách hiện vật từ DB
    const artifactsList = ARTIFACTS_DB.map(a => `- ID: ${a.id}, Name: ${a.name}, Features: ${a.features}`).join("\n");

    const prompt = `Bạn là một chuyên gia về cổ vật Khmer. Hãy so khớp hình ảnh với danh sách này:
${artifactsList}

QUY TRÌNH PHÂN TÍCH VÀ PHẢN HỒI:
1. Quan sát kỹ: Màu sắc chủ đạo, hoa văn, hình dáng, các chi tiết đặc trưng (ví dụ: răng nanh, chữ viết, chất liệu gỗ/đá/lá).
2. So sánh: Đối chiếu kỹ với trường 'Features' của từng hiện vật trong danh sách.
3. QUY TẮC TRẢ LỜI:
   - Nếu độ tin cậy TRÊN 95% là một hiện vật trong danh sách: CHỈ trả về đúng mã ID (ví dụ: "4").
   - Nếu thấy hiện vật Khmer nhưng không chắc chắn hoặc không có trong danh sách: Hãy viết một đoạn mô tả ngắn về hiện vật đó.
   - Nếu hình ảnh không liên quan: Trả về "unknown".
4. LƯU Ý: Tuyệt đối không đoán mò. Thà trả về mô tả còn hơn trả về sai ID. Đặc biệt lưu ý sự khác biệt giữa Kinh lá buông (dạng lá) và Mặt nạ (dạng khuôn mặt).`;

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
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error("Không nhận được phản hồi hợp lệ từ AI.");
    }

    const content = data.choices[0].message.content.trim();

    // 1. Kiểm tra xem trong nội dung phản hồi có chứa bất kỳ ID nào từ DB không
    const normalizedContent = content.toLowerCase();
    
    // Tìm ID có độ dài khớp nhất để tránh trùng lặp (ví dụ ID 1 và 10)
    for (const artifact of ARTIFACTS_DB) {
      const idStr = artifact.id.toLowerCase();
      // Kiểm tra nếu content là ID đơn thuần, hoặc có chứa "ID: [id]", hoặc "số [id]"
      if (
        content === artifact.id || 
        content.includes(`ID: ${artifact.id}`) || 
        content.includes(`ID:${artifact.id}`) ||
        new RegExp(`\\b${artifact.id}\\b`).test(content)
      ) {
        return { artifact: artifact, isRecognized: true };
      }
    }

    // 2. Nếu không tìm thấy ID cụ thể nhưng AI có mô tả (không phải unknown)
    if (content.toLowerCase() !== "unknown") {
      return {
        isRecognized: true,
        rawResponse: content
      };
    }

    return { isRecognized: false, rawResponse: content };
  } catch (error) {
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
    
    ĐỊA CHỈ TRANG DANH SÁCH:
    - Tất cả món ăn: ID 'food_all' -> Tag [LINK:food_all]
    - Tất cả ngôi chùa: ID 'pagoda_all' -> Tag [LINK:pagoda_all]
    - Tất cả văn hóa: ID 'culture_all' -> Tag [LINK:culture_all]

    QUY TẮC:
    1. QUAN TRỌNG NHẤT: Nếu người dùng gửi lời chào (ví dụ: "chào", "hi", "hello", "xin chào", "bạn ơi", v.v.), CHỈ chào lại ngắn gọn, thân thiện và kết thúc bằng câu hỏi mở kiểu "Bạn có thắc mắc gì muốn mình giải đáp không?". TUYỆT ĐỐI KHÔNG đề xuất chủ đề, không thêm [LINK:...], không mời xem chi tiết.
    2. Chỉ khi người dùng HỎI về một chủ đề cụ thể (chùa, lễ hội, ẩm thực, văn hóa, ngôn ngữ...) thì mới trả lời đầy đủ và đính kèm tag [LINK:ID] phù hợp vào CUỐI câu trả lời. 
       - Nếu hỏi về một món/địa điểm cụ thể: Dùng [LINK:ID_cụ_thể].
       - Nếu hỏi chung về chủ đề (ví dụ: "ẩm thực Khmer có gì?", "các ngôi chùa ở đây"): Dùng [LINK:chủ_đề_all] (vd: [LINK:food_all]).
    3. Trả lời văn phong đầy đặn, mượt mà (4-5 câu) khi được hỏi về nội dung. Tránh viết câu ngắn.
    4. Nếu hỏi về vị trí chùa, phải nêu đúng ĐỊA CHỈ ở trên. Nếu hỏi về văn hóa/ẩm thực, hãy mô tả hương vị hoặc ý nghĩa chính.
    5. KIẾN THỨC ĐẶC BIỆT: Vào dịp lễ hội Ok Om Bok, Cốm dẹp là món ăn quan trọng nhất. Bánh tét thường gắn liền với dịp Tết (Chôl Chnăm Thmây).
    6. TUYỆT ĐỐI KHÔNG viết mã ID vào nội dung trả lời.
    7. Gợi ý "Nếu bạn muốn tìm hiểu sâu hơn, hãy nhấn nút xem chi tiết." cho link cụ thể, hoặc "Nếu bạn muốn khám phá thêm, hãy nhấn vào nút bên dưới để xem danh sách đầy đủ." cho link [LINK:..._all].
    8. Luôn kết thúc bằng dấu chấm câu trước khi đặt tag [LINK:ID]. Tag [LINK:ID] phải luôn nằm ở cuối cùng của toàn bộ câu trả lời.
    9. TUYỆT ĐỐI KHÔNG trả lời các câu hỏi không liên quan đến văn hóa, ẩm thực, địa danh hoặc con người Khmer (ví dụ: toán học, tiếng Anh, bóng đá, v.v.). Nếu gặp các câu hỏi này, hãy trả về câu: "Rất tiếc, mình là chuyên gia văn hóa Khmer nên chỉ có thể hỗ trợ các thông tin trong phạm vi này. Câu hỏi của bạn nằm ngoài kiến thức của mình."
    10. Luôn giữ thái độ lịch sự, thân thiện nhưng kiên định với vai trò chuyên gia văn hóa.`;

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
    throw error;
  }
};

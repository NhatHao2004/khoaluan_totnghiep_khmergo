import { ARTIFACTS_DB } from "@/constants/ArtifactsDB";
import * as SecureStore from 'expo-secure-store';

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY_STORAGE_KEY = 'groq_api_key';

const getGroqApiKey = async () => {
  try {
    const key = await SecureStore.getItemAsync(GROQ_API_KEY_STORAGE_KEY);
    if (!key) {
      throw new Error("GROQ API Key not found in SecureStore");
    }
    return key;
  } catch (error) {
    console.error("Error retrieving Groq API Key:", error);
    throw error;
  }
};

export const chatWithAI = async (message: string): Promise<string> => {
  try {
    const lowerMsg = message.toLowerCase().trim();

    // 1. Định nghĩa dữ liệu phản hồi nhanh (Fast Path Data)
    const pagodaMap: Record<string, string> = {
      "chùa âng": "Chùa Âng là một trong những ngôi chùa Khmer cổ và nổi tiếng nhất tại Trà Vinh, mang giá trị lịch sử và kiến trúc đặc sắc. [LINK:pagoda_1]",
      "chùa hang": "Chùa Hang (Wat Kompong Chray) nổi bật với cổng chùa hình chim thần đạo độc đáo và khuôn viên rợp bóng cây cổ thụ. [LINK:pagoda_2]",
      "chùa kompong": "Chùa Kompong (Wat Kompong) là ngôi chùa có bề dày lịch sử lâu đời và là trung tâm giáo dục quan trọng của cộng đồng. [LINK:pagoda_3]",
      "chùa samrong ek": "Chùa Samrong Ek là nơi gìn giữ nhiều nét đẹp văn hóa tâm linh của người Khmer với kiến trúc mái chùa uy nghi. [LINK:pagoda_5]",
      "chùa sleng chas": "Chùa Sleng Chas là ngôi chùa cổ kính với những hàng cột vững chãi và họa tiết trang trí tinh xảo. [LINK:pagoda_4]",
    };

    const foodMap: Record<string, string> = {
      "bún nước lèo": "Bún nước lèo là món ăn đặc trưng của người Khmer Nam Bộ với hương vị đậm đà được nấu từ mắm bò hóc hảo hạng. [LINK:food_1]",
      "mắm bò hóc": "Mắm bò hóc là loại gia vị truyền thống linh hồn trong hầu hết các món truyền thống của người Khmer Nam Bộ. [LINK:food_3]",
      "bánh tét": "Bánh tét Khmer với nhân đậu mỡ béo ngậy được gói cẩn thận, là món ăn không thể thiếu trong các dịp lễ hội. [LINK:food_5]",
      "cốm dẹp": "Cốm dẹp được làm từ loại nếp vừa chín tới, mang hương vị thơm ngon đặc biệt trong lễ hội Ok Om Bok. [LINK:food_2]",
      "canh xiêm lo": "Canh xiêm lo là món canh truyền thống bổ dưỡng của người Khmer với sự kết hợp của nhiều loại rau quả. [LINK:food_4]",
    };

    const CULTURES = [
      "trang phục truyền thống",
      "ngôn ngữ và chữ viết",
      "nghệ thuật ca và múa",
      "lễ hội truyền thống",
      "tôn giáo và đời sống"
    ];

    const cultureData: Record<string, { desc: string; id: string; keywords: string[] }> = {
      "trang phục truyền thống": {
        desc: "Trang phục truyền thống Khmer nổi bật với sắc màu rực rỡ và các họa tiết hoa văn tinh xảo như xà-rông và áo tầm-vông.",
        id: "culture_5",
        keywords: ["trang phục", "xà rông"]
      },
      "ngôn ngữ và chữ viết": {
        desc: "Ngôn ngữ và chữ viết Khmer là di sản quý báu, đóng vai trò quan trọng trong việc gìn giữ bản sắc văn hóa dân tộc.",
        id: "culture_4",
        keywords: ["ngôn ngữ", "chữ viết"]
      },
      "nghệ thuật ca và múa": {
        desc: "Nghệ thuật Khmer vô cùng phong phú với các điệu múa Rô-băm, dù-kê và âm nhạc ngũ âm truyền thống độc đáo.",
        id: "culture_3",
        keywords: ["nghệ thuật", "ca múa", "nhạc ngũ âm"]
      },
      "lễ hội truyền thống": {
        desc: "Các lễ hội Khmer như Chol Chnam Thmay, Sen Dolta và Ok Om Bok là những nét đẹp văn hóa truyền thống vô cùng đặc sắc.",
        id: "culture_",
        keywords: ["lễ hội", "chol chnam thmay", "sen dolta", "ok om bok"]
      },
      "tôn giáo và đời sống": {
        desc: "Tôn giáo và tín ngưỡng đóng vai trò cốt lõi trong đời sống người Khmer, với ngôi chùa là trung tâm sinh hoạt tâm linh.",
        id: "culture_",
        keywords: ["tôn giáo", "đời sống", "tín ngưỡng"]
      }
    };

    // 2. Kiểm tra từ khóa hợp lệ (Dựa trên toàn bộ dữ liệu có sẵn)
    const ALL_SPECIFIC_KEYWORDS = [
      ...Object.keys(pagodaMap),
      ...Object.keys(foodMap),
      ...CULTURES,
      ...Object.values(cultureData).flatMap(c => c.keywords)
    ];

    const ALLOWED_KEYWORDS = [
      "khmer", "chùa", "văn hóa", "ẩm thực", "món ăn", "lễ hội", "trà vinh", "sóc trăng", "an giang",
      "thạch", "sơn", "hiện vật", "bảo tàng", "di tích", "điêu khắc", "kiến trúc", "trang phục",
      ...ARTIFACTS_DB.map(a => a.name.toLowerCase()),
      ...ALL_SPECIFIC_KEYWORDS
    ];

    const isRelated = ALLOWED_KEYWORDS.some(keyword =>
      lowerMsg.includes(keyword)
    );

    if (!isRelated) {
      return "Xin lỗi, tôi chỉ hỗ trợ nội dung văn hóa Khmer Nam Bộ trong ứng dụng KhmerGo.";
    }

    // 3. Phản hồi nhanh (Fast Path Execution) - Ưu tiên từ cụ thể
    const greetings = ["chào", "hi", "hello", "xin chào", "bạn ơi"];
    if (greetings.some(g => lowerMsg === g || lowerMsg.startsWith(g + " "))) {
      return "Chào bạn! Mình là KhmerGo AI. Mình có thể giúp gì cho bạn về văn hóa Khmer Nam Bộ không?";
    }

    // Kiểm tra Chùa
    const matchedPagoda = Object.keys(pagodaMap).find(p => lowerMsg.includes(p));
    if (matchedPagoda) return pagodaMap[matchedPagoda];

    // Kiểm tra Món ăn
    const matchedFood = Object.keys(foodMap).find(f => lowerMsg.includes(f));
    if (matchedFood) return foodMap[matchedFood];

    // Kiểm tra Văn hóa
    const matchedCultureKey = CULTURES.find(key =>
      lowerMsg.includes(key) || cultureData[key].keywords.some(kw => lowerMsg.includes(kw))
    );
    if (matchedCultureKey) {
      const { desc, id } = cultureData[matchedCultureKey];
      return `${desc} [LINK:${id}]`;
    }

    // DANH MỤC TỔNG QUÁT (Chỉ bắt nếu không khớp từ khóa cụ thể ở trên)
    if (lowerMsg.includes("ẩm thực") || lowerMsg.includes("món ăn")) {
      return "Ẩm thực Khmer nổi bật với hương vị đậm đà, sự kết hợp hài hòa giữa gia vị truyền thống và các nguyên liệu địa phương. [LINK:food_all]";
    }
    if (lowerMsg.includes("văn hóa")) {
      return "Văn hóa Khmer là sự kết tinh của tín ngưỡng, nghệ thuật và phong tục tập quán độc đáo được gìn giữ qua hàng thế kỷ. [LINK:culture_all]";
    }
    if (lowerMsg.includes("chùa")) {
      return "Các ngôi chùa Khmer là trung tâm sinh hoạt văn hóa và giáo dục cộng đồng với kiến trúc mái cong nhiều tầng độc đáo. [LINK:pagoda_all]";
    }

    // 4. Gọi Groq AI nếu không có Fast Path
    const artifactsBrief = ARTIFACTS_DB.map(a =>
      `${a.name} (ID: ${a.id}): ${a.description}`
    ).join("\n");

    const prompt = `Bạn là KhmerGo AI.

DỮ LIỆU KHMERGO:
${artifactsBrief}

GIỚI HẠN CÂU TRẢ LỜI:
- Tối đa 2 câu.
- Từ 25 đến 30 từ. Không quá 35 từ.
- Không xuống dòng.
- Không liệt kê danh sách.
- Chỉ trả lời bằng tiếng Việt.

QUY TẮC TUYỆT ĐỐI:
- Chỉ được trả lời bằng dữ liệu KhmerGo. Không sử dụng kiến thức ngoài.
- Nếu không thuộc dữ liệu KhmerGo: "Xin lỗi, tôi chỉ hỗ trợ nội dung văn hóa Khmer Nam Bộ trong ứng dụng KhmerGo."
- Mọi câu trả lời (trừ lời chào) LUÔN kết thúc bằng 1 mã [LINK:...].

VÍ DỤ ĐỂ HỌC THEO:
1. Chùa Âng là một trong những ngôi chùa Khmer cổ và nổi tiếng nhất tại Trà Vinh, mang giá trị lịch sử và kiến trúc đặc sắc. [LINK:pagoda_1]
2. Ẩm thực Khmer Nam Bộ nổi bật với nhiều món ăn truyền thống mang hương vị đặc trưng, phản ánh đời sống và văn hóa cộng đồng Khmer. [LINK:food_all]
3. Văn hóa Khmer Nam Bộ chứa đựng nhiều giá trị về tín ngưỡng, nghệ thuật và lễ hội truyền thống được gìn giữ qua nhiều thế hệ. [LINK:culture_all]

QUY TẮC PHỤ:
- LINK luôn nằm cuối.
- Trả lời ngắn gọn, trang trọng.
`;

    const apiKey = await getGroqApiKey();
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: message },
        ],
        temperature: 0,
        max_tokens: 60,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content
      .replace(/[\r\n]+/g, " ")
      .trim();

    const linkMatch = content.match(/\[[^\]]*?LINK[\s\S]*?\]/i);
    const linkTag = linkMatch ? linkMatch[0] : "";
    if (linkTag) {
      content = content.replace(linkTag, "").trim();
    }

    const words = content.split(/\s+/);
    if (words.length > 35) {
      content = words.slice(0, 35).join(" ");
    }

    if (linkTag) {
      content = content.trim() + " " + linkTag;
    }

    return content.trim();
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw error;
  }
};

export const analyzeImage = async (base64Image: string): Promise<{
  artifact?: { name: string; features: string };
  isRecognized?: boolean;
  rawResponse?: string;
}> => {
  try {
    const apiKey = await getGroqApiKey();
    const artifactsList = ARTIFACTS_DB.map(a => `- ${a.name}: ${a.description}`).join('\n');

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Bạn là chuyên gia về văn hóa Khmer Nam Bộ. Hãy phân tích hình ảnh này.
DỮ LIỆU HIỆN VẬT CÓ SẴN:
${artifactsList}

YÊU CẦU:
1. Nếu là hiện vật trong danh sách trên, hãy trả về CHỈ mã JSON sau: {"artifactName": "Tên chính xác trong danh sách"}
2. Nếu là hiện vật Khmer nhưng không có trong danh sách, hãy mô tả ngắn gọn (30 từ) và trả về: {"isKhmer": true, "description": "..."}
3. Nếu không liên quan văn hóa Khmer, hãy trả về: {"isKhmer": false}`
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Image}` }
              }
            ]
          }
        ],
        temperature: 0,
        max_tokens: 300,
      }),
    });

    if (!response.ok) throw new Error("Vision API Error");

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // Tìm kiếm JSON trong phản hồi
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);

      if (result.artifactName) {
        const artifact = ARTIFACTS_DB.find(a => a.name === result.artifactName);
        if (artifact) return { artifact: { name: artifact.name, features: artifact.features } };
      }

      if (result.isKhmer) {
        return { isRecognized: true, rawResponse: result.description };
      }
    }

    return { isRecognized: false };
  } catch (error) {
    console.error("Analyze Image Error:", error);
    return { isRecognized: false };
  }
};

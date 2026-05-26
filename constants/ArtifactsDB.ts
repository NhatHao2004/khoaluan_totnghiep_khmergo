export interface Artifact {
  id: string;
  name: string;
  description: string;
  features: string;
  imageUrl?: string;
}

export const ARTIFACTS_DB: Artifact[] = [
  {
    id: "1",
    name: "Kinh lá buông",
    description:
      "Bộ kinh cổ khắc chữ Khmer trên lá buông, lưu giữ giáo lý Phật giáo Nam tông Khmer.",
    features:
      "Kinh lá buông được chế tác từ lá cây buông có hình dài, bản rộng và màu vàng nâu hoặc nâu sẫm theo thời gian. Bề mặt lá được xử lý bằng cách phơi nắng, phơi sương và nhúng nước sôi để tăng độ bền. Chữ trên kinh không viết bằng mực mà được khắc trực tiếp bằng bút kim loại nhọn gọi là Đek-cha, sau đó phủ hỗn hợp than và dầu để hiện rõ nét chữ màu đen. Nội dung thường viết bằng chữ Khmer cổ hoặc tiếng Pali, bao gồm kinh Phật, giáo lý, truyện dân gian, lịch pháp và tri thức dân gian Khmer. Mỗi lá kinh có dạng hình chữ nhật dài, được đục lỗ ở giữa hoặc hai đầu để xâu dây thành từng bộ và kẹp giữa hai tấm gỗ bảo vệ. Nét chữ nhỏ, đều, thẳng hàng thể hiện sự tỉ mỉ, kiên nhẫn và trình độ thủ công tinh xảo của người viết. Kinh lá buông thường được lưu giữ trong các chùa Khmer Nam Bộ và được xem là báu vật tâm linh của cộng đồng Khmer.",

  },

  {
    id: "2",
    name: "Bình gốm Óc Eo",
    description:
      "Hiện vật gốm cổ thuộc văn hóa Óc Eo, dùng trong sinh hoạt và nghi lễ tôn giáo.",
    features:
      "Bình gốm Óc Eo có niên đại khoảng thế kỷ I-VII, được làm từ đất nung mịn với xương gốm chắc và màu sắc đặc trưng như đỏ nâu, nâu hồng hoặc xám đen. Bình thường có thân phình tròn, cổ cao thon nhỏ, miệng loe rộng và đôi khi có vòi kiểu Kendi dùng trong nghi lễ tôn giáo cổ. Bề mặt gốm được làm nhẵn bằng kỹ thuật xoa thủ công và thường trang trí hoa văn khắc vạch, sóng nước, tam giác hoặc đường tròn đồng tâm. Gốm thường không phủ men nhưng mang màu tự nhiên đậm chất cổ xưa. Một số hiện vật còn có dấu vết tô màu đỏ hoặc đen. Các bình gốm thường được tìm thấy tại khu di tích đền tháp, nơi cư trú và khu vực tín ngưỡng cổ ở Nam Bộ, phản ánh đời sống sinh hoạt, tín ngưỡng và sự giao thoa văn hóa của cư dân Óc Eo.",

  },

  {
    id: "3",
    name: "Tượng Apsara",
    description:
      "Tượng vũ nữ thiên giới trong nghệ thuật Khmer cổ và văn minh Angkor.",
    features:
      "Tượng Apsara thể hiện hình ảnh tiên nữ thiên giới trong văn hóa Khmer và Ấn Độ giáo với vẻ đẹp thanh thoát, dáng múa uyển chuyển và gương mặt hiền hòa. Nhân vật thường mặc trang phục sampot ôm sát cơ thể, đeo nhiều trang sức tinh xảo như vòng cổ, vòng tay và thắt lưng vàng. Điểm nhận biết nổi bật nhất là phần mũ đội đầu cao nhiều chóp mang phong cách Angkor cổ. Tượng thường được chạm khắc trên đá sa thạch hoặc phù điêu tại các đền đài Khmer cổ như Angkor Wat. Các động tác tay mềm mại, ngón tay cong uyển chuyển cùng nụ cười nhẹ tạo cảm giác linh thiêng và thanh cao. Trong nghệ thuật Khmer, Apsara không chỉ tượng trưng cho vẻ đẹp nữ tính mà còn đại diện cho nghệ thuật múa cổ truyền, đời sống tâm linh và nền văn minh Angkor huy hoàng.",

  },

  {
    id: "4",
    name: "Mặt nạ múa Rô-băm",
    description:
      "Mặt nạ truyền thống dùng trong sân khấu múa Rô-băm và nghệ thuật Khmer Nam Bộ.",
    features:
      "Mặt nạ múa Rô-băm có màu sắc rực rỡ, hoa văn cầu kỳ và hình dáng mang đậm phong cách nghệ thuật Khmer cổ. Mặt nạ thường được tạo hình thành các nhân vật như chằn, thần linh, khỉ thần hoặc anh hùng sử thi với biểu cảm dữ tợn hoặc hiền hòa tùy vai diễn. Các chi tiết như mắt lớn, răng nanh, mũi cao và họa tiết xoắn được vẽ nổi bật nhằm thể hiện tính cách nhân vật. Nhiều mặt nạ còn được gắn kim sa, hạt cườm và trang trí màu vàng óng tượng trưng cho quyền lực và sự linh thiêng. Sản phẩm được làm thủ công qua nhiều công đoạn như tạo khuôn, dán giấy, phơi khô, mài nhẵn, sơn màu và vẽ hoa văn tinh xảo. Đây không chỉ là đạo cụ sân khấu rô băm, dù kê mà còn là biểu tượng văn hóa phản ánh tín ngưỡng, nghệ thuật và bản sắc của đồng bào Khmer Nam Bộ.",
  },
];

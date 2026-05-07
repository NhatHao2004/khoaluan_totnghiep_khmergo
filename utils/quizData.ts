
export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PagodaQuizData {
  pagodaId: string;
  pagodaName: string;
  pagodaNameKm: string;
  location: string;
  image: any;
  color: string;
  accentColor: string;
  questions: MCQQuestion[];
}

export const PAGODA_QUIZZES: PagodaQuizData[] = [
  {
    pagodaId: 'pagoda_1',
    pagodaName: 'Chùa Âng',
    pagodaNameKm: 'វត្តអង្គ',
    location: 'Phường 8, TP. Trà Vinh',
    image: require('@/assets/images/chuaang.jpg'),
    color: '#FF6B2C',
    accentColor: '#FFF3EE',
    questions: [
      {
        id: 'p1_q1',
        question: 'Chùa Âng tọa lạc tại tỉnh nào của Việt Nam?',
        options: ['Sóc Trăng', 'Trà Vinh', 'Cần Thơ', 'Vĩnh Long'],
        correctIndex: 1,
        explanation: 'Chùa Âng (Angkor Rajaborey) nằm tại Phường 8, TP. Trà Vinh, là ngôi chùa Khmer cổ kính và nổi tiếng nhất Trà Vinh.',
      },
      {
        id: 'p1_q2',
        question: 'Khuôn viên Chùa Âng nổi tiếng với hàng cây cổ thụ nào?',
        options: ['Cây dừa', 'Cây dầu', 'Cây xoài', 'Cây bồ đề'],
        correctIndex: 1,
        explanation: 'Chùa Âng nổi tiếng với hàng cây dầu cổ thụ hàng trăm năm tuổi, tạo nên không gian xanh mát và linh thiêng đặc trưng.',
      },
      {
        id: 'p1_q3',
        question: 'Chùa Âng được xây dựng vào khoảng thế kỷ nào?',
        options: ['Thế kỷ 5', 'Thế kỷ 7', 'Thế kỷ 10', 'Thế kỷ 15'],
        correctIndex: 2,
        explanation: 'Chùa Âng có lịch sử hơn 1.000 năm, được xây dựng vào khoảng thế kỷ thứ 10, là một trong những ngôi chùa cổ nhất vùng đồng bằng sông Cửu Long.',
      },
      {
        id: 'p1_q4',
        question: 'Kiến trúc Chùa Âng chịu ảnh hưởng phong cách của nền văn hóa nào?',
        options: ['Trung Hoa', 'Ấn Độ cổ đại', 'Java (Indonesia)', 'Angkor (Campuchia)'],
        correctIndex: 3,
        explanation: 'Chùa Âng mang kiến trúc đặc trưng phong cách Angkor với những đường nét tinh xảo, tháp nhọn và hoa văn trang trí đặc trưng văn hóa Khmer.',
      },
      {
        id: 'p1_q5',
        question: 'Người Khmer tại Chùa Âng theo tông phái Phật giáo nào?',
        options: ['Đại thừa (Mahayana)', 'Kim cương thừa', 'Nguyên thủy (Theravada)', 'Thiền tông'],
        correctIndex: 2,
        explanation: 'Phật giáo Nguyên thủy (Theravada) là tông phái chủ đạo của người Khmer Nam Bộ, khác với người Kinh chủ yếu theo Đại thừa.',
      },
    ],
  },
  {
    pagodaId: 'pagoda_2',
    pagodaName: 'Chùa Hang',
    pagodaNameKm: 'វត្តហ៊ាំង',
    location: 'TP. Trà Vinh, tỉnh Trà Vinh',
    image: require('@/assets/images/chuahang.jpg'),
    color: '#FF6B2C',
    accentColor: '#FFF3EE',
    questions: [
      {
        id: 'p2_q1',
        question: 'Chùa Hàng còn có tên tiếng Khmer là gì?',
        options: ['Kompissako', 'Veluvana', 'Âng Chum', 'Puthisomaran'],
        correctIndex: 0,
        explanation: 'Chùa Hàng có tên tiếng Khmer là Kompissako, là ngôi chùa nổi tiếng ở Trà Vinh với kiến trúc độc đáo.',
      },
      {
        id: 'p2_q2',
        question: 'Tên "Chùa Hàng" bắt nguồn từ đặc điểm kiến trúc nào của ngôi chùa?',
        options: ['Có hàng cây xanh trước cổng', 'Có hai hang đá ở hai bên cổng chính', 'Nằm bên hàng xóm chùa Âng', 'Có hàng tháp chuông nhỏ'],
        correctIndex: 1,
        explanation: 'Chùa Hàng nổi tiếng với hai công trình hình hang đá (grotte) xây hai bên cổng chính, là điểm kiến trúc độc đáo hiếm có khiến du khách dễ nhận ra.',
      },
      {
        id: 'p2_q3',
        question: 'Chùa Hàng thuộc địa phận tỉnh/thành phố nào?',
        options: ['TP. Sóc Trăng', 'TP. Cần Thơ', 'TP. Trà Vinh', 'TP. Vĩnh Long'],
        correctIndex: 2,
        explanation: 'Chùa Hàng (Kompissako) tọa lạc tại TP. Trà Vinh, tỉnh Trà Vinh, cùng địa bàn với Chùa Âng nổi tiếng.',
      },
      {
        id: 'p2_q4',
        question: 'Ngôi chùa Hàng thường tổ chức lễ hội lớn nhất vào dịp nào?',
        options: ['Chol Chnam Thmay (Tết Khmer)', 'Tết Nguyên Đán', 'Lễ Giáng Sinh', 'Tết Trung Thu'],
        correctIndex: 0,
        explanation: 'Chol Chnam Thmay (Tết Khmer) là lễ hội lớn nhất trong năm của người Khmer, thường diễn ra vào tháng 4 Dương lịch, được tổ chức trang trọng tại các chùa Khmer như Chùa Hàng.',
      },
      {
        id: 'p2_q5',
        question: 'Màu sắc đặc trưng nhất thường thấy trên kiến trúc các ngôi chùa Khmer như Chùa Hàng là?',
        options: ['Đỏ và đen', 'Trắng và xanh lam', 'Vàng và cam', 'Nâu đất và kem'],
        correctIndex: 2,
        explanation: 'Vàng và cam là hai màu đặc trưng của kiến trúc chùa Khmer, tượng trưng cho ánh sáng của Phật pháp và sự thịnh vượng trong văn hóa Khmer.',
      },
    ],
  },
  {
    pagodaId: 'pagoda_3',
    pagodaName: 'Chùa Kampong',
    pagodaNameKm: 'វត្តកំពង់',
    location: 'Tỉnh Trà Vinh',
    image: require('@/assets/images/kampong.jpg'),
    color: '#FF6B2C',
    accentColor: '#FFF3EE',
    questions: [
      {
        id: 'p3_q1',
        question: 'Trong tiếng Khmer, "Kampong" có nghĩa là gì?',
        options: ['Ngọn núi', 'Bến sông / Cảng nhỏ', 'Khu rừng', 'Cánh đồng lúa'],
        correctIndex: 1,
        explanation: '"Kampong" trong tiếng Khmer có nghĩa là bến/cảng nhỏ bên sông, cho thấy ngôi chùa này tọa lạc gần một bến sông, gắn liền với đời sống sông nước của người Khmer Nam Bộ.',
      },
      {
        id: 'p3_q2',
        question: 'Chùa Kampong thuộc tỉnh nào của Việt Nam?',
        options: ['Bạc Liêu', 'Kiên Giang', 'Trà Vinh', 'An Giang'],
        correctIndex: 2,
        explanation: 'Chùa Kampong tọa lạc tại tỉnh Trà Vinh, một trong những địa phương có đông người Khmer sinh sống và nhiều chùa Khmer cổ kính nhất.',
      },
      {
        id: 'p3_q3',
        question: 'Ngôi chùa Kampong thờ ai là chủ yếu?',
        options: ['Thần Hindu', 'Đức Phật Thích Ca Mâu Ni', 'Thần Naga (rắn thần)', 'Tổ tiên người Khmer'],
        correctIndex: 1,
        explanation: 'Toàn bộ các chùa Khmer theo Phật giáo Nguyên thủy đều thờ Đức Phật Thích Ca Mâu Ni là trung tâm, với những tượng Phật được chạm khắc công phu.',
      },
      {
        id: 'p3_q4',
        question: 'Biểu tượng rắn Naga trong kiến trúc chùa Kampong tượng trưng cho điều gì?',
        options: ['Điềm xấu và thử thách', 'Thần bảo hộ và phồn thịnh', 'Chiến tranh và sức mạnh', 'Cái chết và tái sinh'],
        correctIndex: 1,
        explanation: 'Rắn Naga (rồng) là biểu tượng quan trọng trong kiến trúc Khmer, tượng trưng cho thần bảo hộ, sự phồn thịnh và nguồn nước dồi dào – rất quan trọng với người Khmer sống gần sông.',
      },
      {
        id: 'p3_q5',
        question: 'Sư sãi trong chùa Kampong thực hiện nghi thức quan trọng nào mỗi sáng?',
        options: ['Đi khất thực (bình bát)', 'Lên núi cầu nguyện', 'Tắm sông lúc bình minh', 'Đọc kinh Vệ Đà'],
        correctIndex: 0,
        explanation: 'Nghi thức đi khất thực (khất thực bình bát) mỗi sáng sớm là truyền thống thiêng liêng của các sư sãi Phật giáo Nguyên thủy tại các chùa Khmer, thể hiện sự gắn kết giữa tu sĩ và cộng đồng.',
      },
    ],
  },
  {
    pagodaId: 'pagoda_4',
    pagodaName: 'Chùa Sà Lôn',
    pagodaNameKm: 'វត្តសាឡុន',
    location: 'Huyện Mỹ Xuyên, Sóc Trăng',
    image: require('@/assets/images/salengcu.jpg'),
    color: '#FF6B2C',
    accentColor: '#FFF3EE',
    questions: [
      {
        id: 'p4_q1',
        question: 'Chùa Sà Lôn (Chùa Chén Kiểu) tọa lạc tại tỉnh nào?',
        options: ['Trà Vinh', 'Cần Thơ', 'Sóc Trăng', 'Bạc Liêu'],
        correctIndex: 2,
        explanation: 'Chùa Sà Lôn, còn gọi là Chùa Chén Kiểu, tọa lạc tại huyện Mỹ Xuyên, tỉnh Sóc Trăng – nơi có cộng đồng người Khmer đông đúc nhất vùng đồng bằng sông Cửu Long.',
      },
      {
        id: 'p4_q2',
        question: 'Chùa Sà Lôn có biệt danh phổ biến bắt nguồn từ đặc điểm nào?',
        options: ['Xây bằng toàn đá cẩm thạch', 'Được trang trí bằng hàng nghìn mảnh chén sứ', 'Có hồ sen khổng lồ', 'Mái chùa hình lưỡi kiếm'],
        correctIndex: 1,
        explanation: 'Chùa Sà Lôn còn gọi là "Chùa Chén Kiểu" vì toàn bộ bề mặt kiến trúc được trang trí, ốp lát bằng hàng nghìn mảnh chén, đĩa sứ vỡ ghép lại tạo thành những hoa văn độc đáo, là kỹ thuật trang trí hiếm có.',
      },
      {
        id: 'p4_q3',
        question: 'Nguyên liệu trang trí đặc trưng của Chùa Sà Lôn là gì?',
        options: ['Đá granit chạm khắc', 'Gốm sứ và mảnh chén vỡ', 'Vàng lá dát mỏng', 'Gỗ quý khắc nổi'],
        correctIndex: 1,
        explanation: 'Chùa Sà Lôn nổi tiếng với kỹ thuật trang trí bằng các mảnh chén, bát, đĩa sứ được ghép lại khéo léo tạo thành những họa tiết hoa văn Khmer tinh xảo, là di sản nghệ thuật độc đáo.',
      },
      {
        id: 'p4_q4',
        question: 'Lễ hội Dolta của người Khmer (tổ chức tại các chùa như Chùa Sà Lôn) tương đương với lễ nào của người Kinh?',
        options: ['Tết Nguyên Đán', 'Lễ Vu Lan (Rằm tháng 7)', 'Tết Trung Thu', 'Lễ Giỗ Tổ Hùng Vương'],
        correctIndex: 1,
        explanation: 'Lễ Dolta (Sen Dolta) của người Khmer diễn ra vào tháng 8 – 9 Âm lịch, là dịp tưởng nhớ tổ tiên, tương tự như lễ Vu Lan của người Kinh. Đây là một trong ba lễ hội lớn nhất của người Khmer.',
      },
      {
        id: 'p4_q5',
        question: 'Tỉnh Sóc Trăng có bao nhiêu dân tộc chính cùng sinh sống hòa hợp?',
        options: ['2 dân tộc', '3 dân tộc', '5 dân tộc', '7 dân tộc'],
        correctIndex: 1,
        explanation: 'Sóc Trăng là tỉnh có 3 dân tộc chính cùng sinh sống hòa hợp: người Kinh, người Khmer và người Hoa. Cộng đồng đa dân tộc này tạo nên bản sắc văn hóa phong phú và đặc sắc của địa phương.',
      },
    ],
  },
  {
    pagodaId: 'pagoda_5',
    pagodaName: 'Chùa Veluvana',
    pagodaNameKm: 'វត្តវេឡុវ័ន',
    location: 'Tỉnh Sóc Trăng',
    image: require('@/assets/images/veluvana.jpg'),
    color: '#FF6B2C',
    accentColor: '#FFF3EE',
    questions: [
      {
        id: 'p5_q1',
        question: '"Veluvana" là từ trong ngôn ngữ nào của Phật giáo?',
        options: ['Sanskrit (Phạn ngữ)', 'Pali', 'Tiếng Khmer cổ', 'Tiếng Hán cổ'],
        correctIndex: 1,
        explanation: '"Veluvana" là từ tiếng Pali – ngôn ngữ kinh điển của Phật giáo Nguyên thủy. Pali là ngôn ngữ được dùng để ghi chép Tam Tạng kinh điển và vẫn được các sư sãi Khmer Theravada học tập đến ngày nay.',
      },
      {
        id: 'p5_q2',
        question: 'Trong tiếng Pali, "Veluvana" có nghĩa là gì?',
        options: ['Núi thiêng liêng', 'Vườn tre (Trúc Lâm)', 'Dòng sông thánh', 'Ánh sáng mặt trời'],
        correctIndex: 1,
        explanation: '"Veluvana" nghĩa là "Vườn tre" hay "Trúc Lâm" trong tiếng Pali. Đây là tên của khu vườn nổi tiếng trong lịch sử Phật giáo, nơi Đức Phật từng cư trú và thuyết pháp.',
      },
      {
        id: 'p5_q3',
        question: 'Veluvana trong kinh Phật là khu vườn được vua Bimbisara dâng tặng cho Đức Phật, nằm ở vùng đất nào?',
        options: ['Vương quốc Magadha (Ấn Độ cổ)', 'Vương quốc Campuchia cổ', 'Vương quốc Siam (Thái Lan)', 'Vương quốc Ayutthaya'],
        correctIndex: 0,
        explanation: 'Veluvana là khu vườn tre tại Rajagaha, thuộc Vương quốc Magadha (nay là bang Bihar, Ấn Độ). Vua Bimbisara đã dâng tặng khu vườn này cho Đức Phật, và đây trở thành nơi Phật trú ngụ và truyền pháp.',
      },
      {
        id: 'p5_q4',
        question: 'Chùa Veluvana ở Sóc Trăng theo tông phái Phật giáo nào?',
        options: ['Phật giáo Đại thừa', 'Phật giáo Nguyên thủy (Theravada)', 'Phật giáo Mật tông', 'Phật giáo Thiền tông'],
        correctIndex: 1,
        explanation: 'Cũng như tất cả các chùa Khmer khác tại Việt Nam, Chùa Veluvana theo Phật giáo Nguyên thủy (Theravada) – tông phái gần nhất với Phật giáo thời kỳ đầu, được lưu truyền qua các dân tộc Đông Nam Á như Khmer, Thái, Myanmar.',
      },
      {
        id: 'p5_q5',
        question: 'Trong các chùa Khmer Theravada như Veluvana, hình tượng Phật thường được thể hiện ở tư thế nào?',
        options: ['Phật đứng giơ tay', 'Phật ngồi xếp bằng (Thiền định)', 'Phật nằm (Niết bàn)', 'Cả ba đều phổ biến'],
        correctIndex: 3,
        explanation: 'Trong chùa Khmer Theravada, người ta thờ Phật với nhiều tư thế: Phật ngồi thiền định (tượng trưng giác ngộ), Phật đứng (từ bi), và Phật nằm (Niết bàn). Cả ba tư thế đều phổ biến và mang ý nghĩa giáo lý sâu sắc.',
      },
    ],
  },
];

export interface VocabularyWord {
  id: string;
  vie: string;
  khm: string;
  pronunciation: string;
}

export interface VocabularyCategory {
  id: string;
  title: string;
  iconName: string; // Ionicons name
  color: string;
  words: VocabularyWord[];
}

// Dữ liệu mock tĩnh cho giai đoạn đầu tiên, sau này rảnh gõ lên Firebase sau.
export const VOCABULARY_CATEGORIES: VocabularyCategory[] = [
  {
    id: "greetings",
    title: "cat_greetings",
    iconName: "chatbubbles-outline",
    color: "#3B82F6", // Blue
    words: [
      { id: "g1", vie: "Xin chào", khm: "សួស្តី", pronunciation: "Suos-dei (Suốt-đây)" },
      { id: "g2", vie: "Chào buổi sáng", khm: "អរុណសួស្តី", pronunciation: "Arun suos-dei" },
      { id: "g3", vie: "Tạm biệt", khm: "លាហើយ", pronunciation: "Lea-her" },
      { id: "g4", vie: "Cảm ơn", khm: "អរគុណ", pronunciation: "Aw-kun" },
      { id: "g5", vie: "Xin lỗi", khm: "សុំទោស", pronunciation: "Som-tos" },
      { id: "g6", vie: "Bạn có khỏe không?", khm: "តើអ្នកសុខសប្បាយទេ?", pronunciation: "Tae neak sok-sa-bai te?" },
      { id: "g7", vie: "Tôi khỏe", khm: "ខ្ញុំសុខសប្បាយ", pronunciation: "Khnhom sok-sa-bai" },
      { id: "g8", vie: "Bạn tên gì?", khm: "អ្នកឈ្មោះអ្វី?", pronunciation: "Neak chhmua ei?" },
      { id: "g9", vie: "Tôi tên là...", khm: "ខ្ញុំឈ្មោះ...", pronunciation: "Khnhom chhmua..." },
      { id: "g10", vie: "Hẹn gặp lại", khm: "ជួបគ្នាម្តងទៀត", pronunciation: "Chuob knea mdong tiet" },
    ]
  },
  {
    id: "numbers",
    title: "cat_numbers",
    iconName: "calculator-outline",
    color: "#8B5CF6", // Purple
    words: [
      { id: "n1", vie: "Số 1", khm: "មួយ", pronunciation: "Muoy" },
      { id: "n2", vie: "Số 2", khm: "ពីរ", pronunciation: "Pir" },
      { id: "n3", vie: "Số 3", khm: "បី", pronunciation: "Bei" },
      { id: "n4", vie: "Số 4", khm: "បួន", pronunciation: "Buon" },
      { id: "n5", vie: "Số 5", khm: "ប្រាំ", pronunciation: "Pram" },
      { id: "n6", vie: "Số 6", khm: "ប្រាំមួយ", pronunciation: "Pram muoy" },
      { id: "n7", vie: "Số 7", khm: "ប្រាំពីរ", pronunciation: "Pram pir" },
      { id: "n8", vie: "Số 8", khm: "ប្រាំបី", pronunciation: "Pram bei" },
      { id: "n9", vie: "Số 9", khm: "ប្រាំបួន", pronunciation: "Pram buon" },
      { id: "n10", vie: "Số 10", khm: "ដប់", pronunciation: "Dop" },
    ]
  },
  {
    id: "family",
    title: "cat_family",
    iconName: "people-outline",
    color: "#EC4899", // Pink
    words: [
      { id: "f1", vie: "Tôi", khm: "ខ្ញុំ", pronunciation: "Khnhom" },
      { id: "f2", vie: "Bạn (dùng chung)", khm: "អ្នក", pronunciation: "Neak" },
      { id: "f3", vie: "Anh / Chị", khm: "បង", pronunciation: "Bong" },
      { id: "f4", vie: "Em", khm: "ប្អូន", pronunciation: "P'oun" },
      { id: "f5", vie: "Cha / Bố", khm: "ឪពុក", pronunciation: "Ov-puk" },
      { id: "f6", vie: "Mẹ / Má", khm: "ម្តាយ", pronunciation: "M'day" },
      { id: "f7", vie: "Ông", khm: "តា", pronunciation: "Ta" },
      { id: "f8", vie: "Bà", khm: "យាយ", pronunciation: "Yeay" },
      { id: "f9", vie: "Anh trai", khm: "បងប្រុស", pronunciation: "Bong bros" },
      { id: "f10", vie: "Chị gái", khm: "បងស្រី", pronunciation: "Bong srei" },
    ]
  },
  {
    id: "food",
    title: "cat_food",
    iconName: "restaurant-outline",
    color: "#10B981", // Emerald
    words: [
      { id: "fo1", vie: "Ăn cơm", khm: "ហូបបាយ / ញុំាបាយ", pronunciation: "Hop bai / Nhom bai" },
      { id: "fo2", vie: "Uống nước", khm: "ផឹកទឹក", pronunciation: "Pheuk tuk" },
      { id: "fo3", vie: "Ngon lắm", khm: "ឆ្ងាញ់ណាស់", pronunciation: "Chnganh nas" },
      { id: "fo4", vie: "Thịt bò", khm: "សាច់គោ", pronunciation: "Sach ko" },
      { id: "fo5", vie: "Thịt heo", khm: "សាច់ជ្រូក", pronunciation: "Sach chruk" },
      { id: "fo6", vie: "Thịt gà", khm: "សាច់មាន់", pronunciation: "Sach moan" },
      { id: "fo7", vie: "Tính tiền", khm: "គិតលុយ", pronunciation: "Kit luy" },
      { id: "fo8", vie: "Cơm", khm: "បាយ", pronunciation: "Bai" },
      { id: "fo9", vie: "Nước", khm: "ទឹក", pronunciation: "Tuk" },
      { id: "fo10", vie: "Món ăn", khm: "ម្ហូប", pronunciation: "Mhoob" },
    ]
  }
];

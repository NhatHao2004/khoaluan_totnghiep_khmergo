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
    title: "Chào hỏi cơ bản",
    iconName: "chatbubbles-outline",
    color: "#3B82F6", // Blue
    words: [
      { id: "g1", vie: "Xin chào", khm: "សួស្តី", pronunciation: "Suo s'dei (Xua x-đây)" },
      { id: "g2", vie: "Chào buổi sáng", khm: "អរុណសួស្តី", pronunciation: "Arun suo s'dei" },
      { id: "g3", vie: "Tạm biệt", khm: "លាហើយ", pronunciation: "Lia heuy" },
      { id: "g4", vie: "Cảm ơn", khm: "អរគុណ", pronunciation: "Or kun" },
      { id: "g5", vie: "Xin lỗi", khm: "សុំទោស", pronunciation: "Som tos" },
      { id: "g6", vie: "Bạn có khỏe không?", khm: "តើអ្នកសុខសប្បាយទេ?", pronunciation: "Dae neak sok s'bay te?" },
      { id: "g7", vie: "Tôi khỏe", khm: "ខ្ញុំសុខសប្បាយ", pronunciation: "Kynhom sok s'bay" },
    ]
  },
  {
    id: "numbers",
    title: "Số đếm",
    iconName: "calculator-outline",
    color: "#F59E0B", // Amber
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
    title: "Gia đình và Xưng hô",
    iconName: "people-outline",
    color: "#EC4899", // Pink
    words: [
      { id: "f1", vie: "Tôi", khm: "ខ្ញុំ", pronunciation: "Kynhom" },
      { id: "f2", vie: "Bạn (dùng chung)", khm: "អ្នក", pronunciation: "Neak" },
      { id: "f3", vie: "Anh / Chị", khm: "បង", pronunciation: "Bong" },
      { id: "f4", vie: "Em", khm: "ប្អូន", pronunciation: "P'oun" },
      { id: "f5", vie: "Cha / Bố", khm: "ឪពុក", pronunciation: "Euv puk" },
      { id: "f6", vie: "Mẹ / Má", khm: "ម្តាយ", pronunciation: "Mday" },
      { id: "f7", vie: "Ông", khm: "តា", pronunciation: "Ta" },
      { id: "f8", vie: "Bà", khm: "យាយ", pronunciation: "Yeay" },
    ]
  },
  {
    id: "food",
    title: "Ẩm thực",
    iconName: "restaurant-outline",
    color: "#10B981", // Emerald
    words: [
      { id: "fo1", vie: "Ăn cơm", khm: "ហូបបាយ / ញុំាបាយ", pronunciation: "Hob bai / Nham bai" },
      { id: "fo2", vie: "Uống nước", khm: "ផឹកទឹក", pronunciation: "Phok tuk" },
      { id: "fo3", vie: "Ngon lắm", khm: "ឆ្ងាញ់ណាស់", pronunciation: "Chh-nganh nah" },
      { id: "fo4", vie: "Thịt bò", khm: "សាច់គោ", pronunciation: "Sach ko" },
      { id: "fo5", vie: "Thịt heo", khm: "សាច់ជ្រូក", pronunciation: "Sach chruk" },
      { id: "fo6", vie: "Thịt gà", khm: "សាច់មាន់", pronunciation: "Sach mon" },
      { id: "fo7", vie: "Tính tiền", khm: "គិតលុយ", pronunciation: "Kit luy" },
    ]
  }
];

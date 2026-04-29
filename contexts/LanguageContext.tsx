import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'vi' | 'km';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  vi: {
    // Common
    leaderboard: 'Bảng xếp hạng',
    weekly: 'Hàng tuần',
    all_time: 'Tất cả',
    settings: 'Cài đặt ứng dụng',
    language: 'Ngôn ngữ',
    vietnamese: 'Tiếng Việt',
    khmer: 'Tiếng Khmer',
    back: 'Quay lại',
    confirm: 'Xác nhận',
    close: 'Đóng',
    save: 'Lưu',
    login: 'Đăng nhập tài khoản',

    // Settings Screen
    notif_settings: 'Thông báo',
    study_reminder: 'Nhắc học bài mỗi ngày',
    reminder_time: 'Thời gian nhắc',
    app_info: 'Thông tin ứng dụng',
    intro: 'Giới thiệu',
    version: 'Phiên bản',
    // Support Screen
    support_feedback: 'Hỗ trợ và Phản hồi',
    feedback_type: 'Loại phản hồi',
    suggestion: 'Góp ý',
    report_issue: 'Báo lỗi',
    subject: 'Tiêu đề',
    detail: 'Nội dung chi tiết',
    send_feedback: 'Gửi phản hồi',
    login_to_send: 'Đăng nhập để gửi phản hồi',
    // Profile Screen
    my_profile: 'Hồ sơ của tôi',
    edit_profile: 'Chỉnh sửa hồ sơ',
    favorites: 'Nội dung yêu thích',
    logout: 'Đăng xuất',
    logout_full: 'Đăng xuất tài khoản',
    points: 'Điểm',
    rank: 'Thành tích',
    guest: 'Khách',
    login_to_view: 'Đăng nhập để xem thông tin',
    login_to_use: 'Đăng nhập để sử dụng tính năng này',
    logout_confirm_msg: 'Bạn có chắc chắn muốn đăng xuất',
    login_required: 'Yêu cầu đăng nhập',
    // Ranks
    rank_bronze: 'Đồng',
    rank_silver: 'Bạc',
    rank_gold: 'Vàng',
    rank_diamond: 'Kim cương',

    // Quiz Screen
    quiz_title: 'Thử thách',
    start_quiz: 'Bắt đầu',
    daily_challenge: 'Thử thách hằng ngày',
    quiz_desc: 'Vượt qua các câu hỏi để tích lũy thêm điểm',
    total_score: 'Tổng điểm',
    current_rank: 'Hạng hiện tại',
    categories: 'Chủ đề',
    history: 'Lịch sử',
    geography: 'Địa lý',
    questions: 'Bộ câu hỏi',
    performance: 'Thành tích',
    view_all: 'Xem tất cả',
    completed: 'Hoàn thành',
    accuracy: 'Chính xác',
    recent_performance: 'Dựa trên các bài thi gần đây',
    choose_topic: 'Hôm nay bạn muốn học về gì nào',
    general_knowledge: 'Kiến thức',
    pagoda_quiz: 'Chùa Khmer',
    culture_quiz: 'Văn hóa Khmer',
    food_quiz: 'Ẩm thực Khmer',
    vocab_quiz: 'Học tiếng Khmer',

    // Personal Info
    personal_info: 'Thông tin cá nhân',
    full_name: 'Họ và tên',
    email: 'Email',
    change_password: 'Đổi mật khẩu',
    current_password: 'Mật khẩu hiện tại',
    new_password: 'Mật khẩu mới',
    confirm_new_password: 'Xác nhận mật khẩu mới',
    save_changes: 'Lưu thay đổi',
    error: 'Lỗi',
    name_required: 'Họ và tên không được để trống',
    not_logged_in: 'Chưa đăng nhập',
    pass_fields_required: 'Vui lòng điền đầy đủ các trường để đổi mật khẩu',
    pass_mismatch: 'Mật khẩu mới không khớp',
    pass_too_short: 'Mật khẩu mới tối thiểu 6 ký tự',
    user_not_found: 'Không tìm thấy tài khoản',
    wrong_old_pass: 'Mật khẩu hiện tại không chính xác',
    update_success: 'Cập nhật thành công',
    update_failed: 'Cập nhật thất bại',
    // Support Screen Extra
    faq: 'Câu hỏi thường gặp',
    feedback_section: 'Gửi phản hồi cho chúng tôi',
    feedback_placeholder: 'Chúng tôi luôn lắng nghe các ý kiến đóng góp của bạn để hoàn thiện ứng dụng...',
    subject_placeholder: 'Nhập tiêu đề phản hồi...',
    subject_required: 'Vui lòng nhập tiêu đề',
    content_required: 'Vui lòng nhập nội dung phản hồi',
    feedback_success: 'Đã gửi phản hồi thành công! Cảm ơn bạn.',
    feedback_failed: 'Gửi phản hồi thất bại. Vui lòng thử lại.',
    // FAQ Extra
    faq_how_to_use: 'Cách sử dụng ứng dụng',
    faq_how_to_quiz: 'Cách làm bài kiểm tra',
    faq_how_to_learn: 'Cách học hiệu quả hơn',
    faq_use_content: 'Chào mừng bạn đến với KhmerGo! Để sử dụng ứng dụng, bạn có thể bắt đầu bằng cách khám phá các ngôi chùa tại mục Trang chủ, tham gia trả lời câu đố tại mục Thử thách để tích lũy điểm và thăng hạng.',
    faq_quiz_content: 'Mỗi bài trắc nghiệm sẽ có các câu hỏi về văn hóa và ngôn ngữ Khmer. Bạn cần chọn câu trả lời đúng trong thời gian quy định để nhận được điểm thưởng.',
    faq_learn_content: 'Để học hiệu quả, hãy luyện tập hàng ngày và sử dụng tính năng nhắc nhở học tập trong phần Cài đặt. Việc kết hợp giữa học từ vựng và tham gia thử thách sẽ giúp bạn ghi nhớ lâu hơn.',

    // Home Screen
    promotions: 'Khám phá ngay',
    category: 'Danh mục',
    see_all: 'Xem tất cả...',
    get_coupon: 'Xem',
    learn_now: 'Học ngay',
    temple: 'Chùa Khmer',
    culture: 'Văn hóa Khmer',
    food: 'Ẩm thực Khmer',
    language_study: 'Học tiếng Khmer',
    som_rong_temple: 'Chùa Som Rong',
    oc_om_boc_festival: 'Lễ hội Oóc Om Bóc',
    tra_vinh_vn: 'Trà Vinh, VN',
    soc_trang_vn: 'Sóc Trăng, VN',
    promo_pagoda_title: 'Khám phá 3 ngôi chùa\nnhận ưu đãi 50%',
    tagline: 'Khám phá nền văn hóa Khmer',
    search_placeholder: 'Tìm kiếm địa điểm...',
    you: 'Bạn',

    // Auth Screens
    login_title: 'Đăng nhập',
    register_title: 'Đăng ký',
    email_label: 'Email',
    password_label: 'Mật khẩu',
    confirm_password_label: 'Xác nhận mật khẩu',
    fullname_placeholder: 'Họ và tên',
    processing: 'Đang xử lý...',
    registering: 'Đang tạo tài khoản...',
    login_with: 'Đăng nhập bằng',
    terms: 'Điều khoản dịch vụ',
    error_required: 'Vui lòng điền đầy đủ các trường',
  },
  km: {
    // Common
    leaderboard: 'តារាងពិន្ទុ',
    weekly: 'ប្រចាំសប្តាហ៍',
    all_time: 'គ្រប់ពេល',
    settings: 'ការកំណត់កម្មវិធី',
    language: 'ភាសា',
    vietnamese: 'ភាសាវៀតណាម',
    khmer: 'ភាសាខ្មែរ',
    back: 'ត្រឡប់ក្រោយ',
    confirm: 'បញ្ជាក់',
    close: 'បិទ',
    save: 'រក្សាទុក',
    cancel: 'បោះបង់',
    login: 'ចូល',
    // Settings Screen
    notif_settings: 'ការជូនដំណឹង',
    study_reminder: 'រំលឹកការសិក្សារាល់ថ្ងៃ',
    reminder_time: 'ម៉ោងរំលឹក',
    app_info: 'ព័ត៌មានកម្មវិធី',
    intro: 'អំពីយើង',
    version: 'ជំនាន់',
    // Support Screen
    support_feedback: 'ជំនួយ និងមតិកែលម្អ',
    feedback_type: 'ប្រភេទមតិកែលម្អ',
    suggestion: 'មតិកែលម្អ',
    report_issue: 'រាយការណ៍បញ្ហា',
    subject: 'ប្រធានបទ',
    detail: 'ខ្លឹមសារលម្អិត',
    send_feedback: 'ផ្ញើមតិកែលម្អ',
    login_to_send: 'ចូលដើម្បីផ្ញើមតិ',
    // Profile Screen
    my_profile: 'ប្រវត្តិរូបរបស់ខ្ញុំ',
    edit_profile: 'កែសម្រួលប្រវត្តិរូប',
    favorites: 'មាតិកាដែលចូលចិត្ត',
    logout: 'ចាកចេញ',
    logout_full: 'ចាកចេញពីគណនី',
    points: 'ពិន្ទុ',
    rank: 'សមិទ្ធផល',
    guest: 'ភ្ញៀវ',
    login_to_view: 'ចូលដើម្បីមើលព័ត៌មាន',
    login_to_use: 'ចូលដើម្បីប្រើប្រាស់មុខងារនេះ',
    logout_confirm_msg: 'តើអ្នកប្រាកដថាចង់ចាកចេញមែនទេ?',
    login_required: 'តម្រូវឱ្យចូល',
    // Ranks
    rank_bronze: 'សំរិទ្ធ',
    rank_silver: 'ប្រាក់',
    rank_gold: 'មាស',
    rank_diamond: 'ពេជ្រ',

    // Quiz Screen
    quiz_title: 'ការសាកល្បង',
    start_quiz: 'ចាប់ផ្តើម',
    daily_challenge: 'ការសាកល្បងប្រចាំថ្ងៃ',
    quiz_desc: 'ឆ្លងកាត់សំណួរដើម្បីទទួលបានពិន្ទុបន្ថែម!',
    total_score: 'ពិន្ទុរួម',
    current_rank: 'ចំណាត់ថ្នាក់បច្ចុប្បន្ន',
    categories: 'ប្រធានបទ',
    history: 'ប្រវត្តិសាស្ត្រ',
    geography: 'ភូមិសាស្ត្រ',
    questions: 'សំណួរ',
    performance: 'សមិទ្ធផល',
    view_all: 'មើលទាំងអស់',
    completed: 'បានបញ្ចប់',
    accuracy: 'ភាពត្រឹមត្រូវ',
    recent_performance: 'ផ្អែកលើការសាកល្បងថ្មីៗ',
    choose_topic: 'តើអ្នកចង់រៀនអ្វីនៅថ្ងៃនេះ',
    general_knowledge: 'ចំណេះដឹងទូទៅ',
    pagoda_quiz: 'វត្តខ្មែរ',
    culture_quiz: 'វប្បធម៌',
    food_quiz: 'ម្ហូបអាហារ',
    vocab_quiz: 'វាក្យសព្ទខ្មែរ',


    // Personal Info
    personal_info: 'ព័ត៌មានផ្ទាល់ខ្លួន',
    full_name: 'ឈ្មោះពេញ',
    email: 'អ៊ីមែល',
    change_password: 'ផ្លាស់ប្តូរពាក្យសម្ងាត់',
    current_password: 'ពាក្យសម្ងាត់បច្ចុប្បន្ន',
    new_password: 'ពាក្យសម្ងាត់ថ្មី',
    confirm_new_password: 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី',
    save_changes: 'រក្សាទុកការផ្លាស់ប្តូរ',
    error: 'កំហុស',
    name_required: 'ឈ្មោះមិនអាចនៅទំនេរទេ',
    not_logged_in: 'មិនទាន់បានចូល',
    pass_fields_required: 'សូមបំពេញគ្រប់ព័ត៌មានដើម្បីប្តូរពាក្យសម្ងាត់',
    pass_mismatch: 'ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នា',
    pass_too_short: 'ពាក្យសម្ងាត់ថ្មីយ៉ាងហោចណាស់ ៦ តួអក្សរ',
    user_not_found: 'រកមិនឃើញគណនី',
    wrong_old_pass: 'ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវ',
    update_success: 'បច្ចុប្បន្នភាពបានជោគជ័យ',
    update_failed: 'បច្ចុប្បន្នភាពបរាជ័យ',
    // Support Screen Extra
    faq: 'សំណួរដែលសួរញឹកញាប់',
    feedback_section: 'ផ្ញើមតិកែលម្អមកយើង',
    feedback_placeholder: 'យើងតែងតែស្តាប់មតិរបស់អ្នកដើម្បីកែលម្អកម្មវិធី...',
    subject_placeholder: 'បញ្ចូលប្រធានបទមតិ...',
    subject_required: 'សូមបញ្ចូលប្រធានបទ',
    content_required: 'សូមបញ្ចូលខ្លឹមសារមតិ',
    feedback_success: 'បានផ្ញើមតិដោយជោគជ័យ! អរគុណ។',
    feedback_failed: 'ផ្ញើមតិបរាជ័យ។ សូមព្យាយាមម្តងទៀត។',
    // FAQ Extra
    faq_how_to_use: 'របៀបប្រើកម្មវិធី',
    faq_how_to_quiz: 'របៀបធ្វើតេស្ត',
    faq_how_to_learn: 'របៀបរៀនឱ្យមានប្រសិទ្ធភាព',
    faq_use_content: 'សូម chào មកកាន់ KhmerGo! ដើម្បីប្រើកម្មវិធី អ្នក có thể ចាប់ផ្តើមដោយការរុករកវត្តអារាមនានានៅក្នុងទំព័រដើម ចូលរួមឆ្លើយសំណួរក្នុងផ្នែកសាកល្បង ដើម្បីបង្កើនពិន្ទុ និងតម្លើងឋានៈ។',
    faq_quiz_content: 'រាល់ការសាកល្បងនីមួយៗនឹងមានសំណួរអំពីវប្បធម៌ និងភាសាខ្មែរ។ អ្នកត្រូវជ្រើសរើសចម្លើយដែលត្រឹមត្រូវក្នុងរយៈពេលកំណត់ ដើម្បីទទួលបានពិន្ទុបន្ថែម។',
    faq_learn_content: 'ដើម្បីរៀនបានយ៉ាងមានប្រសិទ្ធភាព សូមហាត់រៀនជារៀងរាល់ថ្ងៃ និងប្រើមុខងាររំលឹកការសិក្សានៅក្នុងការកំណត់។ ការរួមបញ្ចូលគ្នារវាងការរៀនពាក្យ និងការសាកល្បងនឹងជួយឱ្យអ្នកចងចាំបានយូរ។',

    // Home Screen
    promotions: 'ការផ្សព្វផ្សាយ',
    category: 'ប្រភេទ',
    see_all: 'មើលទាំងអស់',
    get_coupon: 'ទទួលបានប័ណ្ណ',
    learn_now: 'រៀនឥឡូវនេះ',
    temple: 'វត្តអារាមខ្មែរ',
    culture: 'វប្បធម៌ខ្មែរ',
    food: 'ម្ហូបខ្មែរ',
    language_study: 'រៀនភាសាខ្មែរ',
    som_rong_temple: 'វត្តសំពៅរុង',
    oc_om_boc_festival: 'ពិធីបុណ្យអកអំបុក',
    tra_vinh_vn: 'ត្រាវិញ, វៀតណាម',
    soc_trang_vn: 'សុកត្រាំង, វៀតណាម',
    promo_pagoda_title: 'រុករកវត្ត ៣\nទទួលបានការបញ្ចុះតម្លៃ ៥០%',
    promo_vocab_title: 'បញ្ចុះតម្លៃ ៣០%\nលើវគ្គសិក្សាភាសា',
    tagline: 'ស្វែងយល់ពីវប្បធម៌ខ្មែរ',
    search_placeholder: 'ស្វែងរកទីតាំង...',
    you: 'អ្នក',

    // Auth Screens
    login_title: 'ចូលគណនី',
    register_title: 'ចុះឈ្មោះ',
    email_label: 'អ៊ីមែល',
    password_label: 'ពាក្យសម្ងាត់',
    confirm_password_label: 'បញ្ជាក់ពាក្យសម្ងាត់',
    fullname_placeholder: 'ឈ្មោះពេញ',
    processing: 'កំពុងដំណើរការ...',
    registering: 'កំពុងបង្កើតគណនី...',
    login_with: 'ចូលតាមរយៈ',
    terms: 'លក្ខខណ្ឌសេវាកម្ម',
    error_required: 'សូមបំពេញព័ត៌មានឱ្យគ្រប់គ្រាន់',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>('vi');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('appLanguage');
      if (savedLang === 'vi' || savedLang === 'km') {
        setLangState(savedLang);
      }
    } catch (error) {
      console.log('Error loading language', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLangState(lang);
    try {
      await AsyncStorage.setItem('appLanguage', lang);
    } catch (error) {
      console.log('Error saving language', error);
    }
  };

  const t = (key: string) => {
    const translation = translations[language][key as keyof typeof translations['vi']];
    if (!translation) {
      console.warn(`Missing translation key: ${key} for language: ${language}`);
      return translations['vi'][key as keyof typeof translations['vi']] || key;
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

import { db, auth } from '@/utils/firebaseConfig';
import { doc, setDoc, getDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Service xử lý gửi OTP và xác thực mã qua REST API của EmailJS
 */

const EMAILJS_SERVICE_ID = 'service_q6cuf7b';
const EMAILJS_TEMPLATE_ID = 'template_xpgn4j3';
const EMAILJS_PUBLIC_KEY = 'R_23JTyESZpodGdBB';

export const EmailService = {
  // 0. Kiểm tra Email đã tồn tại trong hệ thống chưa
  checkEmailExists: async (email: string) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Lỗi kiểm tra email:', error);
      return false;
    }
  },

  // 1. Tạo mã OTP ngẫu nhiên 6 chữ số
  generateOTP: () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // 2. Lưu OTP vào Firestore để xác thực sau này
  saveOTP: async (email: string, otp: string) => {
    const otpRef = doc(db, 'temp_otps', email.toLowerCase().trim());
    await setDoc(otpRef, {
      otp,
      createdAt: Timestamp.now(),
      expiresAt: new Timestamp(Timestamp.now().seconds + 300, 0), // Hết hạn sau 5 phút
    });
  },

  // 3. Gửi Email qua REST API (Ổn định 100%)
  sendOTPEmail: async (email: string, otp: string) => {
    try {
      const data = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: email,
          otp_code: otp,
        },
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost'
        },
        body: JSON.stringify(data),
      });

      return response.ok;
    } catch (error) {
      console.error('Lỗi kết nối tới EmailJS:', error);
      return false;
    }
  },

  // 4. Kiểm tra OTP người dùng nhập vào
  verifyOTP: async (email: string, inputOtp: string) => {
    const otpRef = doc(db, 'temp_otps', email.toLowerCase().trim());
    const snap = await getDoc(otpRef);
    
    if (!snap.exists()) return { success: false, msg: 'Mã xác thực không tồn tại' };
    
    const data = snap.data();
    const now = Timestamp.now();

    if (now.seconds > data.expiresAt.seconds) {
      return { success: false, msg: 'Mã xác thực đã hết hạn' };
    }

    if (data.otp !== inputOtp) {
      return { success: false, msg: 'Mã xác thực không chính xác' };
    }

    return { success: true };
  }
};

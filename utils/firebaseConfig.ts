import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDInHeTU4IWo4kVVsho62WcK6Vg9f83vfg",
  authDomain: "khmergo-ba0b0.firebaseapp.com",
  projectId: "khmergo-ba0b0",
  storageBucket: "khmergo-ba0b0.firebasestorage.app",
  messagingSenderId: "563133852511",
  appId: "1:563133852511:web:f5b7f2aebeab097a3064ea",
  measurementId: "G-LTBGS11WXY"
};

// Initialize Firebase (chỉ khởi tạo nếu chưa có app nào để tránh lỗi khi reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Khởi tạo và export Firestore
export const db = getFirestore(app);

// Khởi tạo Auth
// Ở React Native ta nên dùng persistence với AsyncStorage. Tuy thư viện firebase/auth có mặc định, 
// nhưng để chắc chắn state không mất khi reload, ta nạp rõ ràng. Tuy nhiên ở đây tạm dùng mặc định:
export const auth = getAuth(app);

// Khởi tạo Storage
export const storage = getStorage(app);

// Lưu ý: getAnalytics chỉ chạy tốt trên môi trường Web. Ở React Native (iOS/Android),
// thư viện firebase/analytics thường gây lỗi, nên tạm thời không kích hoạt.

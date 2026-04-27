import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA-9MFk8D-A-AqoY91KJYy6kZJ2QYAo60w",
  authDomain: "khmergo-f13d4.firebaseapp.com",
  projectId: "khmergo-f13d4",
  storageBucket: "khmergo-f13d4.firebasestorage.app",
  messagingSenderId: "183798011559",
  appId: "1:183798011559:web:91cf96a9e7465ea63dad82",
  measurementId: "G-8BZ12B94SQ"
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

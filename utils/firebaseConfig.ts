import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, setLogLevel } from "firebase/firestore";
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

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
setLogLevel('silent');

// Khởi tạo Auth với persistence (Đảm bảo khởi tạo với persistence trước)
export const auth = (() => {
  try {
    // @ts-ignore
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (e) {
    return getAuth(app);
  }
})();

// Khởi tạo Storage
export const storage = getStorage(app);

// Lưu ý: getAnalytics chỉ chạy tốt trên môi trường Web. Ở React Native (iOS/Android),
// thư viện firebase/analytics thường gây lỗi, nên tạm thời không kích hoạt.

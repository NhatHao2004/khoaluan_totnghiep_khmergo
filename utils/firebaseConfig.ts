import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, setLogLevel } from "firebase/firestore";
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getRemoteConfig } from "firebase/remote-config";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from "../constants/Config";

const firebaseConfig = {
  apiKey: CONFIG.FIREBASE.API_KEY,
  authDomain: CONFIG.FIREBASE.AUTH_DOMAIN,
  projectId: CONFIG.FIREBASE.PROJECT_ID,
  storageBucket: CONFIG.FIREBASE.STORAGE_BUCKET,
  messagingSenderId: CONFIG.FIREBASE.MESSAGING_SENDER_ID,
  appId: CONFIG.FIREBASE.APP_ID,
  measurementId: CONFIG.FIREBASE.MEASUREMENT_ID
};

// Initialize Firebase (chỉ khởi tạo nếu chưa có app nào để tránh lỗi khi reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

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

// Khởi tạo Remote Config
export const remoteConfig = getRemoteConfig(app);
remoteConfig.settings.minimumFetchIntervalMillis = 60000; // 1 phút (để test cho nhanh, production nên để 12h)

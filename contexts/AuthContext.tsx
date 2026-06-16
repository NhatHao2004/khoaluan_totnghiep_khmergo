import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '../utils/firebaseConfig';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Alert } from 'react-native';

export interface UserProfile {
  uid: string;
  email: string | null;
  name?: string;
  avatar?: string | null;
  points?: number;
  rank?: string;
  accuracy?: number;
  completedQuizzes?: number;
  interests?: string[];
  isBlocked?: boolean;
  isAnonymous?: boolean;
  role?: string;
}


interface AuthContextType {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAndSetUser = async (firebaseUser: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        // Kiểm tra xem người dùng có bị chặn không (Ngoại trừ Admin)
        const userRole = data.role || data['quyền'] || 'Người dùng';
        if (data.isBlocked && userRole !== 'Quản trị viên') {
          await signOut(auth);
          setUser(null);
          throw new Error('ACCOUNT_BLOCKED');
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: data.name || data['tên'],
          avatar: data.avatar || data['hình đại diện'] || null,
          points: data.points ?? 0,
          rank: data.rank || 'Đồng',
          accuracy: data.accuracy ?? 0,
          completedQuizzes: data.completedQuizzes ?? 0,
          interests: data.interests || [],
          isBlocked: data.isBlocked || false,
          isAnonymous: firebaseUser.isAnonymous,
          role: data.role || data['quyền'] || 'Người dùng',
        });

      } else {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          isAnonymous: firebaseUser.isAnonymous,
        });
      }
    } catch (error: any) {
      // Nếu là lỗi offline, chúng ta vẫn cho phép User cơ bản để vào được app
      const isOffline = error.message?.includes('offline') || error.code === 'unavailable';
      
      if (isOffline) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          isAnonymous: firebaseUser.isAnonymous,
        });
        return; // Thoát êm đẹp, chờ onSnapshot xử lý sau
      }

      // Chỉ log lỗi nếu không phải là lỗi bị chặn tài khoản (vì lỗi đó là chủ ý)
      if (error.message !== 'ACCOUNT_BLOCKED') {
        console.error("Error fetching user data:", error);
      }
      
      // Nếu lỗi là do phân quyền (thường là bị chặn bởi Rules)
      if (error.code === 'permission-denied') {
        await signOut(auth);
        setUser(null);
        throw new Error('ACCOUNT_BLOCKED');
      }
      
      throw error;
    }
  };

  // Hàm refresh để gọi sau khi đăng nhập thành công
  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await fetchAndSetUser(currentUser);
    } else {
      throw new Error('AUTH_FAILED');
    }
  };

  useEffect(() => {
    let unsubDoc: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          // fetchAndSetUser hiện tại đã an toàn với lỗi offline
          await fetchAndSetUser(firebaseUser);
          
          // Thiết lập listener thời gian thực cho tài khoản đang đăng nhập
          if (unsubDoc) unsubDoc();
          unsubDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), {
            next: (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                const userRole = data.role || data['quyền'] || 'Người dùng';
                
                if (data.isBlocked && userRole !== 'Quản trị viên') {
                  signOut(auth);
                  setUser(null);
                  Alert.alert('Thông báo', 'Tài khoản của bạn đã bị khóa bởi quản trị viên.');
                  return;
                }

                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: data.name || data['tên'],
                  avatar: data.avatar || data['hình đại diện'] || null,
                  points: data.points ?? 0,
                  rank: data.rank || 'Đồng',
                  accuracy: data.accuracy ?? 0,
                  completedQuizzes: data.completedQuizzes ?? 0,
                  interests: data.interests || [],
                  isBlocked: data.isBlocked || false,
                  isAnonymous: firebaseUser.isAnonymous,
                  role: userRole,
                });
              }
            },
            error: (err) => {
              // Chỉ log lỗi snapshot nếu không phải lỗi offline
              if (!err.message.includes('offline')) {
                console.error("Snapshot error:", err);
              }
            }
          });

        } catch (error: any) {
          const isOffline = error.message?.includes('offline') || error.code === 'unavailable';
          if (error.message !== 'ACCOUNT_BLOCKED' && error.message !== 'AUTH_FAILED' && !isOffline) {
            console.error("Unexpected auth error:", error);
          }
        }
      } else {
        if (unsubDoc) {
          unsubDoc();
          unsubDoc = null;
        }
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '../utils/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  name?: string;
  avatar?: string | null;
  points?: number;
  rank?: string;
  accuracy?: number;
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
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: data.name || data['tên'],
          avatar: data.avatar || data['hình đại diện'] || null,
          points: data.points ?? 0,
          rank: data.rank || 'Đồng',
          accuracy: data.accuracy ?? 0,
        });

      } else {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
      });
    }
  };

  // Hàm refresh để gọi sau khi đăng nhập thành công
  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await fetchAndSetUser(currentUser);
    }
  };

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        await fetchAndSetUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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

import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Challenges from './pages/Challenges';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Destinations from './pages/Destinations';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import './index.css';

const TopBar = ({ user }: { user: User }) => {
  const [adminName, setAdminName] = useState('Admin');
  const [adminAvatar, setAdminAvatar] = useState('https://i.pravatar.cc/150?u=admin');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          const data = snap.data();
          setAdminName(data?.name || data?.['tên'] || u.displayName || 'Admin');
          setAdminAvatar(data?.avatar || data?.['hình đại diện'] || u.photoURL || `https://i.pravatar.cc/150?u=${u.uid}`);
        } catch { /* ignore */ }
      }
    });
    return () => unsub();
  }, [user]);

  return (
    <header className="top-bar">
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'flex-end', padding: '1rem 2rem', width: '100%' }}>
        <div style={{ position: 'relative', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <Bell size={20} />
          <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#ff5370', borderRadius: '50%', border: '2px solid white' }}></span>
        </div>
        <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
          <img src={adminAvatar} style={{ width: 35, height: 35, borderRadius: '12px', objectFit: 'cover', border: '1px solid #f1f5f9' }} alt="Admin" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b', lineHeight: 1 }}>{adminName}</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Admin</span>
          </div>
        </Link>
      </div>
    </header>
  );
};

const RouteTransition = ({ children }: { children: React.ReactNode }) => (
  <div className="fade-in">{children}</div>
);

function App() {
  const [authState, setAuthState] = useState<{
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
  }>({
    user: null,
    isAdmin: false,
    loading: true
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          const data = snap.data();
          if (data?.role === 'Quản trị viên') {
            setAuthState({ user: u, isAdmin: true, loading: false });
          } else {
            console.error("Access denied: Not an admin");
            await auth.signOut();
            setAuthState({ user: null, isAdmin: false, loading: false });
            alert('Tài khoản này không có quyền truy cập.');
          }
        } catch (error) {
          console.error("Auth verification error:", error);
          setAuthState({ user: null, isAdmin: false, loading: false });
        }
      } else {
        setAuthState({ user: null, isAdmin: false, loading: false });
      }
    });
    return () => unsubscribe();
  }, []);

  // Màn hình chờ khởi tạo (Splash Screen) chuyên nghiệp
  if (authState.loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#fff',
        zIndex: 9999
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid #f3f3f3', 
          borderTop: '3px solid #3b82f6', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '16px', color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>KhmerGo Admin</p>
      </div>
    );
  }

  // Nếu không phải admin hoặc chưa đăng nhập -> LUÔN VÀO LOGIN
  if (!authState.user || !authState.isAdmin) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  // Luồng vào trang quản trị sau khi đã xác thực Admin
  return (
    <Router>
      <div className="app-container" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        <Sidebar />
        <main className="main-content" style={{ flex: 1, position: 'relative' }}>
          <TopBar user={authState.user} />
          <div style={{ padding: '1.5rem', minHeight: 'calc(100vh - 60px)' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/destinations" element={<RouteTransition><Destinations /></RouteTransition>} />
              <Route path="/users" element={<RouteTransition><Users /></RouteTransition>} />
              <Route path="/challenges" element={<RouteTransition><Challenges /></RouteTransition>} />
              <Route path="/profile" element={<RouteTransition><Profile /></RouteTransition>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;

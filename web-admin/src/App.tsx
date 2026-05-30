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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Chào buổi sáng, {adminName.split(' ').pop()} 👋
          </h2>
        </div>
        
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ 
            position: 'relative', 
            color: 'var(--text-secondary)', 
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '10px',
            background: 'var(--bg-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }} className="hover-scale">
            <Bell size={20} />
            <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, background: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }}></span>
          </div>
          
          <Link to="/profile" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            cursor: 'pointer', 
            padding: '4px 12px 4px 4px',
            borderRadius: '12px',
            background: 'var(--bg-accent)',
            textDecoration: 'none', 
            color: 'inherit',
            transition: 'all 0.2s'
          }} className="hover-scale">
            <img src={adminAvatar} style={{ width: 34, height: 34, borderRadius: '10px', objectFit: 'cover' }} alt="Admin" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>{adminName}</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.025em' }}>Quản trị viên</span>
            </div>
          </Link>
        </div>
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

  // Màn hình chờ chuyên nghiệp
  if (authState.loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#0f172a',
        color: '#fff',
        zIndex: 9999
      }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          border: '3px solid rgba(255,255,255,0.1)', 
          borderTop: '3px solid #6366f1', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '20px', color: '#94a3b8', fontWeight: 600, fontSize: '0.925rem', letterSpacing: '0.05em' }}>KHMERGO ADMIN</p>
      </div>
    );
  }

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

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <TopBar user={authState.user} />
          <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto' }}>
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

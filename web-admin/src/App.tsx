import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { auth, db } from './firebase/config';
import './index.css';
import Challenges from './pages/Challenges';
import Dashboard from './pages/Dashboard';
import Destinations from './pages/Destinations';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Users from './pages/Users';

import { AnimatePresence, motion } from 'framer-motion';

const TopBar = ({ user }: { user: User }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Fetch notifications (logs + feedback)
    const unsubLogs = onSnapshot(collection(db, 'logs'), (snap) => {
      const logs = snap.docs.map(doc => ({ id: doc.id, type: 'system', ...doc.data() }));
      setNotifications(prev => mergeAndSortLogs(logs, prev));
    });

    const unsubFeedback = onSnapshot(collection(db, 'feedback'), (snap) => {
      const feedbacks = snap.docs.map(doc => ({
        id: doc.id,
        type: 'users',
        title: 'Phản hồi mới',
        desc: `Người dùng ${doc.data().userName || 'Khách'} vừa gửi phản hồi.`,
        timestamp: doc.data().timestamp
      }));
      setNotifications(prev => mergeAndSortLogs(feedbacks, prev));
    });

    const mergeAndSortLogs = (newData: any[], existingData: any[]) => {
      const merged = [...newData, ...existingData].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      return merged
        .sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
        .slice(0, 10);
    };

    return () => {
      unsubLogs();
      unsubFeedback();
    };
  }, [user]);

  return (
    <header className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ flex: 1 }}>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', position: 'relative' }}>
          <div
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              position: 'relative',
              color: 'var(--danger)',
              cursor: 'pointer',
              padding: '10px',
              borderRadius: '12px',
              background: 'white',
              border: '1.5px solid #0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }} className="hover-scale">
            <motion.div
              animate={notifications.length > 0 ? {
                rotate: [0, -20, 20, -20, 20, 0],
              } : {}}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2
              }}
              style={{ display: 'flex' }}
            >
              <Bell size={24} color="var(--danger)" />
            </motion.div>
            {notifications.length > 0 && (
              <span style={{ position: 'absolute', top: 10, right: 10, width: 9, height: 9, background: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }}></span>
            )}
          </div>

          <AnimatePresence>
            {showNotifications && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{
                    position: 'absolute', top: '120%', right: 0, width: '320px',
                    background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-light)', zIndex: 100, overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Thông báo</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>Đánh dấu đã đọc</span>
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                        <p style={{ fontSize: '0.8125rem' }}>Không có thông báo mới</p>
                      </div>
                    ) : (
                      notifications.map((notif: any) => (
                        <div key={notif.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '0.75rem', cursor: 'pointer' }} className="hover-accent">
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '0.4rem', flexShrink: 0 }}></div>
                          <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{notif.title}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{notif.desc}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--border-light)', background: 'var(--bg-main)' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer' }}>Xem tất cả</span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Profile link removed as per user request */}
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

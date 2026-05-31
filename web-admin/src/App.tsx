import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { auth, db } from './firebase/config';
import './index.css';
import Challenges from './pages/Challenges';
import Dashboard from './pages/Dashboard';
import Destinations from './pages/Destinations';
import Login from './pages/Login';
import ProfilePage from './pages/Profile';
import Users from './pages/Users';

const TopBar = ({ notifications, clearNotifications }: any) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="top-bar">
      <div style={{ flex: 1 }}></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              padding: '0.75rem',
              borderRadius: '20px',
              border: '1.5px solid #000000',
              background: '#eff6ff',
              color: '#f63b3bff',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}
            className="hover-scale"
          >
            <Bell size={22} strokeWidth={2.5} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                minWidth: '20px',
                height: '20px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '10px',
                border: '2px solid white',
                fontSize: '0.7rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
                pointerEvents: 'none'
              }}>
                {notifications.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setShowNotifications(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.75rem', width: '320px', background: 'white', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)', border: '1px solid #f1f5f9', padding: '1.25rem', zIndex: 999 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.925rem' }}>Thông báo</h4>
                    {notifications.length > 0 && (
                      <button onClick={clearNotifications} style={{ fontSize: '0.75rem', color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Xóa tất cả</button>
                    )}
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.875rem' }}>Không có thông báo mới</p>
                    ) : (
                      <>
                        {notifications.map((n: any) => (
                          <div key={n.id} style={{ padding: '0.875rem', borderRadius: '12px', background: '#f8fafc', marginBottom: '0.5rem', fontSize: '0.8125rem', border: '1px solid transparent', transition: 'all 0.2s' }} className="notification-item">
                            <p style={{ color: '#1e293b', fontWeight: 600, marginBottom: '0.25rem' }}>{n.title}</p>
                            <p style={{ color: '#64748b', lineHeight: 1.4 }}>{n.message}</p>
                          </div>
                        ))}
                        <button style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: 'none', background: '#f1f5f9', borderRadius: '12px', color: '#3b82f6', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} className="hover-bright">
                          Xem tất cả thông báo
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

function App() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [authState, setAuthState] = useState<{ user: User | null, isAdmin: boolean, loading: boolean }>({
    user: null,
    isAdmin: false,
    loading: true
  });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    // Lắng nghe bảng notifications
    const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snap) => {
      const notifsData = snap.docs.map(doc => ({ 
        id: doc.id, 
        type: 'general',
        ...doc.data() 
      }));
      
      // Lắng nghe bảng feedback và hợp nhất
      const unsubFeedback = onSnapshot(collection(db, 'feedback'), (fbSnap) => {
        const feedbackData = fbSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'feedback',
            title: `Phản hồi từ ${data.userName || 'Người dùng'}`,
            message: data.message || data.nội_dung || 'Đã gửi một phản hồi mới',
            createdAt: data.createdAt
          };
        });

        // Hợp nhất và sắp xếp (giả sử có trường createdAt)
        const combined = [...notifsData, ...feedbackData].sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setNotifications(combined);
      });

      return () => unsubFeedback();
    });

    return () => unsubNotifications();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          const data = snap.data();
          if (data?.role === 'Quản trị viên') {
            setAuthState({ user: u, isAdmin: true, loading: false });
          } else {
            console.error("Access denied: Not an administrator");
            await signOut(auth);
            setAuthState({ user: null, isAdmin: false, loading: false });
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setAuthState({ user: null, isAdmin: false, loading: false });
        }
      } else {
        setAuthState({ user: null, isAdmin: false, loading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLogoutModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  if (authState.loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%' }}></div>
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

  const clearNotifications = async () => {
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      const deletePromises = snap.docs.map(d => deleteDoc(doc(db, 'notifications', d.id)));
      await Promise.all(deletePromises);
      setNotifications([]);
    } catch (error) {
      console.error("Lỗi khi xóa thông báo:", error);
    }
  };

  return (
    <Router>
      <div className="app-container">
        <Sidebar onLogout={() => setIsLogoutModalOpen(true)} />
        <div className="main-content">
          <TopBar 
            notifications={notifications} 
            clearNotifications={clearNotifications} 
            adminName={authState.user?.displayName || 'Admin'} 
          />
          <div style={{ padding: '2.5rem' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>

        {/* Global Logout Confirmation Modal */}
        <AnimatePresence>
          {isLogoutModalOpen && (
            <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem' }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
                onClick={() => setIsLogoutModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '400px',
                  padding: '2.5rem',
                  textAlign: 'center',
                  borderRadius: '32px',
                  background: 'white',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                  zIndex: 10001
                }}
              >
                <div style={{
                  width: '70px',
                  height: '70px',
                  background: '#fef2f2',
                  borderRadius: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <LogOut size={32} color="#ef4444" strokeWidth={2.5} />
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>Xác nhận đăng xuất</h3>
                <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                  Bạn có chắc chắn muốn rời khỏi hệ thống quản trị KhmerGo không
                </p>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="btn"
                    style={{ flex: 1, background: '#0080ffff', color: '#ffffffff', fontWeight: 700, borderRadius: '14px', border: 'none', padding: '0.875rem' }}
                    onClick={() => setIsLogoutModalOpen(false)}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    className="btn"
                    style={{ flex: 1.5, background: '#ef4444', color: 'white', fontWeight: 700, borderRadius: '14px', border: 'none', padding: '0.875rem', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)' }}
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;

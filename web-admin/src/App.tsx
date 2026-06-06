import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, LogOut, Menu, RefreshCw, Trash, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { auth, db } from './firebase/config';
import './index.css';
import Article from './pages/Article';
import Challenges from './pages/Challenges';
import Dashboard from './pages/Dashboard';
import Destinations from './pages/Destinations';
import Login from './pages/Login';
import ProfilePage from './pages/Profile';
import Users from './pages/Users';
import Vocabulary from './pages/Vocabulary';

const TopBar = ({ notifications, clearNotifications, setShowTrash, setTrashActiveTab, toggleSidebar }: any) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={toggleSidebar}
          className="desktop-hidden"
          style={{
            background: 'none',
            border: 'none',
            padding: '0.6rem',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Menu size={28} />
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              padding: '0.6rem',
              borderRadius: '14px',
              border: '1px solid var(--border-light)',
              background: 'white',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                background: 'var(--danger)',
                borderRadius: '50%',
                border: '2px solid white'
              }}></span>
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
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    left: 'auto',
                    marginTop: '0.5rem',
                    width: 'calc(100vw - 2rem)',
                    maxWidth: '320px',
                    background: 'white',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-light)',
                    padding: '1.25rem',
                    zIndex: 999,
                    transformOrigin: 'top right'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.875rem' }}>Thông báo</h4>
                    {notifications.length > 0 && (
                      <button onClick={clearNotifications} style={{ fontSize: '0.75rem', color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Xóa tất cả</button>
                    )}
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="custom-scrollbar">
                    {notifications.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Không có thông báo mới</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {notifications.map((n: any) => (
                          <div key={n.id} style={{ padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-accent)', fontSize: '0.8125rem' }}>
                            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>{n.title}</p>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

          <button
            onClick={() => {
              setTrashActiveTab('destinations');
              setShowTrash(true);
            }}
            style={{
              padding: '0.6rem',
              borderRadius: '14px',
              border: '1px solid var(--border-light)',
              background: 'white',
              color: 'var(--danger)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              minWidth: '44px',
              minHeight: '44px'
            }}
            title="Thùng rác hệ thống"
          >
            <Trash2 size={20} />
          </button>
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
  const [showTrash, setShowTrash] = useState(false);
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [trashActiveTab, setTrashActiveTab] = useState('destinations');
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false, message: '', type: 'success'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 3000);
  };

  useEffect(() => {
    if (showTrash) {
      const unsub = onSnapshot(collection(db, 'trash'), (snap) => {
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTrashItems(items.sort((a: any, b: any) => (b.deletedAt?.seconds || 0) - (a.deletedAt?.seconds || 0)));
      });
      return () => unsub();
    }
  }, [showTrash]);

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
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={() => setIsLogoutModalOpen(true)} />
        <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}></div>
        
        <div className="main-content">
          <TopBar
            notifications={notifications}
            clearNotifications={clearNotifications}
            adminName={authState.user?.displayName || 'Admin'}
            setShowTrash={setShowTrash}
            setTrashActiveTab={setTrashActiveTab}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <div className="page-container">
            <div className="fade-in">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/article" element={<Article />} />
              <Route path="/vocabulary" element={<Vocabulary />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </div>
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

        {/* System Trash Modal */}
        <AnimatePresence>
          {showTrash && (
            <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem' }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)' }} onClick={() => setShowTrash(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ position: 'relative', width: '100%', maxWidth: '900px', height: '80vh', background: 'white', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                {/* Modal Header */}
                <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>Khôi phục dữ liệu</h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Phục hồi các nội dung đã xóa trong 30 ngày</p>
                  </div>
                  <button onClick={() => setShowTrash(false)} style={{ width: '44px', height: '44px', borderRadius: '14px', border: 'none', background: '#f8fafc', color: '#ff0000ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-bright"><X size={25} /></button>
                </div>

                {/* Modal Tabs */}
                <div style={{ padding: '0.75rem 2rem', background: '#f8fafc', display: 'flex', gap: '0.4rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }} className="custom-scrollbar">
                  {[
                    { key: 'destinations', label: 'Nội dung học tập' },
                    { key: 'challenges', label: 'Các bài thử thách' },
                    { key: 'vocab_categories', label: 'Danh mục từ vựng' },
                    { key: 'posts', label: 'Bài viết cộng đồng' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setTrashActiveTab(tab.key)}
                      style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: 'none', background: trashActiveTab === tab.key ? 'white' : 'transparent', color: trashActiveTab === tab.key ? '#3b82f6' : '#64748b', fontWeight: 700, fontSize: 'clamp(0.7rem, 2.3vw, 0.8125rem)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: trashActiveTab === tab.key ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Modal Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }} className="custom-scrollbar">
                  {trashItems.filter(item => item.type === trashActiveTab).length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <Trash size={48} strokeWidth={1} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                      <p style={{ fontWeight: 600 }}>Thùng rác trống</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {trashItems.filter(item => item.type === trashActiveTab).map((item: any) => (
                        <div key={item.id} style={{ padding: '1.25rem', borderRadius: '20px', border: '1px solid #f1f5f9', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }} className="hover-shadow">
                          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                            <div>
                              <h4 style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.data?.name || item.data?.title || item.data?.pagodaName || item.data?.content || 'Không có tiêu đề'}
                              </h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>Đã xóa: {item.deletedAt?.toDate().toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                              onClick={async () => {
                                if (isProcessing) return;
                                setIsProcessing(true);
                                try {
                                  if (item.type === 'vocab_categories') {
                                    await setDoc(doc(db, 'vocab_categories', item.originalId), item.data);
                                  } else if (item.type === 'vocab_words') {
                                    const catRef = doc(db, 'vocab_categories', item.categoryId);
                                    const catSnap = await getDoc(catRef);
                                    const currentWords = catSnap.exists() ? (catSnap.data().words || []) : [];
                                    await setDoc(catRef, {
                                      words: [...currentWords, item.data]
                                    }, { merge: true });
                                  } else {
                                    const collectionName = item.type === 'challenges' ? 'quizzes' : (item.type === 'destinations' ? 'destinations' : 'posts');
                                    await setDoc(doc(db, collectionName, item.originalId), {
                                      ...item.data,
                                      createdAt: serverTimestamp()
                                    });
                                  }
                                  await deleteDoc(doc(db, 'trash', item.id));
                                  showToast('Đã khôi phục dữ liệu thành công');
                                } catch (e) {
                                  showToast('Lỗi khi khôi phục dữ liệu', 'error');
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: 'none', background: '#eff6ff', color: '#3b82f6', fontWeight: 700, fontSize: '0.8125rem', cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isProcessing ? 0.7 : 1 }}
                              className="hover-bright"
                            >
                              <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} /> {isProcessing ? 'Đang khôi phục...' : 'Khôi phục'}
                            </button>
                            <button
                              onClick={async () => {
                                if (isProcessing) return;
                                setIsProcessing(true);
                                try {
                                  await deleteDoc(doc(db, 'trash', item.id));
                                  showToast('Đã xóa vĩnh viễn nội dung');
                                } catch (e) {
                                  showToast('Lỗi khi xóa nội dung', 'error');
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: 'none', background: '#fef2f2', color: '#ef4444', fontWeight: 700, fontSize: '0.8125rem', cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isProcessing ? 0.7 : 1 }}
                              className="hover-bright"
                            >
                              <Trash2 size={14} /> {isProcessing ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {toast.isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              zIndex: 20000,
              padding: '1rem 1.5rem',
              background: toast.type === 'success' ? '#10b981' : '#ef4444',
              color: '#fff',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {toast.type === 'success' ? <RefreshCw size={14} /> : <X size={14} />}
            </div>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </Router>
  );
}

export default App;

import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, CheckCircle, Mail, MessageCircleMore, Search, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';

interface UserProfile {
  id: string;
  name: string;
  points: number;
  avatar?: string;
  email?: string;
  isBlocked?: boolean;
  createdAt?: any;
  [key: string]: any;
}

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedFeedbackUser, setSelectedFeedbackUser] = useState<UserProfile | null>(null);
  const [userFeedbacks, setUserFeedbacks] = useState<any[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUsers();
      } else {
        signInAnonymously(auth).catch(err => console.error("Auth error:", err));
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const docs = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          name: doc.data().name || doc.data()['tên'] || 'Anonymous'
        } as UserProfile))
        .filter(user => user.role !== 'Quản trị viên');
      setUsers(docs);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  };

  const fetchFeedbacks = async (userId: string) => {
    try {
      const q = query(collection(db, 'feedbacks'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const feedbacks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserFeedbacks(feedbacks);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      setUserFeedbacks([]);
    }
  };

  const handleOpenFeedback = (user: UserProfile) => {
    setSelectedFeedbackUser(user);
    fetchFeedbacks(user.id);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );



  const toggleBlock = (user: UserProfile) => {
    const action = user.isBlocked ? 'bỏ khóa' : 'khóa';
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận thay đổi',
      message: `Bạn có chắc chắn muốn ${action} người dùng "${user.name}" không`,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const userRef = doc(db, 'users', user.id);
          await updateDoc(userRef, { isBlocked: !user.isBlocked });
          // Cập nhật local state ngay lập tức
          setUsers(prev => prev.map(u =>
            u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u
          ));
          // Cập nhật selectedUser nếu đang mở modal chi tiết
          if (selectedUser?.id === user.id) {
            setSelectedUser(prev => prev ? { ...prev, isBlocked: !prev.isBlocked } : null);
          }
        } catch (error: any) {
          console.error("Error updating user status:", error);
          alert(`Không thể ${action} người dùng. Lỗi: ${error?.message || 'Không xác định'}`);
        }
      }
    });
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>Quản lý người dùng</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Quản lý cộng đồng và hỗ trợ người dùng KhmerGo.</p>
        </div>
      </div>

      <div className="input-group" style={{ maxWidth: '400px', marginBottom: '2.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            style={{ paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="card glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '2rem', background: 'var(--bg-accent)', height: '100px', animation: 'pulse 1.5s infinite' }} />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--bg-accent)', animation: 'pulse 1.5s infinite' }} />
              <div style={{ flex: 1, height: 40, background: 'var(--bg-accent)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Search size={40} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Không tìm thấy kết quả</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Thử tìm kiếm với một từ khóa khác</p>
        </div>
      ) : (
        <div className="card glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-accent)', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Người dùng</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Điểm số</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Hoàn thành</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedUser(user)}
                    style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s', cursor: 'pointer' }}
                    className="hover-accent"
                  >
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img
                          src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id}
                          style={{ width: 42, height: 42, borderRadius: '12px', objectFit: 'cover', background: 'var(--bg-accent)' }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{user.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {user.isBlocked ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.6875rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626' }}>
                          BỊ KHÓA
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.6875rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#ecfdf5', color: '#059669' }}>
                          HOẠT ĐỘNG
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {user.points || 0}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {user.completedQuizzes || 0}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '8px' }}
                          title="Phản hồi"
                          onClick={(e) => { e.stopPropagation(); handleOpenFeedback(user); }}
                        >
                          <MessageCircleMore size={18} />
                        </button>
                        <button
                          className="btn"
                          style={{ padding: '8px', background: user.isBlocked ? 'var(--success)' : '#fef2f2', color: user.isBlocked ? 'white' : '#dc2626' }}
                          title={user.isBlocked ? 'Bỏ khóa' : 'Khóa'}
                          onClick={(e) => { e.stopPropagation(); toggleBlock(user); }}
                        >
                          {user.isBlocked ? <CheckCircle size={18} /> : <Ban size={18} />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card" style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: 0 }} onClick={() => setSelectedUser(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '440px', padding: '2.5rem', borderRadius: '24px', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <img
                  src={selectedUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + selectedUser.id}
                  style={{ width: 100, height: 100, borderRadius: '24px', marginBottom: '1.25rem', boxShadow: 'var(--shadow-md)' }}
                />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedUser.name}</h2>

              </div>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div className="card" style={{ background: 'var(--bg-main)', border: 'none', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '10px', borderRadius: '10px', background: 'white' }}><Mail size={20} color="var(--primary)" /></div>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Địa chỉ Email</p>
                      <p style={{ fontWeight: 600 }}>{selectedUser.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="card" style={{ background: 'var(--bg-main)', border: 'none', padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Điểm số</span>
                    </div>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedUser.points || 0} điểm</p>
                  </div>
                  <div className="card" style={{ background: 'var(--bg-main)', border: 'none', padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hoàn thành</span>
                    </div>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedUser.completedQuizzes || 0} bài</p>
                  </div>
                </div>
              </div>

              <button onClick={() => setSelectedUser(null)} className="btn btn-primary" style={{ width: '100%', marginTop: '2.5rem', padding: '1rem' }}>Đóng</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmConfig.isOpen && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1.5rem' }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', cursor: 'pointer' }}
              onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card"
              style={{ position: 'relative', width: '100%', maxWidth: '440px', padding: '2.5rem', textAlign: 'center', borderRadius: '28px' }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Shield size={32} color="#f59e0b" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>{confirmConfig.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2.5rem' }}>{confirmConfig.message}</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn" style={{ flex: 1, padding: '0.875rem', background: 'var(--secondary)', color: 'white' }} onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}>Hủy bỏ</button>
                <button className="btn" style={{ flex: 1, background: '#ef4444', color: 'white', padding: '0.875rem' }} onClick={confirmConfig.onConfirm}>Xác nhận</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {selectedFeedbackUser && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedFeedbackUser(null)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '2.5rem', borderRadius: '24px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  Phản hồi từ {selectedFeedbackUser.name}
                </h2>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }} className="custom-scrollbar">
                {userFeedbacks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                    <MessageCircleMore size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                    <p>Người dùng này chưa gửi phản hồi nào</p>
                  </div>
                ) : (
                  userFeedbacks.map((fb) => (
                    <div key={fb.id} className="card" style={{ background: 'var(--bg-main)', border: 'none', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>ID: {fb.id.slice(-6)}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {fb.createdAt?.seconds ? new Date(fb.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Gần đây'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.925rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>{fb.content || fb.message || 'Không có nội dung'}</p>
                    </div>
                  ))
                )}
              </div>

              <button onClick={() => setSelectedFeedbackUser(null)} className="btn btn-primary" style={{ width: '100%', marginTop: '2rem', padding: '1rem' }}>Đóng</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;


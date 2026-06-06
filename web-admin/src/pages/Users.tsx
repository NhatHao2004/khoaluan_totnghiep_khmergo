import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, CheckCircle, Mail, MessageCircleMore, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../firebase/config';

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

  const [toastConfig, setToastConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'danger';
    message: string;
  }>({ isOpen: false, type: 'success', message: '' });

  useEffect(() => {
    fetchUsers();
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
          const newStatus = !user.isBlocked;
          await updateDoc(userRef, { isBlocked: newStatus });

          setUsers(prev => prev.map(u =>
            u.id === user.id ? { ...u, isBlocked: newStatus } : u
          ));

          if (selectedUser?.id === user.id) {
            setSelectedUser(prev => prev ? { ...prev, isBlocked: newStatus } : null);
          }

          setToastConfig({
            isOpen: true,
            type: newStatus ? 'danger' : 'success',
            message: `${newStatus ? 'Khóa' : 'Bỏ khóa'} người dùng thành công`
          });

          setTimeout(() => setToastConfig(prev => ({ ...prev, isOpen: false })), 3000);
        } catch (error: any) {
          console.error("Error updating user status:", error);
          alert(`Không thể ${action} người dùng. Lỗi: ${error?.message || 'Không xác định'}`);
        }
      }
    });
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Quản lý người dùng</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Theo dõi và quản lý tài khoản người dùng trong hệ thống</p>

        <div className="input-group" style={{ maxWidth: '400px', marginBottom: 0 }}>
          <input
            className="input-field"
            placeholder="Tìm kiếm theo tên / email / ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="responsive-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="card skeleton" style={{ height: '280px' }} />)}
        </div>
      ) : users.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Chưa có người dùng</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Danh sách người dùng sẽ hiển thị tại đây</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Không tìm thấy kết quả</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Thử tìm kiếm với một từ khóa khác</p>
        </div>
      ) : (
        <div className="responsive-grid">
          {filteredUsers.map((user) => (
            <motion.div
              layout
              key={user.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem',
                opacity: user.isBlocked ? 0.7 : 1,
                border: user.isBlocked ? '1px dashed var(--danger)' : '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                  alt={user.name}
                  style={{ width: 56, height: 56, borderRadius: '14px', objectFit: 'cover', background: 'var(--bg-accent)' }}
                />
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.125rem' }}>{user.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email || user.id}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--bg-accent)', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Điểm số</div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 800 }}>{user.points || 0}</div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Thử thách</div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 800 }}>{user.completedQuizzes || 0}</div>
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn"
                  onClick={() => handleOpenFeedback(user)}
                  style={{ flex: 1, height: '40px', background: '#eff6ff', color: '#1d4ed8' }}
                  title="Xem phản hồi"
                >
                  <MessageCircleMore size={18} />
                </button>
                <button
                  className="btn"
                  onClick={() => toggleBlock(user)}
                  style={{ flex: 1, height: '40px', background: user.isBlocked ? '#fef2f2' : '#ecfdf5', color: user.isBlocked ? '#dc2626' : '#059669' }}
                  title={user.isBlocked ? "Mở khóa" : "Khóa tài khoản"}
                >
                  {user.isBlocked ? <Ban size={18} /> : <CheckCircle size={18} />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
              onClick={() => setSelectedUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="card glass-card"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '500px',
                padding: '2.5rem',
                borderRadius: '32px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <img
                  src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=random`}
                  alt={selectedUser.name}
                  style={{ width: 100, height: 100, borderRadius: '30px', marginBottom: '1.5rem', border: '4px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{selectedUser.name}</h2>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: selectedUser.isBlocked ? '#fef2f2' : '#eff6ff', padding: '0.5rem 1rem', borderRadius: '12px', color: selectedUser.isBlocked ? '#ef4444' : '#3b82f6', fontSize: '0.875rem', fontWeight: 700 }}>
                  {selectedUser.isBlocked ? <Ban size={16} /> : <Shield size={16} />}
                  {selectedUser.isBlocked ? 'Tài khoản đã bị khóa' : 'Tài khoản đang hoạt động'}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.25rem', background: 'var(--bg-accent)', borderRadius: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Mail size={16} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Email liên hệ</span>
                  </div>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedUser.email || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="btn"
                  style={{ flex: 1, background: 'var(--bg-accent)', color: 'var(--text-primary)', borderRadius: '16px', padding: '1rem' }}
                  onClick={() => setSelectedUser(null)}
                >
                  Đóng
                </button>
                <button
                  className="btn"
                  style={{ flex: 1, background: selectedUser.isBlocked ? '#10b981' : '#ef4444', color: 'white', borderRadius: '16px', padding: '1rem' }}
                  onClick={() => toggleBlock(selectedUser)}
                >
                  {selectedUser.isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {selectedFeedbackUser && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
              onClick={() => setSelectedFeedbackUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="card glass-card"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '500px',
                padding: '2.5rem',
                borderRadius: '32px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Phản hồi từ {selectedFeedbackUser.name}</h2>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '2rem' }}>
                {userFeedbacks.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Chưa có phản hồi nào</p>
                ) : (
                  userFeedbacks.map((fb) => (
                    <div key={fb.id} style={{ padding: '1rem', background: 'var(--bg-accent)', borderRadius: '16px', marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.925rem', lineHeight: 1.5 }}>{fb.message}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{new Date(fb.timestamp?.seconds * 1000).toLocaleString('vi-VN')}</p>
                    </div>
                  ))
                )}
              </div>

              <button
                className="btn"
                style={{ width: '100%', background: '#0ea5e9', color: 'white', borderRadius: '16px', padding: '1rem' }}
                onClick={() => setSelectedFeedbackUser(null)}
              >
                Đóng
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmConfig.isOpen && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1.5rem' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
              onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="card"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem',
                textAlign: 'center',
                borderRadius: '32px'
              }}
            >
              <div style={{ width: '60px', height: '60px', background: 'var(--bg-accent)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Shield size={28} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{confirmConfig.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>{confirmConfig.message}</p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn"
                  style={{ flex: 1, background: '#ef4444', color: 'white', fontWeight: 600, borderRadius: '14px' }}
                  onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                >
                  Hủy bỏ
                </button>
                <button
                  className="btn"
                  style={{ flex: 1, background: '#0084ffff', color: 'white', fontWeight: 600, borderRadius: '14px' }}
                  onClick={confirmConfig.onConfirm}
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success/Danger Toast */}
      <AnimatePresence>
        {toastConfig.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: -40 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed',
              right: '2.5rem',
              bottom: 0,
              zIndex: 11000,
              background: toastConfig.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white',
              padding: '14px 28px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: toastConfig.type === 'success'
                ? '0 10px 30px rgba(16, 185, 129, 0.3)'
                : '0 10px 30px rgba(239, 68, 68, 0.3)',
              fontWeight: 700,
              fontSize: '0.95rem',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {toastConfig.type === 'success' ? <CheckCircle size={22} strokeWidth={3} /> : <Ban size={22} strokeWidth={3} />}
            <span>{toastConfig.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;

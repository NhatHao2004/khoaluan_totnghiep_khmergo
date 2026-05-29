import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, CheckCircle, Mail, MessageCircleMore, MessageSquareText, Search, Shield, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db, auth } from '../firebase/config';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

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
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        name: doc.data().name || doc.data()['tên'] || 'Anonymous'
      } as UserProfile));
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
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter(u => !u.isBlocked).length,
    blocked: users.filter(u => u.isBlocked).length
  };

  const toggleBlock = (user: UserProfile) => {
    const action = user.isBlocked ? 'bỏ chặn' : 'chặn';
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận thay đổi',
      message: `Bạn có chắc chắn muốn ${action} người dùng\n"${user.name}" không`,
      onConfirm: async () => {
        try {
          const userRef = doc(db, 'users', user.id);
          await updateDoc(userRef, { isBlocked: !user.isBlocked });
          fetchUsers();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error("Error updating user status:", error);
          alert("Lỗi: Không có quyền cập nhật người dùng. Kiểm tra Firestore Rules!");
        }
      }
    });
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.025em' }}>Quản lý người dùng</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9375rem' }}>Chăm sóc và hỗ trợ trải nghiệm người dùng KhmerGo</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem 1.25rem', background: 'var(--card-green)', color: '#fff', borderRadius: '10px', fontSize: '0.8125rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(46, 216, 182, 0.2)' }}>
            {stats.active} Đang hoạt động
          </div>
          <div style={{ padding: '0.5rem 1.25rem', background: 'var(--card-pink)', color: '#fff', borderRadius: '10px', fontSize: '0.8125rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(255, 83, 112, 0.2)' }}>
            {stats.blocked} Đã chặn
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{
          flex: 1,
          background: '#fff',
          borderRadius: '14px',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          border: '1px solid #edf2f7'
        }}>
          <Search size={20} color="#94a3b8" />
          <input
            type="text"
            placeholder="Tìm theo tên, hoặc email..."
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.9375rem', color: '#1e293b', fontWeight: 500 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ height: 280, background: '#fff', borderRadius: '24px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--card-blue)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Search size={32} color="#fff" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
            {searchTerm ? 'Không tìm thấy người dùng' : 'Chưa có người dùng nào'}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9375rem' }}>
            {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm' : 'Danh sách người dùng hiện đang trống'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filteredUsers.map(user => (
            <motion.div layout key={user.id} className="card" style={{ padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                {user.isBlocked ? (
                  <span title="Đã chặn"><Ban size={18} color="#ff5370" /></span>
                ) : (
                  <span title="Hoạt động"><CheckCircle size={18} color="#2ed8b6" /></span>
                )}
              </div>
              <img src={user.avatar || 'https://i.pravatar.cc/150?u=' + user.id} alt={user.name} style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: '1rem', objectFit: 'cover', border: '3px solid #f6f7fb' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>{user.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>{user.email || 'Email ẩn'}</p>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', padding: '0.75rem 0', background: '#f6f7fb', borderRadius: '12px' }}>
                <div style={{ flex: 1 }}><p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Điểm số</p><p style={{ fontWeight: 700, color: 'var(--primary)' }}>{Number(user.points) || 0}</p></div>
                <div style={{ width: '1px', height: '20px', background: '#ddd' }}></div>
                <div style={{ flex: 1 }}><p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hoàn thành</p><p style={{ fontWeight: 700, color: 'var(--primary)' }}>{user.completedQuizzes || 0}</p></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleOpenFeedback(user)}
                  style={{
                    padding: '0.625rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--card-blue)',
                    cursor: 'pointer',
                    color: '#fff',
                    boxShadow: '0 4px 10px rgba(64, 153, 255, 0.3)'
                  }}
                  title="Xem phản hồi"
                >
                  <MessageCircleMore size={18} />
                </button>
                <button
                  onClick={() => setSelectedUser(user)}
                  style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', border: '1px solid #eee', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
                  title="Xem chi tiết"
                >
                  Chi tiết
                </button>
                <button
                  onClick={() => toggleBlock(user)}
                  style={{ padding: '0.625rem', borderRadius: '8px', border: 'none', background: user.isBlocked ? '#2ed8b6' : '#ff5370', color: '#fff', cursor: 'pointer' }}
                  title={user.isBlocked ? "Mở chặn người dùng" : "Chặn người dùng này"}
                >
                  {user.isBlocked ? <CheckCircle size={18} /> : <Ban size={18} />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedUser(null)} />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} style={{ position: 'relative', width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <img src={selectedUser.avatar || 'https://i.pravatar.cc/150?u=' + selectedUser.id} style={{ width: 90, height: 90, borderRadius: '50%', marginBottom: '0.75rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedUser.name}</h2>
                <span style={{ display: 'inline-block', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: selectedUser.isBlocked ? '#ffe9ec' : '#e6fff0', color: selectedUser.isBlocked ? '#ff5370' : '#2ed8b6', marginTop: '0.5rem' }}>
                  {selectedUser.isBlocked ? 'ĐÃ CHẶN' : 'ĐANG HOẠT ĐỘNG'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <InfoItem icon={Mail} label="Email" value={selectedUser.email || 'N/A'} />
                </div>
                <InfoItem icon={Star} label="Điểm số" value={`${Number(selectedUser.points) || 0} điểm`} />
                <InfoItem icon={CheckCircle} label="Hoàn thành" value={`${selectedUser.completedQuizzes || 0} bài thử thách`} />
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ width: '100%', marginTop: '1.5rem', padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'var(--card-blue)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Hoàn tất</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmConfig.isOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1.5rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ position: 'relative', width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '28px', padding: '2.5rem', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fff9f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Shield size={32} color="#ffb64d" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#1e293b' }}>{confirmConfig.title}</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2.5rem', whiteSpace: 'pre-line' }}>{confirmConfig.message}</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                  style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: '1px solid #edf2f7', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  onClick={confirmConfig.onConfirm}
                  style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: 'none', background: '#ff5370', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255, 83, 112, 0.3)' }}
                >
                  Đồng ý
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {selectedFeedbackUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedFeedbackUser(null)} />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} style={{ position: 'relative', width: '100%', maxWidth: '500px', background: '#fff', borderRadius: '24px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
                  Phản hồi từ <span style={{ fontWeight: 800 }}>{selectedFeedbackUser.name}</span>
                </h2>
              </div>

              {userFeedbacks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  <MessageSquareText size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                  <p>Người dùng này chưa gửi phản hồi nào.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {userFeedbacks.map((fb) => (
                    <div key={fb.id} style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #edf2f7' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}># {fb.id.slice(-6).toUpperCase()}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {fb.createdAt && fb.createdAt.seconds ? new Date(fb.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Gần đây'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9375rem', lineHeight: 1.5, color: '#334155' }}>{fb.content || fb.message || 'Không có nội dung'}</p>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => setSelectedFeedbackUser(null)} style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '12px', border: 'none', background: 'var(--card-blue)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Đóng</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px' }}>
    <Icon size={18} color="#6a748a" />
    <div style={{ overflow: 'hidden' }}>
      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>{label}</p>
      <p style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
    </div>
  </div>
);

export default Users;

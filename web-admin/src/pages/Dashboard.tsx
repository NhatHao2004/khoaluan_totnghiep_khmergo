import { collection, onSnapshot } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, CheckCircle, HelpCircle, Info, MessageSquare, Shield, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    destinations: 0,
    quizzes: 0,
    posts: 0
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => setStats(prev => ({ ...prev, users: snap.size })));
    const unsubDests = onSnapshot(collection(db, 'destinations'), (snap) => setStats(prev => ({ ...prev, destinations: snap.size })));
    const unsubQuizzes = onSnapshot(collection(db, 'quizzes'), (snap) => setStats(prev => ({ ...prev, quizzes: snap.size })));
    const unsubPosts = onSnapshot(collection(db, 'posts'), (snap) => setStats(prev => ({ ...prev, posts: snap.size })));

    return () => {
      unsubUsers();
      unsubDests();
      unsubQuizzes();
      unsubPosts();
    };
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <div className="card glass-card stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ padding: '0.75rem', borderRadius: '12px', background: `${color}15`, color: color, width: 'fit-content', marginBottom: '1.25rem' }}>
        <Icon size={24} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="label" style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
          <h3 className="value" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>{value}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>tổng cộng</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>Tổng quan hệ thống</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>Theo dõi các chỉ số quan trọng của ứng dụng KhmerGo trong thời gian thực.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard title="Người dùng" value={stats.users} icon={User} color="#6366f1" onClick={() => navigate('/users')} />
        <StatCard title="Nội dung" value={stats.destinations} icon={BookOpen} color="#10b981" />
        <StatCard title="Thử thách" value={stats.quizzes} icon={HelpCircle} color="#f59e0b" />
        <StatCard title="Bài viết" value={stats.posts} icon={MessageSquare} color="#ec4899" />
      </div>

      <div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Hoạt động gần đây</h2>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }} onClick={() => setIsHistoryOpen(true)}>
              Xem tất cả
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', minHeight: '200px', opacity: 0.5 }}>
            <MessageSquare size={32} style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.875rem' }}>Chưa có hoạt động mới nào được ghi lại</p>
          </div>
        </div>
      </div>

      {/* Full History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setIsHistoryOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '800px', minHeight: '650px', padding: '2.5rem', borderRadius: '32px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Nhật ký hoạt động</h2>
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className="btn" style={{ padding: '8px', background: 'var(--bg-accent)', color: 'var(--danger)' }}><X size={25} /></button>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                {['all', 'users', 'content', 'system'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{ border: 'none', background: 'transparent', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 700, color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                    {tab === 'all' ? 'Tất cả' : tab === 'users' ? 'Người dùng' : tab === 'content' ? 'Nội dung' : 'Hệ thống'}
                    {activeTab === tab && <motion.div layoutId="tab-underline" style={{ position: 'absolute', bottom: '-1rem', left: 0, right: 0, height: '3px', background: 'var(--primary)', borderRadius: '10px' }} />}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="custom-scrollbar">
                {[
                  { id: 1, type: 'system', title: 'Đồng bộ cơ sở dữ liệu', time: '15 phút trước', desc: 'Dữ liệu Thử thách đã được cập nhật thành công lên Firestore.', icon: CheckCircle, color: '#10b981' },
                  { id: 2, type: 'users', title: 'Người dùng mới', time: '2 giờ trước', desc: 'Thành viên \'Thanh Nam\' vừa đăng ký tài khoản qua Google.', icon: User, color: '#6366f1' },
                  { id: 3, type: 'content', title: 'Cập nhật Địa danh', time: '4 giờ trước', desc: 'Thông tin \'Chùa Hang\' vừa được Admin chỉnh sửa nội dung Khmer.', icon: Info, color: '#f59e0b' },
                  { id: 4, type: 'system', title: 'Bảo trì định kỳ', time: '1 ngày trước', desc: 'Hệ thống đã hoàn tất kiểm tra bảo mật hàng tuần.', icon: Shield, color: '#6366f1' }
                ].filter(item => activeTab === 'all' || item.type === activeTab).map(item => (
                  <ActivityItem key={item.id} title={item.title} time={item.time} desc={item.desc} icon={item.icon} color={item.color} />
                ))}
              </div>

              <div style={{ textAlign: 'center', padding: '1.5rem 0 0', opacity: 0.5, borderTop: '1px solid var(--border-light)', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.8125rem' }}>Đã hiển thị tất cả hoạt động trong 7 ngày qua</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ActivityItem = ({ title, time, desc, icon: Icon, color }: any) => (
  <div style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem', borderRadius: '20px', background: 'var(--bg-main)', border: '1px solid var(--border-light)' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
      <Icon size={22} color={color} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
        <h4 style={{ fontWeight: 800, fontSize: '0.95rem' }}>{title}</h4>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{time}</span>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</p>
    </div>
  </div>
);

export default Dashboard;


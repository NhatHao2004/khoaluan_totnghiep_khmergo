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
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const nonAdminCount = snap.docs.filter(doc => doc.data().role !== 'Quản trị viên').length;
      setStats(prev => ({ ...prev, users: nonAdminCount }));
    });
    const unsubDests = onSnapshot(collection(db, 'destinations'), (snap) => setStats(prev => ({ ...prev, destinations: snap.size })));
    const unsubQuizzes = onSnapshot(collection(db, 'quizzes'), (snap) => setStats(prev => ({ ...prev, quizzes: snap.size })));
    const unsubPosts = onSnapshot(collection(db, 'posts'), (snap) => setStats(prev => ({ ...prev, posts: snap.size })));

    // Real-time listener for activities
    const unsubLogs = onSnapshot(collection(db, 'logs'), (snap) => {
      const logData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setLogs(logData);
    });

    return () => {
      unsubUsers();
      unsubDests();
      unsubQuizzes();
      unsubPosts();
      unsubLogs();
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
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>Theo dõi các chỉ số quan trọng của ứng dụng KhmerGo</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard title="Người dùng" value={stats.users} icon={User} color="#ff0000ff" onClick={() => navigate('/users')} />
        <StatCard title="Nội dung" value={stats.destinations} icon={BookOpen} color="#00ffaaff" />
        <StatCard title="Thử thách" value={stats.quizzes} icon={HelpCircle} color="#ffa200ff" />
        <StatCard title="Bài viết" value={stats.posts} icon={MessageSquare} color="#ff0080ff" />
      </div>

      <div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Hoạt động gần đây</h2>
            <button className="btn" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', background: '#eff6ff', color: '#2563eb', borderRadius: '10px', fontWeight: 700 }} onClick={() => { setIsHistoryOpen(true); setActiveTab('all'); }}>
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
                {logs.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, padding: '4rem 0' }}>
                    <MessageSquare size={64} style={{ marginBottom: '2.5rem', opacity: 0.2 }} />
                    <p style={{ fontSize: '1rem', fontWeight: 600 }}>Hệ thống chưa ghi nhận hoạt động nào</p>
                  </div>
                ) : (
                  logs.filter(item => activeTab === 'all' || item.type === activeTab).map((item: any) => {
                    const iconMap: any = { system: Shield, users: User, content: Info, default: CheckCircle };
                    const colorMap: any = { system: '#1e293b', users: '#10b981', content: '#f59e0b', default: '#10b981' };
                    const Icon = iconMap[item.type] || iconMap.default;
                    const color = colorMap[item.type] || colorMap.default;

                    const formatTime = (ts: any) => {
                      if (!ts) return 'Vừa xong';
                      const date = ts.toDate ? ts.toDate() : new Date(ts);
                      const now = new Date();
                      const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
                      if (diff < 1) return 'Vừa xong';
                      if (diff < 60) return `${diff} phút trước`;
                      if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
                      return date.toLocaleDateString('vi-VN');
                    };

                    return (
                      <ActivityItem
                        key={item.id}
                        title={item.title || 'Hoạt động hệ thống'}
                        time={formatTime(item.timestamp)}
                        desc={item.desc || 'Thao tác không có mô tả chi tiết.'}
                        icon={Icon}
                        color={color}
                      />
                    );
                  })
                )}
              </div>

              <div style={{ textAlign: 'center', padding: '1.5rem 0 0', opacity: 0.5, borderTop: '1px solid var(--border-light)', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.8125rem' }}>Hiển thị tất cả hoạt động trong 7 ngày qua</p>
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


import { collection, getDocs, limit, onSnapshot, orderBy, query, writeBatch } from 'firebase/firestore';
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
  const [leaderboardType, setLeaderboardType] = useState<'weekly' | 'all'>('weekly');
  const [topUsers, setTopUsers] = useState<any[]>(Array(20).fill(null).map((_, i) => ({
    id: `init-${i}`,
    name: '---',
    points: 0,
    avatar: null
  })));
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

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

    const limitCount = leaderboardType === 'weekly' ? 10 : 20;
    const unsubLeaderboard = onSnapshot(
      query(collection(db, 'users'), orderBy('points', 'desc'), limit(limitCount)),
      (snap) => {
        const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        const paddedUsers = [...users];
        while (paddedUsers.length < limitCount) {
          paddedUsers.push({
            id: `dummy-${paddedUsers.length}`,
            name: '---',
            points: 0,
            avatar: null
          });
        }
        setTopUsers(paddedUsers);
      }
    );

    return () => {
      unsubUsers();
      unsubDests();
      unsubQuizzes();
      unsubPosts();
      unsubLogs();
      unsubLeaderboard();
    };
  }, [leaderboardType]);

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

  const handleClearLogs = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xóa tất cả',
      message: 'Bạn có chắc chắn muốn xóa toàn bộ nhật ký hoạt động không. Hành động này không thể hoàn tác',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const batch = writeBatch(db);
          const querySnapshot = await getDocs(collection(db, 'logs'));
          querySnapshot.forEach((docSnap) => {
            batch.delete(docSnap.ref);
          });
          await batch.commit();
        } catch (error) {
          console.error("Error clearing logs:", error);
        }
      }
    });
  };



  const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <div className="card glass-card stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', padding: 'clamp(0.75rem, 3vw, 1.25rem)' }}>
      <div style={{
        padding: 'clamp(0.6rem, 2vw, 0.875rem)',
        borderRadius: '12px',
        background: `${color}15`,
        color: color,
        width: 'fit-content',
        marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={28} strokeWidth={2.5} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="label" style={{ margin: 0, fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', fontWeight: 600, whiteSpace: 'nowrap' }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
          <h3 className="value" style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 800 }}>{value}</h3>
          <span style={{ fontSize: 'clamp(0.55rem, 2vw, 0.7rem)', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>tổng cộng</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.25rem, 5vw, 1.75rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>Tổng quan hệ thống</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: 'clamp(0.7rem, 2.3vw, 0.9rem)', whiteSpace: 'nowrap' }}>Theo dõi các chỉ số quan trọng của ứng dụng KhmerGo</p>
      </div>



      <div className="stats-grid">
        <StatCard title="Người dùng" value={stats.users} icon={User} color="#ef4444" onClick={() => navigate('/users')} />
        <StatCard title="Nội dung" value={stats.destinations} icon={BookOpen} color="#10b981" onClick={() => navigate('/destinations')} />
        <StatCard title="Thử thách" value={stats.quizzes} icon={HelpCircle} color="#f59e0b" onClick={() => navigate('/challenges')} />
        <StatCard title="Bài viết" value={stats.posts} icon={MessageSquare} color="#ec4899" onClick={() => navigate('/article')} />
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)', fontWeight: 700, whiteSpace: 'nowrap' }}>Biểu đồ bảng xếp hạng</h2>
          <div style={{ display: 'flex', background: 'var(--bg-accent)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
            <button
              onClick={() => setLeaderboardType('weekly')}
              style={{
                padding: '6px 14px',
                borderRadius: '9px',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: leaderboardType === 'weekly' ? '#3b82f6' : 'transparent',
                color: leaderboardType === 'weekly' ? 'white' : 'var(--text-muted)',
                whiteSpace: 'nowrap'
              }}
            >
              Hàng tuần
            </button>
            <button
              onClick={() => setLeaderboardType('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '9px',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: leaderboardType === 'all' ? '#3b82f6' : 'transparent',
                color: leaderboardType === 'all' ? 'white' : 'var(--text-muted)',
                whiteSpace: 'nowrap'
              }}
            >
              Tất cả
            </button>
          </div>
        </div>

        <div className="card glass-card" style={{ padding: '1.5rem 1rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div className="custom-scrollbar" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minWidth: '600px', gap: '0.75rem', height: '320px', paddingBottom: '1rem', margin: '0 auto' }}>
            <style>{`
              .custom-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {/* Sequential Ranking Logic (Rank 1, 2, 3) */}
            {[0, 1, 2].map((uIdx) => {
              const user = topUsers[uIdx];
              const rank = uIdx + 1; // 0->1, 1->2, 2->3
              const color = rank === 1 ? '#ef4444' : rank === 2 ? '#f8d330' : '#22c55e';
              const height = rank === 1 ? '65%' : rank === 2 ? '48%' : '35%';

              return (
                <div key={`${leaderboardType}-podium-${rank}`} style={{ width: '100px', flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <div style={{ marginBottom: '0.75rem', textAlign: 'center', width: '100%' }}>
                    <div style={{ width: rank === 1 ? '60px' : '48px', height: rank === 1 ? '60px' : '48px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden', margin: '0 auto 0.4rem', background: 'white' }}>
                      {user?.avatar && user.avatar !== "" ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={user.name} /> : <User size={rank === 1 ? 28 : 20} style={{ margin: rank === 1 ? '16px' : '14px', color: '#94a3b8' }} />}
                    </div>
                    <p style={{ fontWeight: 800, fontSize: '0.75rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || '---'}</p>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>{user?.points || 0} Điểm</p>
                  </div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height }}
                    transition={{ duration: 1, delay: rank * 0.1 }}
                    style={{ width: '100%', background: color, borderRadius: '10px 10px 4px 4px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0.5rem', boxShadow: `0 8px 16px ${color}22` }}
                  >
                    <div style={{ position: 'absolute', bottom: '0.5rem', color: 'white', fontWeight: 900, fontSize: '1.5rem' }}>{rank}</div>
                  </motion.div>
                </div>
              );
            })}

            {/* Ranks 4+ (Black Bars) */}
            {topUsers.slice(3, leaderboardType === 'weekly' ? 10 : 20).map((user, idx) => {
              const rank = idx + 4;
              return (
                <div key={`${leaderboardType}-rank-${rank}`} style={{ width: '80px', flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <div style={{ marginBottom: '0.75rem', textAlign: 'center', width: '100%' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden', margin: '0 auto 0.4rem', background: 'white' }}>
                      {user?.avatar && user.avatar !== "" ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={user.name} /> : <User size={16} style={{ margin: '10px', color: '#cbd5e1' }} />}
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '0.65rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#64748b' }}>{user?.name || '---'}</p>
                    <p style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>{user?.points || 0} Điểm</p>
                  </div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: '20%' }}
                    transition={{ duration: 0.5, delay: 0.5 + idx * 0.05 }}
                    style={{ width: '100%', background: '#3b82f6', borderRadius: '8px 8px 4px 4px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 8px rgba(59,130,246,0.1)' }}
                  >
                    <div style={{ position: 'absolute', bottom: '0.5rem', color: 'white', fontWeight: 800, fontSize: '1rem', opacity: 0.8 }}>{rank}</div>
                  </motion.div>
                </div>
              );
            })}
          </div>


        </div>
      </div>

      <div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Hoạt động gần đây</h2>
            <button className="btn" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', background: '#0f172a', color: '#fff', borderRadius: '10px', fontWeight: 700, minHeight: '36px' }} onClick={() => { setIsHistoryOpen(true); setActiveTab('all'); }}>
              Xem tất cả
            </button>
          </div>
          <div
            className="custom-scrollbar"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              height: '200px',
              overflowY: 'auto',
              paddingRight: '0.5rem'
            }}
          >
            {logs.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
                <MessageSquare size={32} style={{ marginBottom: '1rem' }} />
                <p style={{ fontSize: 'clamp(0.75rem, 2.8vw, 0.875rem)', whiteSpace: 'nowrap' }}>Không có hoạt động mới nào được ghi nhận lại</p>
              </div>
            ) : (
              logs.map((item: any) => {
                const iconMap: any = { system: Shield, users: User, content: Info, default: CheckCircle };
                const colorMap: any = { system: '#1e293b', users: '#10b981', content: '#f59e0b', default: '#10b981' };
                const Icon = iconMap[item.type] || iconMap.default;
                const color = colorMap[item.type] || colorMap.default;

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
                  {logs.length > 0 && (
                    <button
                      onClick={handleClearLogs}
                      style={{
                        marginLeft: '1rem',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: '#fee2e2',
                        color: '#ef4444',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className="btn" style={{ padding: '8px', background: 'var(--bg-accent)', color: 'var(--danger)' }}><X size={25} /></button>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                {['all', 'users', 'feedback', 'system'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{ border: 'none', background: 'transparent', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 700, color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                    {tab === 'all' ? 'Tất cả' : tab === 'users' ? 'Người dùng' : tab === 'feedback' ? 'Phản hồi' : 'Hệ thống'}
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
                  logs.filter(item => activeTab === 'all' || item.type === activeTab || (activeTab === 'feedback' && item.type === 'content')).map((item: any) => {
                    const iconMap: any = { system: Shield, users: User, feedback: Info, content: Info, default: CheckCircle };
                    const colorMap: any = { system: '#1e293b', users: '#10b981', feedback: '#f59e0b', content: '#f59e0b', default: '#10b981' };
                    const Icon = iconMap[item.type] || iconMap.default;
                    const color = colorMap[item.type] || colorMap.default;

                    return (
                      <ActivityItem
                        key={item.id}
                        title={item.title || 'Hoạt động hệ thống'}
                        time={formatTime(item.timestamp)}
                        desc={item.desc || 'Thao tác không có mô tả chi tiết'}
                        icon={Icon}
                        color={color}
                      />
                    );
                  })
                )}
              </div>


            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1.5rem' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
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
              <div style={{ width: '60px', height: '60px', background: '#fee2e2', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Shield size={28} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{confirmDialog.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>{confirmDialog.message}</p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn"
                  style={{ flex: 1, background: 'var(--bg-accent)', color: 'var(--text-primary)', fontWeight: 600, borderRadius: '14px' }}
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                >
                  Hủy bỏ
                </button>
                <button
                  className="btn"
                  style={{ flex: 1, background: '#ef4444', color: 'white', fontWeight: 600, borderRadius: '14px' }}
                  onClick={confirmDialog.onConfirm}
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ActivityItem = ({ title, time, desc, icon: Icon, color }: any) => (
  <div style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem', borderRadius: '20px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', position: 'relative' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
      <Icon size={22} color={color} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
        <h4 style={{ fontWeight: 800, fontSize: '0.95rem' }}>{title}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{time}</span>
        </div>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</p>
    </div>
  </div>
);

export default Dashboard;


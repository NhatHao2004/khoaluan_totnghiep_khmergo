import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { User, BookOpen, HelpCircle, MessageSquare, ArrowUpRight, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    destinations: 0,
    quizzes: 0,
    posts: 0
  });

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

  const StatCard = ({ title, value, icon: Icon, trend, color, onClick }: any) => (
    <div className="card glass-card stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ padding: '0.75rem', borderRadius: '12px', background: `${color}15`, color: color }}>
          <Icon size={24} />
        </div>
        <div className={`trend ${trend > 0 ? 'trend-up' : 'trend-down'}`}>
          <TrendingUp size={14} />
          <span>{trend}%</span>
        </div>
      </div>
      <div style={{ marginTop: '1.25rem' }}>
        <span className="label">{title}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <h3 className="value">{value}</h3>
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
        <StatCard title="Người dùng" value={stats.users} icon={User} trend={12} color="#6366f1" onClick={() => navigate('/users')} />
        <StatCard title="Nội dung" value={stats.destinations} icon={BookOpen} trend={5} color="#10b981" />
        <StatCard title="Thử thách" value={stats.quizzes} icon={HelpCircle} trend={8} color="#f59e0b" />
        <StatCard title="Bài viết cộng đồng" value={stats.posts} icon={MessageSquare} trend={24} color="#ec4899" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Hoạt động gần đây</h2>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
              Xem tất cả <ArrowUpRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '12px', background: 'var(--bg-main)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={20} color="var(--primary)" />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Cập nhật hệ thống thành công</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Cơ sở dữ liệu đã được đồng bộ hóa với KhmerGo App</p>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{i * 15} phút trước</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card glass-card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', border: 'none' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Sẵn sàng cho ngày làm việc mới?</h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '2rem', lineHeight: 1.6 }}>Hệ thống đang hoạt động ổn định với hiệu suất 99.9%. Chúc bạn một ngày tốt lành!</p>
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Tốc độ phản hồi</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>98%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: '98%', height: '100%', background: 'white' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


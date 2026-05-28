import { collection, getDocs } from 'firebase/firestore';
import { BookOpen, MapPin, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../firebase/config';

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    destinations: 0,
    quizzes: 0,
    posts: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const destSnap = await getDocs(collection(db, 'destinations'));
        const quizSnap = await getDocs(collection(db, 'quizzes'));
        const postsSnap = await getDocs(collection(db, 'posts'));
        
        setStats({
          users: usersSnap.size,
          destinations: destSnap.size,
          quizzes: quizSnap.size,
          posts: postsSnap.size
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: '0' }}>
      <div style={{ padding: '0.875rem', borderRadius: '12px', background: `${color}15`, color: color, flexShrink: 0 }}>
        <Icon size={24} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap', marginBottom: '0.25rem', lineHeight: '1.4' }}>{title}</p>
        <h3 style={{ fontSize: '1.375rem', fontWeight: 700, whiteSpace: 'nowrap', lineHeight: '1.2' }}>{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Tổng quan</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Người dùng" value={stats.users} icon={Users} color="#3b82f6" />
        <StatCard title="Địa danh" value={stats.destinations} icon={MapPin} color="#d4af37" />
        <StatCard title="Câu đố" value={stats.quizzes} icon={BookOpen} color="#10b981" />
        <StatCard title="Bài viết" value={stats.posts} icon={TrendingUp} color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Phản hồi mới</h3>
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            Chưa có phản hồi mới
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

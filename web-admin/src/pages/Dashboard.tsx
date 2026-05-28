import { collection, getDocs } from 'firebase/firestore';
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

  const StatCard = ({ title, value, background, onClick }: any) => (
    <div
      className="card stat-card"
      onClick={onClick}
      style={{ background, cursor: onClick ? 'pointer' : 'default' }}
    >
      <div>
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Tổng người dùng" value={stats.users} background="var(--card-orange)" onClick={() => navigate('/users')} />
        <StatCard title="Địa danh" value={stats.destinations} background="var(--card-green)" />
        <StatCard title="Câu đố" value={stats.quizzes} background="var(--card-pink)" />
        <StatCard title="Bài viết mới" value={stats.posts} background="var(--card-blue)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', flex: 1 }}>
        <div className="card" style={{ minHeight: 'calc(100vh - 300px)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Phản hồi mới</h2>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <p>Chưa có phản hồi mới</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

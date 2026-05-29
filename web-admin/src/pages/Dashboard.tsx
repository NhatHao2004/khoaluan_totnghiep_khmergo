import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    destinations: 0,
    quizzes: 0,
    posts: 0
  });

  useEffect(() => {
    let unsubUsers: any, unsubDests: any, unsubQuizzes: any, unsubPosts: any;

    const startListening = () => {
      unsubUsers = onSnapshot(collection(db, 'users'), (snap) => setStats(prev => ({ ...prev, users: snap.size })));
      unsubDests = onSnapshot(collection(db, 'destinations'), (snap) => setStats(prev => ({ ...prev, destinations: snap.size })));
      unsubQuizzes = onSnapshot(collection(db, 'quizzes'), (snap) => setStats(prev => ({ ...prev, quizzes: snap.size })));
      unsubPosts = onSnapshot(collection(db, 'posts'), (snap) => setStats(prev => ({ ...prev, posts: snap.size })));
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        startListening();
      } else {
        signInAnonymously(auth).catch((err) => console.error("Auth error:", err));
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUsers) unsubUsers();
      if (unsubDests) unsubDests();
      if (unsubQuizzes) unsubQuizzes();
      if (unsubPosts) unsubPosts();
    };
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
        <StatCard title="Nội dung" value={stats.destinations} background="var(--card-green)" />
        <StatCard title="Thử thách" value={stats.quizzes} background="var(--card-pink)" />
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

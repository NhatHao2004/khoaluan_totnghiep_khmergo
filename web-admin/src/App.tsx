import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Challenges from './pages/Challenges';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Destinations from './pages/Destinations';
import Users from './pages/Users';
import { Bell } from 'lucide-react';
import './index.css';

const TopBar = () => (
  <header className="top-bar">
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'flex-end', padding: '1rem 2rem' }}>
      <div style={{ position: 'relative', color: 'var(--text-muted)', cursor: 'pointer' }}>
        <Bell size={20} />
        <span style={{ position: 'absolute', top: -5, right: -5, width: 8, height: 8, background: '#ff5370', borderRadius: '50%' }}></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
        <img src="https://i.pravatar.cc/150?u=admin" style={{ width: 35, height: 35, borderRadius: '50%', objectFit: 'cover' }} alt="Admin" />
        <span style={{ fontWeight: 600 }}>Admin User</span>
      </div>
    </div>
  </header>
);

const RouteTransition = ({ children }: { children: React.ReactNode }) => (
  <div className="fade-in">{children}</div>
);

function App() {
  return (
    <Router>
      <div className="app-container" style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main className="main-content" style={{ flex: 1 }}>
          <TopBar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/destinations" element={<RouteTransition><Destinations /></RouteTransition>} />
            <Route path="/users" element={<RouteTransition><Users /></RouteTransition>} />
            <Route path="/challenges" element={<RouteTransition><Challenges /></RouteTransition>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

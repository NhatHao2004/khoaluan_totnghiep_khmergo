import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Destinations from './pages/Destinations';
import './index.css';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/quizzes" element={
              <div className="card">
                <h1>Quản lý Câu đố</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Tính năng này đang được phát triển.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

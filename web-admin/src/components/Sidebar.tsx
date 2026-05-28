import { BookOpen, LayoutDashboard, LogOut, MapPin } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ width: 40, height: 40, background: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#000', fontSize: '1.2rem', fontWeight: 900 }}>K</span>
        </div>
        KhmerGo
      </div>

      <nav style={{ flex: 1 }}>
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} color="#3b82f6" />
          Trang chủ
        </NavLink>
        <NavLink to="/destinations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <MapPin size={20} color="#f59e0b" />
          Địa danh
        </NavLink>
        <NavLink to="/quizzes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BookOpen size={20} color="#10b981" />
          Câu đố
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
        <button className="nav-link" style={{ width: '100%', border: 'none', background: 'none', marginBottom: 0 }}>
          <LogOut size={20} color="#ef4444" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

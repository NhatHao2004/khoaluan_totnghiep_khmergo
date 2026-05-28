import { BookOpen, LayoutDashboard, LogOut, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import icon from '../assets/icon.png';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={icon} alt="KhmerGo Logo" style={{ width: 28, height: 28, marginRight: '10px', borderRadius: '6px' }} />
        <span>KhmerGo</span>
      </div>

      <div style={{ height: '1px', background: 'rgba(0,0,0,0.1)', width: '100%' }}></div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <LayoutDashboard size={18} />
          Trang chủ
        </NavLink>

        <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <Users size={18} />
          Người dùng
        </NavLink>

        <NavLink to="/destinations" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <BookOpen size={18} />
          Nội dung
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto', padding: '1.5rem' }}>
        <button className="nav-link" style={{ width: '100%', background: 'none', border: 'none', padding: '10px 0' }}>
          <LogOut size={18} color="#ff5370" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

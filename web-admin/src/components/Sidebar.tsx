import { LayoutDashboard, BookOpen, HelpCircle, Power, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import icon from '../assets/icon.png';

const Sidebar = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ background: 'white' }}>
        <img src={icon} alt="KhmerGo Logo" style={{ width: 50, height: 50, marginRight: '12px', borderRadius: '10px' }} />
        <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#000000ff' }}>KhmerGo</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <LayoutDashboard size={20} strokeWidth={2} />
          <span>Bảng điều khiển</span>
        </NavLink>

        <div className="sidebar-label" style={{ marginTop: '1.5rem' }}>Quản lý</div>
        <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <User size={20} strokeWidth={2} />
          <span>Người dùng</span>
        </NavLink>

        <NavLink to="/destinations" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <BookOpen size={20} strokeWidth={2} />
          <span>Nội dung</span>
        </NavLink>

        <NavLink to="/challenges" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <HelpCircle size={20} strokeWidth={2} />
          <span>Thử thách</span>
        </NavLink>


      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <button
          className="nav-link"
          onClick={onLogout}
          style={{
            width: '100%',
            background: '#0f172a',
            border: 'none',
            cursor: 'pointer',
            color: '#ffffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem'
          }}
        >
          <Power size={20} strokeWidth={2} />
          <span style={{ fontWeight: 600 }}>Đăng xuất tài khoản</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

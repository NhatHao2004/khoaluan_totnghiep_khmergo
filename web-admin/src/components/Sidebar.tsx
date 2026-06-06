import { BookOpen, FileText, Gamepad2, LayoutDashboard, Power, Type, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import icon from '../assets/icon.png';

const Sidebar = ({ onLogout, isOpen, onClose }: { onLogout: () => void, isOpen: boolean, onClose: () => void }) => {
  const NavItem = ({ to, icon: Icon, children }: any) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
      onClick={onClose}
    >
      <Icon size={20} strokeWidth={2} />
      <span>{children}</span>
    </NavLink>
  );

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo" style={{ background: 'white' }}>
        <img src={icon} alt="KhmerGo Logo" style={{ width: 40, height: 40, marginRight: '12px', borderRadius: '10px' }} />
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#000' }}>KhmerGo</span>
      </div>

      <nav className="sidebar-nav">
        <NavItem to="/" icon={LayoutDashboard}>Bảng điều khiển</NavItem>

        <div className="sidebar-label">Quản lý ứng dụng</div>
        <NavItem to="/users" icon={User}>Người dùng</NavItem>
        <NavItem to="/destinations" icon={BookOpen}>Nội dung</NavItem>
        <NavItem to="/challenges" icon={Gamepad2}>Thử thách</NavItem>
        <NavItem to="/vocabulary" icon={Type}>Từ vựng</NavItem>
        <NavItem to="/article" icon={FileText}>Bài viết cộng đồng</NavItem>
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
        <button
          className="nav-link"
          onClick={() => {
            onClose();
            onLogout();
          }}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem'
          }}
        >
          <Power size={20} strokeWidth={2} />
          <span style={{ fontWeight: 600 }}>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

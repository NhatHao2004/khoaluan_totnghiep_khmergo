import { BookOpen, HelpCircle, LayoutDashboard, LogOut, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

import icon from '../assets/icon.png';

const Sidebar = () => {
  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      try {
        await signOut(auth);
        window.location.href = '/'; // Or redirect using useNavigate
      } catch (error) {
        console.error("Lỗi khi đăng xuất:", error);
      }
    }
  };

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
          <User size={18} />
          Người dùng
        </NavLink>

        <NavLink to="/destinations" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <BookOpen size={18} />
          Nội dung
        </NavLink>

        <NavLink to="/challenges" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <HelpCircle size={18} />
          Thử thách
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto', padding: '1.5rem' }}>
        <button 
          className="nav-link" 
          onClick={handleLogout}
          style={{ width: '100%', background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer' }}
        >
          <LogOut size={18} color="#ff5370" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

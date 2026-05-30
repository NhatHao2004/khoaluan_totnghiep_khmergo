import { signOut } from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, HelpCircle, LayoutDashboard, LogOut, Power, Settings, User, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { auth } from '../firebase/config';

import icon from '../assets/icon.png';

const Sidebar = () => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLogoutModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  return (
    <>
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

          <div className="sidebar-label" style={{ marginTop: '1.5rem' }}>Hệ thống</div>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Settings size={20} strokeWidth={2} />
            <span>Cài đặt</span>
          </NavLink>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <button
            className="nav-link"
            onClick={() => setIsLogoutModalOpen(true)}
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

      {/* Custom Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
              onClick={() => setIsLogoutModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="card"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem',
                textAlign: 'center',
                borderRadius: '32px',
                background: 'white',
                boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
              }}
            >
              <button 
                onClick={() => setIsLogoutModalOpen(false)}
                style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <div style={{ 
                width: '70px', 
                height: '70px', 
                background: '#fef2f2', 
                borderRadius: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.5rem' 
              }}>
                <LogOut size={32} color="#ef4444" strokeWidth={2.5} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>Xác nhận đăng xuất</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                Bạn có chắc chắn muốn rời khỏi hệ thống quản trị KhmerGo không?
              </p>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  className="btn" 
                  style={{ flex: 1, background: '#f1f5f9', color: '#475569', fontWeight: 700, borderRadius: '14px', border: 'none', padding: '0.875rem' }} 
                  onClick={() => setIsLogoutModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button 
                  className="btn" 
                  style={{ flex: 1.5, background: '#ef4444', color: 'white', fontWeight: 700, borderRadius: '14px', border: 'none', padding: '0.875rem', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)' }} 
                  onClick={handleLogout}
                >
                  Đăng xuất ngay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;


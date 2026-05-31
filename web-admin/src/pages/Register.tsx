import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Lưu thông tin người dùng vào Firestore với role Quản trị viên (để test)
      // Trong thực tế, role này nên được phê duyệt bởi Super Admin
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: fullName,
        role: 'Quản trị viên', // Tạm thời để Quản trị viên để có thể vào được hệ thống
        createdAt: new Date(),
        status: 'active'
      });

      navigate('/login');
    } catch (err: any) {
      console.error("Firebase Auth Error:", err.code, err.message);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email này đã được sử dụng');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu quá yếu (tối thiểu 6 ký tự)');
      } else {
        setError('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
      position: 'relative',
      overflow: 'hidden',
      padding: '2rem'
    }}>
      {/* Decorative Orbs */}
      <div style={{ position: 'absolute', top: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)', borderRadius: '50%' }} />

      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        borderRadius: '32px',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
        padding: '3.5rem 3rem',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        position: 'relative',
        zIndex: 10
      }}>
        <button 
          onClick={() => navigate('/login')}
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b'
          }}
          className="hover-lift"
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#ffffff',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 8px 16px -4px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <ShieldCheck color="#3b82f6" size={32} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>Đăng ký tài khoản</h1>
          <p style={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem' }}>Tạo tài khoản quản trị KhmerGo</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            border: '1px solid #fee2e2'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Họ và tên</label>
            <div style={{ position: 'relative' }}>
              <div style={iconContainerStyle}>
                <User size={20} strokeWidth={2} />
              </div>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Email</label>
            <div style={{ position: 'relative' }}>
              <div style={iconContainerStyle}>
                <Mail size={20} strokeWidth={2} />
              </div>
              <input
                type="email"
                placeholder="admin@khmergo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={labelStyle}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <div style={iconContainerStyle}>
                <Lock size={20} strokeWidth={2} />
              </div>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#3b82f6',
              color: '#fff',
              padding: '14px',
              borderRadius: '16px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="hover-lift"
          >
            {loading ? <Loader2 className="animate-spin" size={20} strokeWidth={2.5} /> : (
              <span>Đăng ký ngay</span>
            )}
          </button>
        </form>
      </div>

      <style>{`
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.3);
        }
        .hover-lift:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: 800,
  color: '#94a3b8',
  textTransform: 'uppercase',
  marginBottom: '8px',
  marginLeft: '4px',
  letterSpacing: '0.05em'
} as any;

const iconContainerStyle = {
  position: 'absolute',
  left: '18px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#94a3b8'
} as any;

const inputStyle = {
  width: '100%',
  padding: '14px 16px 14px 52px',
  borderRadius: '16px',
  border: '1.5px solid #e2e8f0',
  fontSize: '0.925rem',
  color: '#1e293b',
  fontWeight: 500,
  outline: 'none',
  transition: 'all 0.2s ease',
  background: '#ffffff',
} as any;

export default Register;

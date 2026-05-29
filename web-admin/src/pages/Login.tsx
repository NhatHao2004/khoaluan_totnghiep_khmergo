import { signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { auth } from '../firebase/config';

const Login = () => {
  const [email, setEmail] = useState('lamhao860@gmail.com');
  const [password, setPassword] = useState('123456789');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Firebase Auth Error:", err.code, err.message);
      if (err.code === 'auth/invalid-credential') {
        setError('Email hoặc mật khẩu không chính xác.');
      } else {
        setError('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
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
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        background: '#fff',
        borderRadius: '32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.05)',
        padding: '3rem',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 16px rgba(59,130,246,0.1)'
          }}>
            <Lock color="#fff" size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>Hệ thống Admin</h1>
          <p style={{ color: '#64748b', fontWeight: 500 }}>Vui lòng đăng nhập bằng tài khoản Quản trị viên</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            color: '#ef4444',
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

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', marginLeft: '4px' }}>Email Quản Trị</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Mail size={18} />
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
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', marginLeft: '4px' }}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="••••••••"
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
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
              gap: '10px',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 20px rgba(37,99,235,0.1)'
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Đăng nhập hệ thống'}
          </button>
        </form>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '14px 14px 14px 48px',
  borderRadius: '16px',
  border: '2px solid #f1f5f9',
  fontSize: '0.9375rem',
  color: '#1e293b',
  fontWeight: 600,
  outline: 'none',
  transition: 'border-color 0.2s ease',
  background: '#f8fafc'
};

export default Login;

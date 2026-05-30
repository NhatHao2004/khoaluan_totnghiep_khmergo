import { signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
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
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            width: '72px',
            height: '72px',
            background: '#ffffff',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 16px -4px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <ShieldCheck color="#3b82f6" size={36} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>KhmerGo</h1>
          <p style={{ color: '#64748b', fontWeight: 500, fontSize: '0.925rem' }}>Hệ thống quản lý</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            color: '#dc2626',
            padding: '14px 16px',
            borderRadius: '16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '2rem',
            border: '1px solid #fee2e2',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px', marginLeft: '4px', letterSpacing: '0.05em' }}>Email quản trị viên</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
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

          <div style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px', marginLeft: '4px', letterSpacing: '0.05em' }}>Mật khẩu bảo mật</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
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
              background: '#004cffff',
              color: '#fff',
              padding: '16px',
              borderRadius: '18px',
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
              <span>Truy cập hệ thống</span>
            )}
          </button>
        </form>
      </div>

      <style>{`
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 25px -5px rgba(15, 23, 42, 0.3) !important;
        }
        .hover-lift:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '16px 16px 16px 52px',
  borderRadius: '18px',
  border: '1.5px solid #e2e8f0',
  fontSize: '0.925rem',
  color: '#1e293b',
  fontWeight: 500,
  outline: 'none',
  transition: 'all 0.2s ease',
  background: '#ffffff',
} as any;

export default Login;


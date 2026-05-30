import { User, Mail, Shield, Calendar, MapPin, Camera, Save, Loader2, CheckCircle2, Award, BadgeCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  const [adminInfo, setAdminInfo] = useState({
    name: 'Admin User',
    email: '',
    role: 'Quản trị viên',
    joinDate: 'Đang cập nhật...',
    location: 'Việt Nam',
    avatar: 'https://i.pravatar.cc/150?u=admin'
  });

  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          const info = {
            name: userData?.name || userData?.['tên'] || user.displayName || 'Admin User',
            email: user.email || userData?.email || 'admin@khmergo.com',
            role: userData?.role || 'Quản trị viên cấp cao',
            joinDate: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('vi-VN') : '29/05/2026',
            location: userData?.location || 'Trà Vinh, Việt Nam',
            avatar: userData?.avatar || userData?.['hình đại diện'] || user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`
          };
          
          setAdminInfo(info);
          setEditForm({
            name: info.name,
            location: info.location,
          });
        } catch (error) {
          console.error("Lỗi khi tải thông tin admin:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!uid) return;
    setUpdating(true);
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        name: editForm.name,
        location: editForm.location,
      });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: editForm.name,
        });
      }

      setAdminInfo(prev => ({
        ...prev,
        name: editForm.name,
        location: editForm.location
      }));
      
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Lỗi khi cập nhật profile:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '1rem' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Tải thông tin cá nhân...</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} style={{ position: 'fixed', top: '2rem', right: '2rem', background: 'var(--success)', color: '#fff', padding: '1rem 1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 1000, fontWeight: 700 }}>
            <CheckCircle2 size={20} />
            Hồ sơ đã được cập nhật
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
        {/* Banner Section */}
        <div style={{ 
          height: '240px', 
          background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)', 
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          <div style={{ position: 'absolute', bottom: '-4rem', left: '3rem', display: 'flex', alignItems: 'flex-end', gap: '2rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ 
                width: '160px', 
                height: '160px', 
                borderRadius: '32px', 
                padding: '6px', 
                background: 'white', 
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-light)'
              }}>
                <img src={adminInfo.avatar} style={{ width: '100%', height: '100%', borderRadius: '26px', objectFit: 'cover' }} alt="Avatar" />
              </div>
              <button className="btn btn-primary" style={{ position: 'absolute', bottom: '0.5rem', right: '-0.5rem', width: '40px', height: '40px', padding: 0, borderRadius: '12px', border: '3px solid white' }}>
                <Camera size={18} />
              </button>
            </div>
            <div style={{ paddingBottom: '4.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.025em' }}>{adminInfo.name}</h1>
                <BadgeCheck size={28} color="white" fill="var(--primary)" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, margin: '0.25rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={16} /> {adminInfo.role}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div style={{ padding: '6rem 3rem 3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Thông tin tài khoản</h2>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {isEditing ? (
                <>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={updating}>Hủy</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={updating}>
                    {updating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Lưu thay đổi
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Chỉnh sửa hồ sơ</button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {isEditing ? (
              <>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Họ và tên</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="input-field" style={{ paddingLeft: '3rem' }} value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Vị trí công tác</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="input-field" style={{ paddingLeft: '3rem' }} value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Địa chỉ Email (Không thể thay đổi)</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="input-field" style={{ paddingLeft: '3rem', background: 'var(--bg-accent)', color: 'var(--text-muted)', cursor: 'not-allowed' }} value={adminInfo.email} disabled />
                  </div>
                </div>
              </>
            ) : (
              <>
                <ProfileItem icon={User} label="Họ và tên" value={adminInfo.name} />
                <ProfileItem icon={Mail} label="Email liên hệ" value={adminInfo.email} />
                <ProfileItem icon={MapPin} label="Địa điểm làm việc" value={adminInfo.location} />
                <ProfileItem icon={Calendar} label="Ngày gia nhập" value={adminInfo.joinDate} />
              </>
            )}
          </div>

          <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-accent)', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Award size={20} color="var(--primary)" /> Giới thiệu quản trị viên
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontSize: '0.9375rem' }}>
              Bạn đang đăng nhập với tư cách là <strong>Quản trị viên cấp cao</strong> của hệ thống KhmerGo. Bạn có toàn quyền quản lý địa danh, người dùng và các bộ câu hỏi thử thách trên toàn hệ thống.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileItem = ({ icon: Icon, label, value }: any) => (
  <div style={{ padding: '1.5rem', borderRadius: '20px', background: 'white', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-accent)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} />
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
    </div>
  </div>
);

export default Profile;

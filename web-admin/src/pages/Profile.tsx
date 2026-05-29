import { User, Mail, Shield, Calendar, MapPin, Camera, Settings, Save, X, Loader2, CheckCircle2, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';

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
    avatar: ''
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
            avatar: info.avatar
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

      setAdminInfo({
        ...adminInfo,
        name: editForm.name,
        location: editForm.location
      });
      
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Lỗi khi cập nhật profile:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={32} color="#3b82f6" />
        <p style={{ color: '#64748b', fontWeight: 600, marginLeft: '12px' }}>Đang tải thông tin cá nhân...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.6s ease-out' }}>
      {showSuccess && (
        <div style={{ 
          position: 'fixed', 
          top: '30px', 
          right: '30px', 
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 
          color: '#fff', 
          padding: '16px 28px', 
          borderRadius: '16px', 
          boxShadow: '0 20px 40px rgba(5,150,105,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000,
          animation: 'slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
        }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: 700 }}>Đã lưu thay đổi thành công!</span>
        </div>
      )}

      <div style={{ 
        background: '#fff', 
        borderRadius: '32px', 
        boxShadow: '0 25px 80px rgba(0,0,0,0.06)',
        border: '1px solid #f1f5f9',
        position: 'relative',
      }}>
        {/* Banner */}
        <div style={{ 
          height: '220px', 
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 40%, #60a5fa 100%)', 
          position: 'relative',
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px',
        }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderTopLeftRadius: '32px', borderTopRightRadius: '32px' }}>
            <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '400px', height: '400px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(80px)' }}></div>
            <div style={{ position: 'absolute', bottom: '-20%', left: '10%', width: '300px', height: '300px', background: 'rgba(59,130,246,0.3)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
          </div>
          
          <div style={{ position: 'absolute', bottom: '-60px', left: '50px', display: 'flex', alignItems: 'flex-end', gap: '28px', zIndex: 10 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '150px', height: '150px', borderRadius: '40px', padding: '8px', background: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
                <img src={adminInfo.avatar} style={{ width: '100%', height: '100%', borderRadius: '32px', objectFit: 'cover' }} alt="Profile" />
              </div>
              <button style={{ position: 'absolute', bottom: '12px', right: '-10px', background: '#3b82f6', border: '4px solid #fff', width: '44px', height: '44px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 20px rgba(59,130,246,0.3)', color: '#fff', zIndex: 11 }}>
                <Camera size={20} />
              </button>
            </div>
            <div style={{ paddingBottom: '70px', color: '#fff' }}>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 900, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>{adminInfo.name}</h1>
              <p style={{ opacity: 0.9, fontWeight: 600, margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
                <Shield size={18} /> {adminInfo.role}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ paddingTop: '100px', paddingLeft: '40px', paddingRight: '40px', paddingBottom: '50px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Hồ sơ chi tiết</h3>
              {isEditing ? (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setIsEditing(false)} style={{ ...modernBtnStyle, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>Hủy</button>
                  <button onClick={handleSave} disabled={updating} style={{ ...modernBtnStyle, background: '#3b82f6', color: '#fff' }}>{updating ? 'Đang lưu...' : 'Lưu'}</button>
                </div>
              ) : (
                <button onClick={() => setIsEditing(true)} style={{ ...modernBtnStyle, background: '#f0f7ff', color: '#3b82f6', border: '1px solid #dbeafe' }}>Chỉnh sửa</button>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {isEditing ? (
                <>
                  <div style={{ gridColumn: 'span 2' }}>
                    <EditItem icon={<User size={18} />} label="Họ và tên" value={editForm.name} onChange={(v : any) => setEditForm({...editForm, name: v})} />
                  </div>
                  <InfoCard icon={<Mail size={18} />} label="Email" value={adminInfo.email} />
                  <EditItem icon={<MapPin size={18} />} label="Vị trí" value={editForm.location} onChange={(v : any) => setEditForm({...editForm, location: v})} />
                </>
              ) : (
                <>
                  <InfoCard icon={<User size={20} />} label="Họ và tên" value={adminInfo.name} />
                  <InfoCard icon={<Mail size={18} />} label="Email liên hệ" value={adminInfo.email} />
                  <InfoCard icon={<MapPin size={20} />} label="Vị trí làm việc" value={adminInfo.location} />
                  <InfoCard icon={<Calendar size={20} />} label="Ngày tham gia" value={adminInfo.joinDate} />
                </>
              )}
            </div>

            <div style={{ marginTop: '40px', padding: '30px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
               <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award size={20} color="#3b82f6" /> Giới thiệu
              </h3>
              <p style={{ color: '#64748b', lineHeight: 1.8, margin: 0, fontWeight: 500 }}>
                Quản trị viên cấp cao của hệ thống KhmerGo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon, label, value }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', borderRadius: '24px', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, margin: '0 0 2px 0', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 800, margin: 0, wordBreak: 'break-all' }}>{value}</p>
    </div>
  </div>
);

const EditItem = ({ icon, label, value, onChange }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', borderRadius: '20px', background: '#fff', border: '2.5px solid #3b82f6' }}>
    <div style={{ color: '#3b82f6' }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 800, margin: '0 0 4px 0', textTransform: 'uppercase' }}>{label}</p>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '1rem', color: '#1e293b', fontWeight: 800, padding: 0 }} />
    </div>
  </div>
);

const modernBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 20px',
  borderRadius: '14px',
  border: 'none',
  fontWeight: 800,
  fontSize: '0.875rem',
  cursor: 'pointer',
  transition: 'all 0.25s ease'
};

export default Profile;

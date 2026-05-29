import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Edit2, Search, Shield, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';

interface Destination {
  id: string;
  name: string;
  name_khmer?: string;
  location?: string;
  location_khmer?: string;
  description?: string;
  description_khmer?: string;
  imageUrl?: string;
  imageUrl1?: string;
  imageUrl2?: string;
  imageUrl3?: string;
  imageUrl4?: string;
  imageUrl5?: string;
  imageUrl6?: string;
  imageKey?: string;
  category?: string;
  rating?: number;
  latitude?: string;
  longitude?: string;
  rental?: string;
  favorite?: boolean;
  contentBlocks?: ContentBlock[];
}

interface ContentBlock {
  images?: string;
  value?: string;
  value_khmer?: string;
}

type TabKey = 'Chùa' | 'Văn hóa' | 'Ẩm thực';

const TABS: { key: TabKey; label: string; color: string; bg: string }[] = [
  { key: 'Chùa', label: 'Ngôi chùa Khmer', color: '#ffffffff', bg: 'var(--card-blue)' },
  { key: 'Văn hóa', label: 'Văn hóa Khmer', color: '#ffffffff', bg: 'var(--card-blue)' },
  { key: 'Ẩm thực', label: 'Ẩm thực Khmer', color: '#ffffffff', bg: 'var(--card-blue)' },
];

const InputField = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', textarea = false }: any) => {
  const commonStyles: any = {
    padding: Icon ? '1.125rem 1.25rem 1.125rem 3rem' : '1.125rem 1.25rem',
    fontSize: '0.9375rem',
    fontFamily: 'inherit',
    lineHeight: '1.85',
    width: '100%',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    border: '1px solid transparent',
    boxSizing: 'border-box',
  };

  return (
    <div className="input-group">
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: textarea ? '1rem' : '50%', transform: textarea ? 'none' : 'translateY(-50%)' }} />}
        {textarea ? (
          <div style={{ display: 'grid' }}>
            <div
              style={{
                ...commonStyles,
                gridArea: '1 / 1 / 2 / 2',
                visibility: 'hidden',
                minHeight: '80px',
              }}
            >
              {(value || '') + ' '}
            </div>
            <textarea
              rows={1}
              style={{
                ...commonStyles,
                gridArea: '1 / 1 / 2 / 2',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                outline: 'none',
                fontWeight: 600,
                resize: 'none',
                overflow: 'hidden',
                background: 'transparent',
              }}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
            />
          </div>
        ) : (
          <input
            type={type}
            style={{ width: '100%', padding: Icon ? '0.75rem 1rem 0.75rem 2.75rem' : '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        )}
      </div>
    </div>
  );
};

const Destinations = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('Chùa');
  const [editingItem, setEditingItem] = useState<Destination | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false, message: '', type: 'success'
  });
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false, title: '', message: '', onConfirm: () => { }
  });

  const [newItem, setNewItem] = useState<Partial<Destination>>({
    name: '', name_khmer: '',
    location: '', location_khmer: '',
    description: '', description_khmer: '',
    imageUrl: '', imageUrl1: '', imageUrl2: '', imageUrl3: '', imageUrl4: '', imageUrl5: '', imageUrl6: '', imageKey: '',
    latitude: '', longitude: '', rental: '',
    category: 'Chùa',
    favorite: false,
    contentBlocks: []
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 3000);
  };

  useEffect(() => {
    // Đảm bảo người dùng đã đăng nhập (vô danh) để có quyền ghi dữ liệu
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchDestinations();
      } else {
        signInAnonymously(auth).catch(err => console.error("Auth error:", err));
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'destinations'));
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Destination));
      setDestinations(docs);
    } catch (error) {
      console.error("Error fetching destinations:", error);
    }
    setLoading(false);
  };

  const validateDestination = (item: Partial<Destination>) => {
    if (!item.name?.trim()) return 'Vui lòng nhập đầy đủ trường thông tin';
    if (!item.name_khmer?.trim()) return 'Vui lòng nhập đầy đủ trường thông tin';
    if (!item.location?.trim()) return 'Vui lòng nhập đầy đủ trường thông tin';
    if (!item.location_khmer?.trim()) return 'Vui lòng nhập đầy đủ trường thông tin';
    if (!item.description?.trim()) return 'Vui lòng nhập đầy đủ trường thông tin';
    if (!item.description_khmer?.trim()) return 'Vui lòng nhập đầy đủ trường thông tin';
    if (!item.imageUrl?.trim()) return 'Vui lòng nhập đầy đủ trường thông tin';
    return null;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const error = validateDestination(editingItem);
    if (error) {
      showToast(error, 'error');
      return;
    }

    try {
      const { id, ...updateData } = editingItem;
      const docRef = doc(db, 'destinations', id);
      // Sử dụng setDoc với merge: true thay vì updateDoc để đảm bảo quyền hạn tốt hơn
      await setDoc(docRef, updateData, { merge: true });
      setDestinations(destinations.map(d => d.id === id ? editingItem : d));
      setEditingItem(null);
      showToast('Cập nhật nội dung thành công');
    } catch (error) {
      console.error("Error updating document:", error);
      if (error instanceof Error && error.message.includes('permissions')) {
        showToast('Lỗi: Thiếu quyền ghi dữ liệu (Kiểm tra Rules)', 'error');
      } else {
        showToast('Lỗi: Không thể cập nhật nội dung', 'error');
      }
    }
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateDestination(newItem);
    if (error) {
      showToast(error, 'error');
      return;
    }

    try {
      const itemToAdd = { ...newItem, category: activeTab };
      const docRef = await addDoc(collection(db, 'destinations'), itemToAdd);
      const createdItem = { id: docRef.id, ...itemToAdd } as Destination;
      setDestinations([createdItem, ...destinations]);
      setIsAddingNew(false);
      setNewItem({ name: '', location: '', description: '', imageUrl: '', category: activeTab });
      showToast('Thêm nội dung mới thành công');
    } catch (error) {
      console.error("Error adding document:", error);
      showToast('Lỗi: Không thể thêm nội dung mới', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa nội dung',
      message: 'Bạn có chắc chắn muốn xóa nội dung này\nThao tác này không thể hoàn tác',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'destinations', id));
          setDestinations(destinations.filter(d => d.id !== id));
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          showToast('Đã xóa nội dung thành công');
        } catch (error) {
          console.error("Error deleting document:", error);
          showToast('Lỗi: Không thể xóa nội dung', 'error');
        }
      }
    });
  };

  const handleAddContentBlock = () => {
    const defaultBlock = { images: '', value: '', value_khmer: '' };
    if (isAddingNew) {
      setNewItem({ ...newItem, contentBlocks: [...(newItem.contentBlocks || []), defaultBlock] });
    } else if (editingItem) {
      setEditingItem({ ...editingItem, contentBlocks: [...(editingItem.contentBlocks || []), defaultBlock] });
    }
  };

  const handleRemoveContentBlock = (index: number) => {
    if (isAddingNew) {
      setNewItem({ ...newItem, contentBlocks: newItem.contentBlocks?.filter((_, i) => i !== index) });
    } else if (editingItem) {
      setEditingItem({ ...editingItem, contentBlocks: editingItem.contentBlocks?.filter((_, i) => i !== index) });
    }
  };

  const handleUpdateContentBlock = (index: number, field: keyof ContentBlock, value: string) => {
    if (isAddingNew) {
      const blocks = [...(newItem.contentBlocks || [])];
      blocks[index] = { ...blocks[index], [field]: value };
      setNewItem({ ...newItem, contentBlocks: blocks });
    } else if (editingItem) {
      const blocks = [...(editingItem.contentBlocks || [])];
      blocks[index] = { ...blocks[index], [field]: value };
      setEditingItem({ ...editingItem, contentBlocks: blocks });
    }
  };

  const filteredDestinations = destinations
    .filter(d => d.category === activeTab)
    .filter(d =>
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const countByTab = (key: TabKey) => destinations.filter(d => d.category === key).length;

  const currentTabMeta = TABS.find(t => t.key === activeTab)!;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <AnimatePresence>
        {toast.isOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            style={{
              position: 'fixed',
              top: '2rem',
              right: '2rem',
              zIndex: 10000,
              padding: '1rem 1.5rem',
              background: toast.type === 'success' ? '#10b981' : '#ff5370',
              color: '#fff',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              fontWeight: 700,
              fontSize: '0.9375rem'
            }}
          >
            {toast.type === 'success' ? <CheckCircle size={20} /> : <Shield size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.025em' }}>Quản lý nội dung</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9375rem' }}>Quản lý nội dung chùa, văn hóa và ẩm thực Khmer</p>
        </div>
        <button
          onClick={() => { setIsAddingNew(true); setNewItem({ ...newItem, category: activeTab }); }}
          style={{ padding: '0.625rem 1.5rem', background: 'var(--sidebar-bg)', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          Thêm {currentTabMeta.label}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', background: '#fff', borderRadius: '16px', padding: '0.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count = countByTab(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.625rem',
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9375rem',
                transition: 'all 0.25s ease',
                background: isActive ? tab.bg : 'transparent',
                color: isActive ? tab.color : '#94a3b8',
                boxShadow: isActive ? `0 2px 8px ${tab.color}20` : 'none',
              }}
            >
              {tab.label}
              <span style={{
                padding: '0.125rem 0.625rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 800,
                background: isActive ? '#fff' : '#e2e8f0',
                color: isActive ? '#4099ff' : '#94a3b8',
                minWidth: '28px',
                textAlign: 'center',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '16px', padding: '0.75rem 1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #edf2f7' }}>
          <Search size={20} color="#94a3b8" />
          <input
            type="text"
            placeholder={`Tìm kiếm ${currentTabMeta.label.toLowerCase()}...`}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.9375rem', color: '#1e293b', fontWeight: 500, marginLeft: '0.75rem', background: 'transparent' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ height: 400, background: '#fff', borderRadius: '24px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ))}
        </div>
      ) : filteredDestinations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
          <div style={{ width: '80px', height: '80px', background: currentTabMeta.bg, borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Search size={32} color="#fff" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
            {searchTerm ? 'Không tìm thấy kết quả' : `Chưa có ${currentTabMeta.label.toLowerCase()} nào`}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9375rem' }}>
            {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm' : `Nhấn "Thêm ${currentTabMeta.label}" để bắt đầu`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <AnimatePresence mode="popLayout">
            {filteredDestinations.map(dest => (
              <motion.div
                key={dest.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                  <img
                    src={dest.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600'}
                    alt={dest.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                    <span style={{
                      padding: '0.35rem 0.875rem',
                      background: 'rgba(255,255,255,0.95)',
                      borderRadius: '20px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: '#000',
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}>
                      {currentTabMeta.label.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>{dest.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dest.location || 'Chưa cập nhật địa chỉ'}</span>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                    <button
                      onClick={() => setEditingItem(dest)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#1e293b', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      title="Chỉnh sửa thông tin"
                    >
                      <Edit2 size={16} /> Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleDelete(dest.id)}
                      style={{ padding: '0.625rem', borderRadius: '10px', border: 'none', background: '#fff5f5', color: '#ff5370', cursor: 'pointer', transition: 'all 0.2s' }}
                      title="Xóa nội dung"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {(editingItem || isAddingNew) && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => { setEditingItem(null); setIsAddingNew(false); }} />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              style={{ position: 'relative', width: '100%', maxWidth: '800px', background: '#fff', borderRadius: '28px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>
                  {isAddingNew ? `Thêm ${currentTabMeta.label}` : `Chỉnh sửa ${currentTabMeta.label}`}
                </h2>
              </div>

              <form onSubmit={isAddingNew ? handleAddNew : handleUpdate} style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', paddingRight: '0.5rem', display: 'grid', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <InputField label="Tên địa danh" value={isAddingNew ? newItem.name : editingItem?.name} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, name: v }) : setEditingItem({ ...editingItem!, name: v })} />
                    <InputField label="Tên (Khmer)" value={isAddingNew ? newItem.name_khmer : editingItem?.name_khmer} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, name_khmer: v }) : setEditingItem({ ...editingItem!, name_khmer: v })} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <InputField label={activeTab === 'Chùa' ? "Địa chỉ (Tiếng Việt)" : "Tiêu đề phụ (Tiếng Việt)"} value={isAddingNew ? newItem.location : editingItem?.location} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, location: v }) : setEditingItem({ ...editingItem!, location: v })} />
                    <InputField label={activeTab === 'Chùa' ? "Địa chỉ (Tiếng Khmer)" : "Tiêu đề phụ (Tiếng Khmer)"} value={isAddingNew ? newItem.location_khmer : editingItem?.location_khmer} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, location_khmer: v }) : setEditingItem({ ...editingItem!, location_khmer: v })} />
                  </div>

                  {activeTab === 'Chùa' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <InputField label="Vĩ độ" value={isAddingNew ? newItem.latitude : editingItem?.latitude} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, latitude: v }) : setEditingItem({ ...editingItem!, latitude: v })} />
                      <InputField label="Kinh độ" value={isAddingNew ? newItem.longitude : editingItem?.longitude} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, longitude: v }) : setEditingItem({ ...editingItem!, longitude: v })} />
                    </div>
                  )}

                  <div style={{ display: 'grid', gap: '1.25rem' }}>
                    <InputField label="Link ảnh chính" value={isAddingNew ? newItem.imageUrl : editingItem?.imageUrl} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, imageUrl: v }) : setEditingItem({ ...editingItem!, imageUrl: v })} />
                    <InputField label="Link ảnh phụ 1" value={isAddingNew ? newItem.imageUrl1 : editingItem?.imageUrl1} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, imageUrl1: v }) : setEditingItem({ ...editingItem!, imageUrl1: v })} />
                    {(activeTab === 'Văn hóa' || activeTab === 'Ẩm thực') && (
                      <>
                        <InputField label="Link ảnh phụ 2" value={isAddingNew ? newItem.imageUrl2 : editingItem?.imageUrl2} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, imageUrl2: v }) : setEditingItem({ ...editingItem!, imageUrl2: v })} />
                        <InputField label="Link ảnh phụ 3" value={isAddingNew ? newItem.imageUrl3 : editingItem?.imageUrl3} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, imageUrl3: v }) : setEditingItem({ ...editingItem!, imageUrl3: v })} />
                        <InputField label="Link ảnh phụ 4" value={isAddingNew ? newItem.imageUrl4 : editingItem?.imageUrl4} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, imageUrl4: v }) : setEditingItem({ ...editingItem!, imageUrl4: v })} />
                        <InputField label="Link ảnh phụ 5" value={isAddingNew ? newItem.imageUrl5 : editingItem?.imageUrl5} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, imageUrl5: v }) : setEditingItem({ ...editingItem!, imageUrl5: v })} />
                        <InputField label="Link ảnh phụ 6" value={isAddingNew ? newItem.imageUrl6 : editingItem?.imageUrl6} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, imageUrl6: v }) : setEditingItem({ ...editingItem!, imageUrl6: v })} />
                      </>
                    )}
                  </div>

                  <InputField label="Mô tả ngắn (Tiếng Việt)" textarea value={isAddingNew ? newItem.description : editingItem?.description} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, description: v }) : setEditingItem({ ...editingItem!, description: v })} />
                  <InputField label="Mô tả ngắn (Khmer)" textarea value={isAddingNew ? newItem.description_khmer : editingItem?.description_khmer} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, description_khmer: v }) : setEditingItem({ ...editingItem!, description_khmer: v })} />

                  <div style={{ borderTop: '2px dashed #f1f5f9', paddingTop: '0.75rem', marginTop: '0rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Các khối nội dung chi tiết</h3>
                      <button type="button" onClick={handleAddContentBlock} style={{ padding: '0.5rem 1rem', background: 'var(--card-blue)', color: '#fff', borderRadius: '10px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Thêm khối mới
                      </button>
                    </div>

                    <div style={{ display: 'grid', gap: '2rem' }}>
                      {(isAddingNew ? newItem.contentBlocks : editingItem?.contentBlocks)?.map((block, idx) => (
                        <div key={idx} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chi tiết khối {idx + 1}</span>
                            <button type="button" onClick={() => handleRemoveContentBlock(idx)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', borderRadius: '8px', background: '#fff', color: '#ff5370', border: '1px solid #fee2e2', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, transition: 'all 0.2s' }}>
                              <Trash2 size={14} /> Xóa khối
                            </button>
                          </div>
                          <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <InputField label={`Link ảnh khối ${idx + 1}`} value={block.images} onChange={(v: string) => handleUpdateContentBlock(idx, 'images', v)} />
                            <InputField label={`Mô tả khối ${idx + 1}`} textarea value={block.value} onChange={(v: string) => handleUpdateContentBlock(idx, 'value', v)} />
                            <InputField label={`Mô tả khối ${idx + 1} (Khmer)`} textarea value={block.value_khmer} onChange={(v: string) => handleUpdateContentBlock(idx, 'value_khmer', v)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0', paddingTop: '0' }}>
                  <button type="button" onClick={() => { setEditingItem(null); setIsAddingNew(false); }} style={{ flex: 1, padding: '0.875rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#ff0000ff', color: '#ffffffff', fontWeight: 700, cursor: 'pointer' }}>Hủy bỏ</button>
                  <button type="submit" style={{ flex: 1, padding: '0.875rem', borderRadius: '14px', border: 'none', background: 'var(--card-blue)', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(64, 153, 255, 0.2)' }}>
                    {isAddingNew ? 'Tạo mới ngay' : 'Cập nhật thay đổi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmConfig.isOpen && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1.5rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ position: 'relative', width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '32px', padding: '2.5rem', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
              <div style={{ width: '64px', height: '64px', background: '#fff7ed', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Shield size={32} color="#ffb64d" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#1e293b' }}>{confirmConfig.title}</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2.5rem', whiteSpace: 'pre-line' }}>{confirmConfig.message}</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} style={{ flex: 1, padding: '0.875rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'var(--card-blue)', color: '#ffffffff', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
                <button onClick={confirmConfig.onConfirm} style={{ flex: 1, padding: '0.875rem', borderRadius: '14px', border: 'none', background: '#ff5370', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255, 83, 112, 0.2)' }}>Đồng ý</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Destinations;

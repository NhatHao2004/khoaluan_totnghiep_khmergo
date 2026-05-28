import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit2, Image as ImageIcon, MapPin, Plus, Search, Shield, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../firebase/config';

interface Destination {
  id: string;
  name: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  rating?: number;
}

type TabKey = 'Chùa' | 'Văn hóa' | 'Ẩm thực';

const TABS: { key: TabKey; label: string; color: string; bg: string }[] = [
  { key: 'Chùa', label: 'Ngôi chùa Khmer', color: '#000000ff', bg: '#fffbeb' },
  { key: 'Văn hóa', label: 'Văn hóa Khmer', color: '#000000ff', bg: '#fffbeb' },
  { key: 'Ẩm thực', label: 'Ẩm thực Khmer', color: '#000000ff', bg: '#fffbeb' },
];

const Destinations = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('Chùa');
  const [editingItem, setEditingItem] = useState<Destination | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false, title: '', message: '', onConfirm: () => { }
  });

  const [newItem, setNewItem] = useState<Partial<Destination>>({
    name: '', location: '', description: '', imageUrl: '', category: 'Chùa'
  });

  useEffect(() => {
    fetchDestinations();
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const docRef = doc(db, 'destinations', editingItem.id);
      await updateDoc(docRef, { ...editingItem });
      setDestinations(destinations.map(d => d.id === editingItem.id ? editingItem : d));
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemToAdd = { ...newItem, category: activeTab };
      const docRef = await addDoc(collection(db, 'destinations'), itemToAdd);
      const createdItem = { id: docRef.id, ...itemToAdd } as Destination;
      setDestinations([createdItem, ...destinations]);
      setIsAddingNew(false);
      setNewItem({ name: '', location: '', description: '', imageUrl: '', category: activeTab });
    } catch (error) {
      console.error("Error adding document:", error);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa địa danh',
      message: 'Bạn có chắc chắn muốn xóa địa danh này?\nThao tác này không thể hoàn tác.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'destinations', id));
          setDestinations(destinations.filter(d => d.id !== id));
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error("Error deleting document:", error);
        }
      }
    });
  };

  // Lọc theo tab hiện tại + tìm kiếm
  const filteredDestinations = destinations
    .filter(d => d.category === activeTab)
    .filter(d =>
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Đếm số lượng từng loại
  const countByTab = (key: TabKey) => destinations.filter(d => d.category === key).length;

  const currentTabMeta = TABS.find(t => t.key === activeTab)!;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.025em' }}>Quản lý nội dung</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9375rem' }}>Quản lý chùa, văn hóa và ẩm thực Khmer</p>
        </div>
        <button
          onClick={() => { setIsAddingNew(true); setNewItem({ ...newItem, category: activeTab }); }}
          style={{ padding: '0.625rem 1.5rem', background: 'var(--sidebar-bg)', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          <Plus size={18} /> Thêm {currentTabMeta.label}
        </button>
      </div>

      {/* Tab Bar */}
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
                background: isActive ? tab.color : '#e2e8f0',
                color: isActive ? '#fff' : '#94a3b8',
                minWidth: '28px',
                textAlign: 'center',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
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

      {/* Card Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ height: 400, background: '#fff', borderRadius: '24px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ))}
        </div>
      ) : filteredDestinations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
          <div style={{ width: '80px', height: '80px', background: currentTabMeta.bg, borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
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
                {/* Image */}
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
                      color: currentTabMeta.color,
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}>
                      {currentTabMeta.label.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>{dest.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                    <MapPin size={14} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dest.location || 'Chưa cập nhật địa chỉ'}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {dest.description || 'Chưa có mô tả chi tiết.'}
                  </p>

                  {/* Actions */}
                  <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      onClick={() => setEditingItem(dest)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#1e293b', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      title="Chỉnh sửa thông tin"
                    >
                      <Edit2 size={16} /> Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(dest.id)}
                      style={{ padding: '0.625rem', borderRadius: '10px', border: 'none', background: '#fff5f5', color: '#ff5370', cursor: 'pointer', transition: 'all 0.2s' }}
                      title="Xóa địa danh"
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

      {/* Editor Modal */}
      <AnimatePresence>
        {(editingItem || isAddingNew) && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => { setEditingItem(null); setIsAddingNew(false); }} />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              style={{ position: 'relative', width: '100%', maxWidth: '600px', background: '#fff', borderRadius: '28px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>
                  {isAddingNew ? `Thêm ${currentTabMeta.label} mới` : `Chỉnh sửa ${currentTabMeta.label}`}
                </h2>
                <button onClick={() => { setEditingItem(null); setIsAddingNew(false); }} style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <form onSubmit={isAddingNew ? handleAddNew : handleUpdate} style={{ display: 'grid', gap: '1.25rem' }}>
                <div className="input-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Tên địa danh</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}
                    value={isAddingNew ? newItem.name : editingItem?.name}
                    onChange={(e) => isAddingNew ? setNewItem({ ...newItem, name: e.target.value }) : setEditingItem({ ...editingItem!, name: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Địa chỉ</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}
                      value={isAddingNew ? newItem.location : editingItem?.location}
                      onChange={(e) => isAddingNew ? setNewItem({ ...newItem, location: e.target.value }) : setEditingItem({ ...editingItem!, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Link ảnh tiêu đề</label>
                  <div style={{ position: 'relative' }}>
                    <ImageIcon size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}
                      value={isAddingNew ? newItem.imageUrl : editingItem?.imageUrl}
                      onChange={(e) => isAddingNew ? setNewItem({ ...newItem, imageUrl: e.target.value }) : setEditingItem({ ...editingItem!, imageUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Mô tả chi tiết</label>
                  <textarea
                    rows={4}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600, resize: 'none', lineHeight: 1.6 }}
                    value={isAddingNew ? newItem.description : editingItem?.description}
                    onChange={(e) => isAddingNew ? setNewItem({ ...newItem, description: e.target.value }) : setEditingItem({ ...editingItem!, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => { setEditingItem(null); setIsAddingNew(false); }} style={{ flex: 1, padding: '0.875rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>Hủy bỏ</button>
                  <button type="submit" style={{ flex: 1, padding: '0.875rem', borderRadius: '14px', border: 'none', background: currentTabMeta.color, color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 12px ${currentTabMeta.color}30` }}>
                    {isAddingNew ? 'Tạo mới ngay' : 'Cập nhật'}
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
                <button onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} style={{ flex: 1, padding: '0.875rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
                <button onClick={confirmConfig.onConfirm} style={{ flex: 1, padding: '0.875rem', borderRadius: '14px', border: 'none', background: '#ff5370', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255, 83, 112, 0.2)' }}>Đồng ý xóa</button>
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

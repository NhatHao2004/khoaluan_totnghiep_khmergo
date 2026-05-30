import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { AlignLeft, CheckCircle, Edit2, Image as ImageIcon, Info, MapPin, Shield, Trash2, X } from 'lucide-react';
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

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'Chùa', label: 'Ngôi chùa Khmer', icon: MapPin },
  { key: 'Văn hóa', label: 'Văn hóa Khmer', icon: Info },
  { key: 'Ẩm thực', label: 'Ẩm thực Khmer', icon: AlignLeft },
];

const InputField = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', textarea = false }: any) => {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={18} style={{ position: 'absolute', left: '1rem', top: textarea ? '1rem' : '50%', transform: textarea ? 'none' : 'translateY(-50%)', color: 'var(--text-muted)' }} />}
        {textarea ? (
          <textarea
            className="input-field"
            style={{ paddingLeft: Icon ? '3rem' : '1rem', minHeight: '100px', resize: 'vertical' }}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <input
            className="input-field"
            type={type}
            style={{ paddingLeft: Icon ? '3rem' : '1rem' }}
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
  const [viewingItem, setViewingItem] = useState<Destination | null>(null);
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
    const fields = ['name', 'name_khmer', 'location', 'location_khmer', 'description', 'description_khmer', 'imageUrl'];
    for (const f of fields) {
      if (!(item as any)[f]?.trim()) return `Trường "${f}" không được để trống`;
    }
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
      await setDoc(doc(db, 'destinations', id), updateData, { merge: true });
      setDestinations(destinations.map(d => d.id === id ? editingItem : d));
      setEditingItem(null);
      showToast('Cập nhật thành công');
    } catch (error) {
      console.error("Error updating:", error);
      showToast('Lỗi khi cập nhật dữ liệu', 'error');
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
      setDestinations([{ id: docRef.id, ...itemToAdd } as Destination, ...destinations]);
      setIsAddingNew(false);
      setNewItem({ name: '', location: '', description: '', imageUrl: '', category: activeTab });
      showToast('Đã thêm nội dung mới');
    } catch (error) {
      console.error("Error adding:", error);
      showToast('Lỗi khi thêm dữ liệu', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa nội dung',
      message: 'Bạn có chắc chắn muốn xóa vĩnh viễn nội dung này? Thao tác này không thể hoàn tác.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'destinations', id));
          setDestinations(destinations.filter(d => d.id !== id));
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          showToast('Đã xóa nội dung');
        } catch (error) {
          console.error("Error deleting:", error);
          showToast('Lỗi khi xóa dữ liệu', 'error');
        }
      }
    });
  };

  const handleAddContentBlock = () => {
    const block = { images: '', value: '', value_khmer: '' };
    if (isAddingNew) setNewItem({ ...newItem, contentBlocks: [...(newItem.contentBlocks || []), block] });
    else if (editingItem) setEditingItem({ ...editingItem, contentBlocks: [...(editingItem.contentBlocks || []), block] });
  };

  const handleRemoveContentBlock = (index: number) => {
    if (isAddingNew) setNewItem({ ...newItem, contentBlocks: newItem.contentBlocks?.filter((_, i) => i !== index) });
    else if (editingItem) setEditingItem({ ...editingItem, contentBlocks: editingItem.contentBlocks?.filter((_, i) => i !== index) });
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
    .filter(d => d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || d.location?.toLowerCase().includes(searchTerm.toLowerCase()));



  return (
    <div className="fade-in">
      <AnimatePresence>
        {toast.isOpen && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10000, padding: '1rem 1.5rem', background: toast.type === 'success' ? 'var(--success)' : 'var(--danger)', color: '#fff', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <Shield size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>Nội dung học tập</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Quản lý kho tàng di sản văn hóa</p>
        </div>
        <button onClick={() => { setIsAddingNew(true); setNewItem({ ...newItem, category: activeTab }); }} className="btn btn-primary">
          Thêm mới
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem', background: 'var(--bg-accent)', padding: '0.5rem', borderRadius: '14px' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, border: 'none', padding: '0.75rem', borderRadius: '10px', background: isActive ? 'white' : 'transparent', color: isActive ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: isActive ? 'var(--shadow-sm)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <input className="input-field" placeholder="Tìm kiếm nhanh..." style={{ paddingLeft: '1.25rem', height: '100%', borderRadius: '14px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {[1, 2, 3].map(i => <div key={i} className="card" style={{ height: 380, animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : filteredDestinations.length === 0 ? (
        <div className="card glass-card" style={{ textAlign: 'center', padding: '5rem' }}>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Chưa có nội dung nào</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Bắt đầu bằng cách thêm một mục mới vào tab này.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {filteredDestinations.map(dest => (
            <motion.div layout key={dest.id} className="card glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '220px', position: 'relative' }}>
                <img src={dest.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600'} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setEditingItem(dest)} style={{ border: 'none', background: 'white', padding: '10px', borderRadius: '10px', cursor: 'pointer', boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)' }}><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(dest.id)} style={{ border: 'none', background: '#fef2f2', padding: '10px', borderRadius: '10px', cursor: 'pointer', boxShadow: 'var(--shadow-md)', color: '#dc2626' }}><Trash2 size={16} /></button>
                </div>
              </div>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.3 }}>{dest.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {dest.location || 'Chưa có địa chỉ'}
                </p>
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }} onClick={() => setViewingItem(dest)}>Xem chi tiết</button>
                  <button className="btn" style={{ padding: '0.5rem', background: 'var(--bg-accent)', color: 'var(--text-primary)', borderRadius: '10px' }} onClick={() => setEditingItem(dest)} title="Chỉnh sửa"><Edit2 size={16} /></button>
                  <button className="btn" style={{ padding: '0.5rem', background: '#fef2f2', color: 'var(--danger)', borderRadius: '10px' }} onClick={() => setConfirmConfig({ isOpen: true, title: 'Xác nhận xóa', message: `Bạn có chắc chắn muốn xóa "${dest.name}"?`, onConfirm: () => handleDelete(dest.id) })} title="Xóa"><Trash2 size={16} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail View Modal */}
      <AnimatePresence>
        {viewingItem && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setViewingItem(null)} />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '800px', padding: 0, borderRadius: '32px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: '300px', flexShrink: 0 }}>
                <img src={viewingItem.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(15, 23, 42, 0.8))' }} />
                <button onClick={() => setViewingItem(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)', color: 'white', padding: '10px', borderRadius: '14px', cursor: 'pointer' }}><X size={20} /></button>
                
                <div style={{ position: 'absolute', bottom: '2rem', left: '2.5rem', right: '2.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ padding: '4px 12px', background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(4px)', borderRadius: '8px', color: 'white', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>{activeTab}</span>
                  </div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{viewingItem.name}</h2>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem', fontWeight: 500 }}>{viewingItem.name_khmer}</p>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }} className="custom-scrollbar">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Thông tin mô tả</h4>
                    <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>{viewingItem.description}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Mô tả (Khmer)</h4>
                    <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>{viewingItem.description_khmer}</p>
                  </div>
                </div>

                <div style={{ padding: '1.5rem', background: 'var(--bg-accent)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    <MapPin size={24} color="var(--primary)" />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Địa điểm & Vị trí</span>
                    <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{viewingItem.location}</p>
                  </div>
                </div>

                <div style={{ borderTop: '2px dashed var(--border-light)', paddingTop: '2.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2rem' }}>Nội dung chi tiết</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                    {viewingItem.contentBlocks?.map((block, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: idx % 2 === 0 ? '1fr 1.5fr' : '1.5fr 1fr', gap: '3rem', alignItems: 'center' }}>
                        {idx % 2 === 0 ? (
                          <>
                            <img src={block.images} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: '24px', boxShadow: 'var(--shadow-md)' }} />
                            <div>
                               <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '1rem' }}>{block.value}</p>
                               <div style={{ padding: '1.5rem', background: 'var(--bg-accent)', borderRadius: '20px', borderLeft: '4px solid var(--primary)' }}>
                                 <p style={{ fontSize: '1rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>{block.value_khmer || 'Nội dung chưa có bản dịch Khmer'}</p>
                               </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                               <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '1rem' }}>{block.value}</p>
                               <div style={{ padding: '1.5rem', background: 'var(--bg-accent)', borderRadius: '20px', borderRight: '4px solid var(--primary)' }}>
                                 <p style={{ fontSize: '1rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>{block.value_khmer || 'Nội dung chưa có bản dịch Khmer'}</p>
                               </div>
                            </div>
                            <img src={block.images} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: '24px', boxShadow: 'var(--shadow-md)' }} />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ padding: '1.5rem 2.5rem', background: 'var(--bg-accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>ID: {viewingItem.id}</span>
                <button onClick={() => { setEditingItem(viewingItem); setViewingItem(null); }} className="btn" style={{ padding: '0.75rem 1.5rem', background: 'var(--primary)', color: 'white', fontWeight: 700, borderRadius: '12px' }}>Chỉnh sửa thông tin</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Editor Modal */}
      <AnimatePresence>
        {(editingItem || isAddingNew) && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => { setEditingItem(null); setIsAddingNew(false); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '900px', padding: '3rem', borderRadius: '32px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{isAddingNew ? `Thêm ${activeTab}` : `Sửa ${activeTab}`}</h2>
                <button onClick={() => { setEditingItem(null); setIsAddingNew(false); }} style={{ border: 'none', background: 'var(--bg-accent)', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', display: 'grid', gap: '2rem' }} className="custom-scrollbar">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <InputField label="Tên (Tiếng Việt)" value={isAddingNew ? newItem.name : editingItem?.name} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, name: v }) : setEditingItem({ ...editingItem!, name: v })} icon={AlignLeft} />
                  <InputField label="Tên (Tiếng Khmer)" value={isAddingNew ? newItem.name_khmer : editingItem?.name_khmer} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, name_khmer: v }) : setEditingItem({ ...editingItem!, name_khmer: v })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <InputField label={activeTab === 'Chùa' ? "Địa chỉ" : "Mô tả phụ"} value={isAddingNew ? newItem.location : editingItem?.location} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, location: v }) : setEditingItem({ ...editingItem!, location: v })} icon={MapPin} />
                  <InputField label={activeTab === 'Chùa' ? "Địa chỉ (Khmer)" : "Mô tả phụ (Khmer)"} value={isAddingNew ? newItem.location_khmer : editingItem?.location_khmer} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, location_khmer: v }) : setEditingItem({ ...editingItem!, location_khmer: v })} icon={MapPin} />
                </div>

                <InputField label="Link ảnh nền chính" value={isAddingNew ? newItem.imageUrl : editingItem?.imageUrl} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, imageUrl: v }) : setEditingItem({ ...editingItem!, imageUrl: v })} icon={ImageIcon} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <InputField label="Mô tả tóm tắt" textarea value={isAddingNew ? newItem.description : editingItem?.description} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, description: v }) : setEditingItem({ ...editingItem!, description: v })} />
                  <InputField label="Mô tả tóm tắt (Khmer)" textarea value={isAddingNew ? newItem.description_khmer : editingItem?.description_khmer} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, description_khmer: v }) : setEditingItem({ ...editingItem!, description_khmer: v })} />
                </div>

                <div style={{ borderTop: '2px dashed var(--border-light)', paddingTop: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Các khối nội dung chi tiết</h3>
                    <button type="button" onClick={handleAddContentBlock} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>Thêm khối</button>
                  </div>

                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {(isAddingNew ? newItem.contentBlocks : editingItem?.contentBlocks)?.map((block, idx) => (
                      <div key={idx} className="card" style={{ background: 'var(--bg-main)', border: 'none', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase' }}>KHỐI NỘI DUNG #{idx + 1}</span>
                          <button type="button" onClick={() => handleRemoveContentBlock(idx)} style={{ border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}><Trash2 size={14} /> Xóa</button>
                        </div>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                          <InputField label="Link ảnh khối này" value={block.images} onChange={(v: string) => handleUpdateContentBlock(idx, 'images', v)} />
                          <InputField label="Chi tiết (Tiếng Việt)" textarea value={block.value} onChange={(v: string) => handleUpdateContentBlock(idx, 'value', v)} />
                          <InputField label="Chi tiết (Tiếng Khmer)" textarea value={block.value_khmer} onChange={(v: string) => handleUpdateContentBlock(idx, 'value_khmer', v)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                <button type="button" className="btn" style={{ flex: 1, padding: '1rem', background: 'var(--danger)', color: '#fff' }} onClick={() => { setEditingItem(null); setIsAddingNew(false); }}>Hủy bỏ</button>
                <button type="button" className="btn" style={{ flex: 2, padding: '1rem', background: '#3b82f6', color: '#fff' }} onClick={isAddingNew ? handleAddNew : handleUpdate}>Lưu nội dung</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmConfig.isOpen && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1.5rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center', borderRadius: '28px' }}>
              <div style={{ width: '64px', height: '64px', background: '#fef2f2', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Shield size={32} color="#dc2626" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>{confirmConfig.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2.5rem' }}>{confirmConfig.message}</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}>Đóng</button>
                <button className="btn" style={{ flex: 1, background: '#ef4444', color: 'white' }} onClick={confirmConfig.onConfirm}>Đồng ý xóa</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Destinations;

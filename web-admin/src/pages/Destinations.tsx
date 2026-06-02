import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { AlignLeft, CheckCircle, Edit2, Image as ImageIcon, Info, MapPin, Shield, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../firebase/config';

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
  createdAt?: any;
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

const getProxiedImageUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('googleusercontent.com') || url.includes('lh3.googleusercontent.com')) {
    // Loại bỏ đuôi -rw (WebP) để tránh lỗi một số trình duyệt và proxy
    const cleanUrl = url.replace(/-rw$/, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
  }
  return url;
};

const Destinations = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('Chùa');
  const [editingItem, setEditingItem] = useState<Destination | null>(null);
  const [viewingItem, setViewingItem] = useState<Destination | null>(null);
  const [viewLanguage, setViewLanguage] = useState<'vi' | 'km'>('vi');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false, message: '', type: 'success'
  });
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false, title: '', message: '', onConfirm: () => { }
  });
  const [isProcessing, setIsProcessing] = useState(false);

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

  const resetNewItem = (category: TabKey = activeTab) => {
    setNewItem({
      name: '', name_khmer: '',
      location: '', location_khmer: '',
      description: '', description_khmer: '',
      imageUrl: '', imageUrl1: '', imageUrl2: '', imageUrl3: '', imageUrl4: '', imageUrl5: '', imageUrl6: '', imageKey: '',
      latitude: '', longitude: '', rental: '',
      category: category,
      favorite: false,
      contentBlocks: []
    });
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    resetNewItem(tab);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 3000);
  };

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'destinations'), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Destination));
      // Sắp xếp: Thời gian tạo mới nhất lên đầu
      const sortedDocs = docs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setDestinations(sortedDocs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching destinations:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (editingItem || isAddingNew || viewingItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [editingItem, isAddingNew, viewingItem]);

  const validateDestination = (item: Partial<Destination>) => {
    const isChua = activeTab === 'Chùa';
    const fieldMapping: { [key: string]: string } = {
      name: 'Tên',
      name_khmer: 'Tên',
      location: isChua ? 'Địa chỉ' : 'Mô tả phụ',
      location_khmer: isChua ? 'Địa chỉ' : 'Mô tả phụ',
      description: 'Mô tả',
      description_khmer: 'Mô tả',
    };

    const fields = Object.keys(fieldMapping);
    for (const f of fields) {
      if (!(item as any)[f]?.trim()) {
        return `Trường "${fieldMapping[f]}" không được để trống`;
      }
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
      const itemToAdd = { ...newItem, category: activeTab, createdAt: serverTimestamp() };
      await addDoc(collection(db, 'destinations'), itemToAdd);
      setIsAddingNew(false);
      setNewItem({ name: '', location: '', description: '', imageUrl: '', category: activeTab });
      showToast('Đã thêm nội dung mới');
    } catch (error) {
      console.error("Error adding:", error);
      showToast('Lỗi khi thêm dữ liệu', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const itemToDelete = destinations.find(d => d.id === id);
    if (!itemToDelete) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Xóa nội dung',
      message: `Bạn chắc chắn xóa nội dung này?\nNội dung sẽ được chuyển vào thùng rác.`,
      onConfirm: async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
          // Lưu vào thùng rác trước khi xóa
          await addDoc(collection(db, 'trash'), {
            originalId: id,
            type: 'destinations',
            data: itemToDelete,
            deletedAt: serverTimestamp()
          });

          await deleteDoc(doc(db, 'destinations', id));
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          showToast('Đã chuyển vào thùng rác');
        } catch (error) {
          console.error("Error deleting:", error);
          showToast('Lỗi khi xóa dữ liệu', 'error');
        } finally {
          setIsProcessing(false);
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>Nội dung học tập</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="input-group" style={{ width: '300px', marginBottom: 0 }}>
            <div style={{ position: 'relative' }}>
              <input
                className="input-field"
                placeholder="Tìm kiếm nhanh..."
                style={{ paddingLeft: '1rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button
            className="btn"
            onClick={() => { setIsAddingNew(true); setNewItem({ ...newItem, category: activeTab }); }}
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            Thêm mới nội dung
          </button>
        </div>
      </div>

      <div style={{ height: '3px', background: 'black', width: '100%', borderRadius: '10px', marginBottom: '2.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} />

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem', background: 'var(--bg-accent)', padding: '0.5rem', borderRadius: '14px' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)} style={{ flex: 1, border: 'none', padding: '0.75rem', borderRadius: '10px', background: isActive ? 'white' : 'transparent', color: isActive ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: isActive ? 'var(--shadow-sm)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {[1, 2, 3].map(i => <div key={i} className="card" style={{ height: 380, animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : filteredDestinations.length === 0 ? (
        <div className="card glass-card" style={{ textAlign: 'center', padding: '5rem' }}>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Không tìm thấy kết quả</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Thử tìm kiếm với một từ khóa khác</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {filteredDestinations.map(dest => (
            <motion.div layout key={dest.id} className="card glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '220px', position: 'relative' }}>
                <img
                  src={getProxiedImageUrl(dest.imageUrl) || 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600'}
                  alt={dest.name}
                  referrerPolicy="no-referrer"
                  onError={(e: any) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600';
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

              </div>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.3 }}>{dest.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {dest.location || 'Chưa có địa chỉ'}
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }} onClick={() => { setViewingItem(dest); setViewLanguage('vi'); }}>Xem chi tiết</button>
                  <button className="btn" style={{ padding: '0.5rem 1rem', background: '#eff6ff', color: '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.75rem' }} onClick={() => setEditingItem(dest)}><Edit2 size={14} /> Sửa</button>
                  <button className="btn" style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: 'var(--danger)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.75rem' }} onClick={() => handleDelete(dest.id)}><Trash2 size={14} /> Xóa</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Full Page Detail View */}
      <AnimatePresence>
        {viewingItem && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 'var(--sidebar-width)',
              right: 0,
              bottom: 0,
              background: 'white',
              zIndex: 2000,
              overflowY: 'auto'
            }}
            className="custom-scrollbar"
          >
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative' }}>
              {/* Language Toggle - Fixed at top right of the detail area */}
              <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 3000, display: 'flex', gap: '4px' }}>
                <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '6px', borderRadius: '100px', border: '1px solid var(--border-light)', display: 'flex', gap: '4px', boxShadow: 'var(--shadow-lg)' }}>
                  {[
                    { id: 'vi', label: 'Tiếng Việt' },
                    { id: 'km', label: 'Tiếng Khmer' }
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setViewLanguage(lang.id as any)}
                      style={{
                        border: 'none',
                        background: viewLanguage === lang.id ? 'var(--primary)' : 'transparent',
                        color: viewLanguage === lang.id ? 'white' : 'var(--text-secondary)',
                        padding: '8px 16px',
                        borderRadius: '100px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hero Section - Single Column with Multi-column Descriptions */}
              <div style={{ marginBottom: '4rem', textAlign: 'center' }}>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                  <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.03em' }}>{viewingItem.name}</h1>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'serif' }}>{viewingItem.name_khmer}</h2>
                </div>

                <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.06)', marginBottom: '2.5rem', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
                  <img
                    src={getProxiedImageUrl(viewingItem.imageUrl)}
                    referrerPolicy="no-referrer"
                    onError={(e: any) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600';
                    }}
                    style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  {/* Location Info - Always in Vietnamese for administrative clarity */}
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', padding: '0.6rem 1.25rem', background: 'var(--bg-accent)', borderRadius: '100px', width: 'fit-content', margin: '0 auto 1.5rem' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {viewLanguage === 'vi' ? viewingItem.location : (viewingItem.location_khmer || viewingItem.location)}
                      </p>
                    </div>
                  </div>

                  {viewLanguage === 'vi' && (
                    <div style={{ padding: '1.5rem', background: 'var(--bg-accent)', borderRadius: '20px' }}>
                      <h4 style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.2rem', letterSpacing: '0.05em' }}>Bản tiếng Việt</h4>
                      <p style={{ fontSize: '0.925rem', lineHeight: 1.7, color: '#000', textAlign: 'justify' }}>{viewingItem.description}</p>
                    </div>
                  )}

                  {viewLanguage === 'km' && (
                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
                      <h4 style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.2rem', letterSpacing: '0.05em' }}>Bản tiếng Khmer</h4>
                      <p style={{ fontSize: '0.925rem', lineHeight: 1.9, color: '#000', fontStyle: 'italic' }}>{viewingItem.description_khmer}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Sections */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '3rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, textAlign: 'center', marginBottom: '3rem', letterSpacing: '-0.02em' }}>Khám phá chi tiết</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8rem' }}>
                  {viewingItem.contentBlocks?.map((block, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: isEven ? 'row' : 'row-reverse', gap: '5rem', alignItems: 'center' }}>
                        {/* Image Side */}
                        <div style={{ flex: 1.2 }}>
                          <img
                            src={getProxiedImageUrl(block.images)}
                            referrerPolicy="no-referrer"
                            onError={(e: any) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600';
                            }}
                            style={{ width: '100%', height: '420px', objectFit: 'cover', borderRadius: '32px', boxShadow: 'var(--shadow-lg)' }}
                          />
                        </div>

                        {/* Text Side */}
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          {viewLanguage === 'vi' && (
                            <div style={{ padding: '2rem', background: 'var(--bg-accent)', borderRadius: '24px' }}>
                              <h4 style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>Bản tiếng Việt</h4>
                              <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#000', textAlign: 'justify' }}>{block.value}</p>
                            </div>
                          )}
                          {viewLanguage === 'km' && (
                            <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
                              <h4 style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>Bản tiếng Khmer</h4>
                              <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#000', fontStyle: 'italic' }}>{block.value_khmer || 'Nội dung chưa có bản dịch Khmer'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <footer style={{ marginTop: '6rem', padding: '3rem 2rem', background: 'var(--bg-sidebar)', color: 'white', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button
                  onClick={() => setViewingItem(null)}
                  style={{ border: '1px solid rgba(0, 140, 255, 0.4)', background: 'rgba(30, 49, 255, 1)', color: '#ffffffff', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Quay lại danh sách
                </button>
                <button
                  onClick={() => { setEditingItem(viewingItem); setViewingItem(null); }}
                  style={{ border: 'none', background: 'white', color: 'var(--bg-sidebar)', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Chỉnh sửa nội dung
                </button>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Modal */}
      <AnimatePresence>
        {(editingItem || isAddingNew) && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => { setEditingItem(null); setIsAddingNew(false); resetNewItem(); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '900px', padding: '3rem', borderRadius: '32px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{isAddingNew ? `Thêm ${activeTab}` : `Sửa ${activeTab}`}</h2>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', display: 'grid', gap: '2rem' }} className="custom-scrollbar">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <InputField label="Tên (Tiếng Việt)" value={isAddingNew ? newItem.name : editingItem?.name} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, name: v }) : setEditingItem({ ...editingItem!, name: v })} icon={AlignLeft} />
                  <InputField label="Tên (Tiếng Khmer)" value={isAddingNew ? newItem.name_khmer : editingItem?.name_khmer} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, name_khmer: v }) : setEditingItem({ ...editingItem!, name_khmer: v })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <InputField label={activeTab === 'Chùa' ? "Địa chỉ (Tiếng Việt)" : "Mô tả phụ (Tiếng Việt)"} value={isAddingNew ? newItem.location : editingItem?.location} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, location: v }) : setEditingItem({ ...editingItem!, location: v })} />
                  <InputField label={activeTab === 'Chùa' ? "Địa chỉ (Tiếng Khmer)" : "Mô tả phụ (Tiếng Khmer)"} value={isAddingNew ? newItem.location_khmer : editingItem?.location_khmer} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, location_khmer: v }) : setEditingItem({ ...editingItem!, location_khmer: v })} />
                </div>

                <InputField label="Link ảnh nền chính" value={isAddingNew ? newItem.imageUrl : editingItem?.imageUrl} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, imageUrl: v }) : setEditingItem({ ...editingItem!, imageUrl: v })} icon={ImageIcon} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <InputField label="Mô tả tóm tắt (Tiếng Việt)" textarea value={isAddingNew ? newItem.description : editingItem?.description} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, description: v }) : setEditingItem({ ...editingItem!, description: v })} />
                  <InputField label="Mô tả tóm tắt (Tiếng Khmer)" textarea value={isAddingNew ? newItem.description_khmer : editingItem?.description_khmer} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, description_khmer: v }) : setEditingItem({ ...editingItem!, description_khmer: v })} />
                </div>

                <div style={{ borderTop: '2px dashed var(--border-light)', paddingTop: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Các khối nội dung chi tiết</h3>
                    <button type="button" onClick={handleAddContentBlock} className="btn" style={{ padding: '0.5rem 1.25rem', background: '#eff6ff', color: '#2563eb', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}>Thêm khối</button>
                  </div>

                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {(isAddingNew ? newItem.contentBlocks : editingItem?.contentBlocks)?.map((block, idx) => (
                      <div key={idx} className="card" style={{ background: 'var(--bg-main)', border: 'none', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase' }}>KHỐI NỘI DUNG {idx + 1}</span>
                          <button type="button" onClick={() => handleRemoveContentBlock(idx)} style={{ border: '1px solid #fee2e2', background: '#fef2f2', padding: '6px 12px', borderRadius: '10px', color: 'var(--danger)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', transition: 'all 0.2s' }}><Trash2 size={14} /> Xóa</button>
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
                <button type="button" className="btn" style={{ flex: 1, padding: '1rem', background: 'var(--danger)', color: '#fff' }} onClick={() => { setEditingItem(null); setIsAddingNew(false); resetNewItem(); }}>Hủy bỏ</button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '450px', padding: '2.5rem', textAlign: 'center', borderRadius: '28px' }}>
              <div style={{ width: '64px', height: '64px', background: '#fef2f2', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Shield size={32} color="#dc2626" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{confirmConfig.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2.5rem', whiteSpace: 'pre-line' }}>{confirmConfig.message}</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn" style={{ flex: 1, background: '#3b82f6', color: 'white', fontWeight: 700, borderRadius: '14px', opacity: isProcessing ? 0.7 : 1 }} onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} disabled={isProcessing}>Đóng</button>
                <button className="btn" style={{ flex: 1, background: '#ef4444', color: 'white', fontWeight: 700, borderRadius: '14px', opacity: isProcessing ? 0.7 : 1 }} onClick={confirmConfig.onConfirm} disabled={isProcessing}>{isProcessing ? 'Đang xóa...' : 'Xóa'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Destinations;

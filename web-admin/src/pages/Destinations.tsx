import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Destination {
  id: string;
  name: string;
  location?: string;
  description?: string;
  imageUrl?: string;
}

const Destinations = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Destination | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      await updateDoc(docRef, {
        name: editingItem.name,
        location: editingItem.location || '',
        description: editingItem.description || ''
      });
      setDestinations(destinations.map(d => d.id === editingItem.id ? editingItem : d));
      setEditingItem(null);
      // alert('Cập nhật thành công!');
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  const filteredDestinations = destinations.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Quản lý Địa danh</h1>
          <p style={{ color: 'var(--text-muted)' }}>Cập nhật thông tin các ngôi chùa và điểm tham quan.</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} /> Thêm mới
        </button>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Tìm kiếm tên chùa hoặc địa chỉ..." 
            style={{ width: '100%', paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>HÌNH ẢNH</th>
                <th>TÊN ĐỊA DANH</th>
                <th>ĐỊA CHỈ</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filteredDestinations.map(dest => (
                <tr key={dest.id}>
                  <td>
                    <img 
                      src={dest.imageUrl || 'https://via.placeholder.com/80'} 
                      alt={dest.name} 
                      style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', background: '#222' }} 
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{dest.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{dest.location}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn-ghost" onClick={() => setEditingItem(dest)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-ghost" style={{ color: 'var(--error)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {editingItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100 }}
              onClick={() => setEditingItem(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ 
                position: 'fixed', 
                top: '10%', 
                left: '50%', 
                translateX: '-50%', 
                width: '90%', 
                maxWidth: '600px', 
                zIndex: 101,
                background: 'var(--bg-card)',
                borderRadius: '24px',
                padding: '2rem',
                border: '1px solid var(--border)'
              }}
            >
              <h2 style={{ marginBottom: '1.5rem' }}>Chỉnh sửa thông tin</h2>
              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tên địa danh</label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }} 
                    value={editingItem.name} 
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Địa chỉ</label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }} 
                    value={editingItem.location} 
                    onChange={(e) => setEditingItem({...editingItem, location: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Mô tả</label>
                  <textarea 
                    rows={4} 
                    style={{ width: '100%', resize: 'vertical' }} 
                    value={editingItem.description} 
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setEditingItem(null)}>Hủy</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>Lưu thay đổi</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Destinations;

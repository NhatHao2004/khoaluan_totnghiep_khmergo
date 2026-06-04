import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Languages, Pencil, Shield, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase/config';

interface Word {
  id: string;
  khm: string;
  life: string; // Vietnamese meaning
  pronunciation: string; // Phonetic
  imageUrl?: string;
}

interface Category {
  id: string;
  title: string; // Tên Tiếng Việt
  titleKm?: string; // Tên Tiếng Khmer
  order?: number;
  imageUrl?: string; // Cover image URL
  words: Word[];
}

const InputField = ({ label, value, onChange, placeholder, type = 'text', textarea = false }: any) => (
  <div className="input-group" style={{ marginBottom: '1.25rem' }}>
    <label className="input-label" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>{label}</label>
    <div style={{ position: 'relative' }}>
      {textarea ? (
        <textarea
          className="input-field"
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', minHeight: '80px', resize: 'vertical' }}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="input-field"
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  </div>
);

const Vocabulary = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // New Word State
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);

  // New Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [newCategoryData, setNewCategoryData] = useState({ title: '', titleKm: '', order: 0, imageUrl: '' });

  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false, message: '', type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 3000);
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vocab_categories'), (snap) => {
      const cats = snap.docs.map(doc => {
        const data = doc.data();
        const rawWords = Array.isArray(data.words) ? data.words : [];
        const normalizedWords = rawWords.map((w: any) => ({
          id: w.id || `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          khm: w.khm || '',
          life: w.life || w.vie || '',
          pronunciation: w.pronunciation || w.pro || '',
          imageUrl: w.imageUrl || w.image || '',
        }));
        return {
          id: doc.id,
          title: data.title || '',
          titleKm: data.titleKm || '',
          order: data.order || 0,
          imageUrl: data.imageUrl || '',
          words: normalizedWords
        } as Category;
      });
      setCategories(cats.sort((a, b) => (a.order || 0) - (b.order || 0)));
      // Bỏ tự động chọn danh mục đầu tiên để hiện Grid trước
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const activeCategory = useMemo(() => {
    return categories.find(c => c.id === activeCategoryId) || null;
  }, [categories, activeCategoryId]);

  const formatCategoryName = (cat: Category) => {
    if (!cat) return '';
    const nameMap: { [key: string]: string } = {
      'cat_family': 'Gia đình thân yêu',
      'cat_food': 'Ẩm thực đặc sắc',
      'cat_greetings': 'Lời chào và giao tiếp',
      'cat_numbers': 'Số và cách đếm số',
      'family': 'Gia đình thân yêu',
      'food': 'Ẩm thực đặc sắc',
      'greetings': 'Lời chào và giao tiếp',
      'numbers': 'Số và cách đếm số'
    };
    const vnName = nameMap[cat.title] || nameMap[cat.id] || cat.title || cat.id;
    return vnName;
  };

  const handleSaveWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategory || isProcessing) return;

    // Lấy dữ liệu từ state
    const wordData = editingWord;
    if (!wordData || !wordData.khm || !wordData.life) {
      showToast('Vui lòng nhập đầy đủ từ Khmer và nghĩa tiếng Việt', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const categoryRef = doc(db, 'vocab_categories', activeCategory.id);
      let updatedWords;

      if (isAddingWord) {
        // Thêm mới
        updatedWords = [wordData, ...(activeCategory.words || [])];
      } else {
        // Cập nhật
        updatedWords = (activeCategory.words || []).map(w => w.id === wordData.id ? wordData : w);
      }

      await setDoc(categoryRef, { words: updatedWords }, { merge: true });
      showToast(isAddingWord ? 'Thêm từ vựng thành công' : 'Cập nhật từ vựng thành công');
      setIsAddingWord(false);
      setEditingWord(null);
    } catch (error: any) {
      console.error("Lỗi khi lưu từ vựng:", error);
      showToast('Lỗi khi lưu từ vựng', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !newCategoryData.title) return;

    setIsProcessing(true);
    try {
      const categoryId = newCategoryData.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
      const categoryRef = doc(db, 'vocab_categories', categoryId);

      await setDoc(categoryRef, {
        title: newCategoryData.title,
        titleKm: newCategoryData.titleKm || '',
        order: Number(newCategoryData.order) || 0,
        imageUrl: newCategoryData.imageUrl || '',
        words: []
      });

      showToast('Thêm danh mục mới thành công');
      setIsAddingCategory(false);
      setNewCategoryData({ title: '', titleKm: '', order: 0, imageUrl: '' });
    } catch (error: any) {
      console.error("Lỗi khi thêm danh mục:", error);
      showToast('Lỗi khi lưu từ vựng', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !editingCategory || !editingCategory.title) return;

    setIsProcessing(true);
    try {
      const categoryRef = doc(db, 'vocab_categories', editingCategory.id);
      await setDoc(categoryRef, {
        title: editingCategory.title,
        titleKm: editingCategory.titleKm || '',
        order: Number(editingCategory.order) || 0,
        imageUrl: editingCategory.imageUrl || ''
      }, { merge: true });

      showToast('Cập nhật danh mục thành công');
      setEditingCategory(null);
    } catch (error: any) {
      console.error("Lỗi khi cập nhật danh mục:", error);
      showToast('Lỗi khi lưu từ vựng', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory || isProcessing) return;
    setIsProcessing(true);
    try {
      // Backup to trash before deleting
      await addDoc(collection(db, 'trash'), {
        originalId: deletingCategory.id,
        type: 'vocab_categories',
        data: {
          title: deletingCategory.title || '',
          order: deletingCategory.order || 0,
          imageUrl: deletingCategory.imageUrl || '',
          words: deletingCategory.words || []
        },
        deletedAt: serverTimestamp()
      });

      await deleteDoc(doc(db, 'vocab_categories', deletingCategory.id));
      showToast('Đã chuyển danh mục vào thùng rác');
      setDeletingCategory(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      showToast('Lỗi khi xóa danh mục', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!activeCategory || isProcessing) return;
    const wordToDelete = activeCategory.words?.find(w => w.id === wordId);
    if (!wordToDelete) return;

    if (!window.confirm('Xóa từ vựng này? Nội dung sẽ được chuyển vào thùng rác.')) return;

    setIsProcessing(true);
    try {
      // Backup individual word to trash
      await addDoc(collection(db, 'trash'), {
        originalId: wordId,
        categoryId: activeCategory.id,
        categoryName: activeCategory.title,
        type: 'vocab_words',
        data: wordToDelete,
        deletedAt: serverTimestamp()
      });

      const categoryRef = doc(db, 'vocab_categories', activeCategory.id);
      const updatedWords = (activeCategory.words || []).filter(w => w.id !== wordId);
      await setDoc(categoryRef, { words: updatedWords }, { merge: true });

      showToast('Đã chuyển từ vựng vào thùng rác');
    } catch (error) {
      console.error("Error deleting word:", error);
      showToast('Lỗi khi xóa từ vựng', 'error');
    } finally {
      setIsProcessing(false);
    }
  };




  const filteredWords = (activeCategory?.words || []).filter(w =>
    (w.khm?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (w.life?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

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
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Quản lý từ vựng {activeCategoryId ? `(${formatCategoryName(activeCategory!)})` : ''}</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {!activeCategoryId && (
            <input
              className="input-field"
              placeholder="Tìm kiếm nhanh..."
              style={{ width: '250px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}

          {!activeCategoryId && (
            <button className="btn" onClick={() => setIsAddingCategory(true)} style={{ background: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700 }}>
              Thêm danh mục
            </button>
          )}
          {activeCategoryId && (
            <button className="btn" onClick={() => { setEditingWord({ id: `w_${Date.now()}`, khm: '', life: '', pronunciation: '', imageUrl: '' }); setIsAddingWord(true); }} style={{ background: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700 }}>
              Thêm từ mới
            </button>
          )}
        </div>
      </div>

      <div style={{ height: '3px', background: 'black', width: '100%', borderRadius: '10px', marginBottom: '2.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} />

      {!activeCategoryId ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }} className="fade-in">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '280px', borderRadius: '32px' }} />)
          ) : categories.filter(cat => formatCategoryName(cat).toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
            <div className="card glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Không tìm thấy kết quả</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Thử tìm kiếm với một từ khóa khác</p>
            </div>
          ) : (
            categories
              .filter(cat => formatCategoryName(cat).toLowerCase().includes(searchTerm.toLowerCase()))
              .map(cat => {


                return (
                  <div
                    key={cat.id}
                    style={{
                      padding: '1.5rem',
                      borderRadius: '28px',
                      background: 'white',
                      border: '1.5px solid #f1f5f9',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative'
                    }}
                    className="hover-scale"
                  >
                    {/* Category Cover Image (Using provided assets) */}
                    <div style={{
                      width: '100%',
                      height: '160px',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent'
                    }}>
                      <img
                        src={cat.imageUrl ? cat.imageUrl : `/${cat.title === 'cat_family' || cat.id === 'family' ? 'giadinh.jpg' :
                          cat.title === 'cat_food' || cat.id === 'food' ? 'monan.jpg' :
                            cat.title === 'cat_greetings' || cat.id === 'greetings' ? 'chaohoi.jpg' :
                              cat.title === 'cat_numbers' || cat.id === 'numbers' ? 'sodem.jpg' :
                                'giadinh.jpg' // mặc định
                          }`}
                        alt={formatCategoryName(cat)}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e: any) => {
                          // Fallback nếu không tìm thấy file
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1544391496-1ca7c9755716?q=80&w=300';
                        }}
                      />
                    </div>

                    <div>
                      <h3 style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '1.1rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                        {formatCategoryName(cat)}
                      </h3>

                      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => setActiveCategoryId(cat.id)}
                          style={{ padding: '0.75rem 1.25rem', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', flex: 1.5 }}
                          className="hover-bright"
                        >
                          Xem chi tiết
                        </button>
                        <button
                          onClick={() => setDeletingCategory(cat)}
                          style={{ padding: '0.75rem', background: '#fff1f2', color: '#e11d48', border: 'none', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', flex: 1 }}
                          className="hover-bright"
                        >
                          <Trash2 size={16} /> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setActiveCategoryId(null)}
              style={{ background: '#3b82f6', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              className="hover-bright"
            >
              Quay lại
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Danh mục {activeCategory?.title ? formatCategoryName(activeCategory) : ''}</h2>
          </div>

          {/* Word Table */}
          <div className="card glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '24px', border: '1px solid #e2e8f0', maxHeight: '433px' }}>
            <div style={{ flex: 1, overflowY: 'auto', borderRadius: '0 0 24px 24px' }} className="custom-scrollbar">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                  <tr>

                    <th style={{ textAlign: 'left', padding: '0.85rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Tiếng Khmer</th>
                    <th style={{ textAlign: 'left', padding: '0.85rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Phiên âm</th>
                    <th style={{ textAlign: 'left', padding: '0.85rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Tiếng Việt</th>
                    <th style={{ textAlign: 'right', padding: '0.85rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWords.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Languages size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>Không có dữ liệu từ vựng</p>
                      </td>
                    </tr>
                  ) : (
                    filteredWords.map((word) => (
                      <tr key={word.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-bright">
                        <td style={{ padding: '0.75rem 1.5rem', fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                          {word.khm}
                        </td>
                        <td style={{ padding: '0.75rem 1.5rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{word.pronunciation}</td>
                        <td style={{ padding: '0.75rem 1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{word.life}</td>
                        <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setEditingWord(word); setIsAddingWord(false); }} style={{ background: '#ebf3ff', color: '#3b82f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem' }} className="hover-bright" title="Sửa"><Pencil size={16} /> Sửa</button>
                            <button onClick={() => handleDeleteWord(word.id)} style={{ background: '#fef2f2', color: 'var(--danger)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem' }} className="hover-bright" title="Xóa"><Trash2 size={16} /> Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Word Modal */}
      <AnimatePresence>
        {(isAddingWord || editingWord) && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => { setIsAddingWord(false); setEditingWord(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '2.5rem', borderRadius: '32px', background: 'white', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>{isAddingWord ? 'Thêm từ vựng mới' : 'Cập nhật từ vựng'}</h2>
              <form onSubmit={handleSaveWord}>
                <InputField label="Từ Khmer" value={editingWord?.khm || ''} onChange={(v: string) => setEditingWord(prev => prev ? { ...prev, khm: v } : null)} placeholder="Ví dụ: សួស្តី" />
                <InputField label="Phiên âm" value={editingWord?.pronunciation || ''} onChange={(v: string) => setEditingWord(prev => prev ? { ...prev, pronunciation: v } : null)} placeholder="Ví dụ: Suostei" />
                <InputField label="Nghĩa Tiếng Việt" value={editingWord?.life || ''} onChange={(v: string) => setEditingWord(prev => prev ? { ...prev, life: v } : null)} placeholder="Ví dụ: Xin chào" />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                  <button type="button" className="btn" style={{ flex: 1, background: '#ef4444', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 600, padding: '0.875rem' }} onClick={() => { setIsAddingWord(false); setEditingWord(null); }}>Hủy</button>
                  <button type="submit" className="btn" style={{ flex: 2, background: '#3b82f6', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 700, padding: '0.875rem' }} disabled={isProcessing}>{isProcessing ? 'Đang lưu...' : 'Lưu từ vựng'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Category Modal */}
      <AnimatePresence>
        {isAddingCategory && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setIsAddingCategory(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '450px', padding: '2.5rem', borderRadius: '32px', background: 'white', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Thêm danh mục mới</h2>
              <form onSubmit={handleSaveCategory}>
                <InputField label="Tên danh mục (Tiếng Việt)" value={newCategoryData.title} onChange={(v: string) => setNewCategoryData(prev => ({ ...prev, title: v }))} placeholder="Ví dụ: Động vật..." />
                <InputField label="Tên danh mục (Tiếng Khmer)" value={newCategoryData.titleKm} onChange={(v: string) => setNewCategoryData(prev => ({ ...prev, titleKm: v }))} placeholder="Ví dụ: សត្វ..." />
                <InputField label="Link ảnh danh mục" value={newCategoryData.imageUrl} onChange={(v: string) => setNewCategoryData(prev => ({ ...prev, imageUrl: v }))} placeholder="Dán link ảnh tại đây..." />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                  <button type="button" className="btn" style={{ flex: 1, background: '#ef4444', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 600, padding: '0.875rem' }} onClick={() => setIsAddingCategory(false)}>Hủy</button>
                  <button type="submit" className="btn" style={{ flex: 2, background: '#3b82f6', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 700, padding: '0.875rem' }} disabled={isProcessing}>{isProcessing ? 'Đang lưu...' : 'Lưu danh mục'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Edit Category Modal */}
      <AnimatePresence>
        {editingCategory && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setEditingCategory(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '450px', padding: '2.5rem', borderRadius: '32px', background: 'white', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Cập nhật danh mục</h2>
              <form onSubmit={handleUpdateCategory}>
                <InputField label="Tên danh mục (Tiếng Việt)" value={editingCategory.title} onChange={(v: string) => setEditingCategory(prev => prev ? { ...prev, title: v } : null)} placeholder="Ví dụ: Động vật..." />
                <InputField label="Tên danh mục (Tiếng Khmer)" value={editingCategory.titleKm || ''} onChange={(v: string) => setEditingCategory(prev => prev ? { ...prev, titleKm: v } : null)} placeholder="Ví dụ: សត្វ..." />
                <InputField label="Thứ tự hiển thị" type="number" value={editingCategory.order || 0} onChange={(v: number) => setEditingCategory(prev => prev ? { ...prev, order: v } : null)} placeholder="Ví dụ: 5, 10..." />
                <InputField label="Link ảnh danh mục" value={editingCategory.imageUrl || ''} onChange={(v: string) => setEditingCategory(prev => prev ? { ...prev, imageUrl: v } : null)} placeholder="Dán link ảnh tại đây..." />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                  <button type="button" className="btn" style={{ flex: 1, background: '#ef4444', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 600, padding: '0.875rem' }} onClick={() => setEditingCategory(null)}>Hủy</button>
                  <button type="submit" className="btn" style={{ flex: 2, background: '#3b82f6', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 700, padding: '0.875rem' }} disabled={isProcessing}>{isProcessing ? 'Đang lưu...' : 'Lưu cập nhật'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingCategory && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setDeletingCategory(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '450px', padding: '2.5rem', textAlign: 'center', borderRadius: '28px', background: 'white', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
              <div style={{ width: '64px', height: '64px', background: '#fef2f2', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Shield size={32} color="#dc2626" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Xóa danh mục</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2.5rem', whiteSpace: 'pre-line' }}>
                {`Bạn chắc chắn muốn xóa danh mục này?\nTất cả từ vựng bên trong cũng sẽ bị ảnh hưởng.`}
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn" onClick={() => setDeletingCategory(null)} style={{ flex: 1, background: '#3b82f6', color: 'white', fontWeight: 700, borderRadius: '14px', padding: '0.875rem' }}>
                  Đóng
                </button>
                <button className="btn" onClick={handleDeleteCategory} style={{ flex: 1, background: '#ef6c6c', color: 'white', fontWeight: 700, borderRadius: '14px', padding: '0.875rem' }}>
                  {isProcessing ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Vocabulary;

import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { Book, CheckCircle, Languages, Shield, Trash2, Type, Volume2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase/config';

interface Word {
  id: string;
  khm: string;
  life: string; // Vietnamese meaning
  pronunciation: string; // Phonetic
}

interface Category {
  id: string;
  title: string; // Display name from Firestore
  order?: number;
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
        }));
        return {
          id: doc.id,
          title: data.title || '',
          order: data.order || 0,
          words: normalizedWords
        } as Category;
      });
      setCategories(cats.sort((a, b) => (a.order || 0) - (b.order || 0)));
      if (cats.length > 0 && !activeCategoryId) {
        setActiveCategoryId(cats[0].id);
      }
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
      'cat_family': 'Gia đình',
      'cat_food': 'Món ăn',
      'cat_greetings': 'Chào hỏi',
      'cat_numbers': 'Số đếm',
      'family': 'Gia đình',
      'food': 'Món ăn',
      'greetings': 'Chào hỏi',
      'numbers': 'Số đếm'
    };
    return nameMap[cat.title] || nameMap[cat.id] || cat.title || cat.id;
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
      showToast('Lỗi khi lưu dữ liệu', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!activeCategory || !window.confirm('Xóa từ vựng này?')) return;
    try {
      const categoryRef = doc(db, 'vocab_categories', activeCategory.id);
      const updatedWords = (activeCategory.words || []).filter(w => w.id !== wordId);
      await setDoc(categoryRef, { words: updatedWords }, { merge: true });
      showToast('Đã xóa từ vựng');
    } catch (error) {
      showToast('Lỗi khi xóa từ vựng', 'error');
    }
  };

  const filteredWords = (activeCategory?.words || []).filter(w =>
    (w.khm?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (w.life?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0.5rem 2rem 2rem 2rem' }}>
      <AnimatePresence>
        {toast.isOpen && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10000, padding: '1rem 1.5rem', background: toast.type === 'success' ? 'var(--success)' : 'var(--danger)', color: '#fff', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <Shield size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Quản lý từ vựng</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input className="input-field" placeholder="Tìm kiếm nhanh..." style={{ width: '300px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button className="btn" onClick={() => { setEditingWord({ id: `w_${Date.now()}`, khm: '', life: '', pronunciation: '' }); setIsAddingWord(true); }} style={{ background: 'rgb(59, 130, 246)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700 }}>
            Thêm từ mới
          </button>
        </div>
      </div>

      <div style={{ height: '3px', background: 'black', width: '100%', borderRadius: '100px', marginBottom: '2.5rem', boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px' }}></div>

      <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
        {/* Category List */}
        <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }} className="custom-scrollbar">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '60px', borderRadius: '16px' }} />)
          ) : (
            categories.map(cat => (
              <div
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '16px',
                  background: activeCategoryId === cat.id ? 'white' : 'transparent',
                  border: '1.5px solid',
                  borderColor: activeCategoryId === cat.id ? 'var(--primary)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  boxShadow: activeCategoryId === cat.id ? 'var(--shadow-md)' : 'none'
                }}
                className="hover-bright"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: activeCategoryId === cat.id ? '#eff6ff' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeCategoryId === cat.id ? 'var(--primary)' : 'var(--text-muted)' }}>
                    <Book size={20} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: activeCategoryId === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {formatCategoryName(cat)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Word Table */}
        <div className="card glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '24px', border: '1px solid #e2e8f0', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Từ Khmer</th>
                  <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Nghĩa Tiếng Việt</th>
                  <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Phát âm</th>
                  <th style={{ textAlign: 'right', padding: '1.25rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Thao tác</th>
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
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{word.khm}</td>
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{word.life}</td>
                      <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                        {word.pronunciation && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '4px 10px', borderRadius: '100px', width: 'fit-content', fontSize: '0.8rem' }}>
                            <Volume2 size={14} /> {word.pronunciation}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditingWord(word); setIsAddingWord(false); }} className="btn-icon" style={{ background: '#eff6ff', color: 'var(--primary)', border: 'none', cursor: 'pointer' }} title="Sửa"><Type size={16} /></button>
                          <button onClick={() => handleDeleteWord(word.id)} className="btn-icon" style={{ background: '#fef2f2', color: 'var(--danger)', border: 'none', cursor: 'pointer' }} title="Xóa"><Trash2 size={16} /></button>
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

      {/* Add/Edit Word Modal */}
      <AnimatePresence>
        {(isAddingWord || editingWord) && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => { setIsAddingWord(false); setEditingWord(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '2.5rem', borderRadius: '32px', background: 'white', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>{isAddingWord ? 'Thêm từ vựng mới' : 'Cập nhật từ vựng'}</h2>
              <form onSubmit={handleSaveWord}>
                <InputField label="Từ Khmer" value={editingWord?.khm || ''} onChange={(v: string) => setEditingWord(prev => prev ? { ...prev, khm: v } : null)} placeholder="Ví dụ: សួស្តី" />
                <InputField label="Nghĩa Tiếng Việt" value={editingWord?.life || ''} onChange={(v: string) => setEditingWord(prev => prev ? { ...prev, life: v } : null)} placeholder="Ví dụ: Xin chào" />
                <InputField label="Phát âm" value={editingWord?.pronunciation || ''} onChange={(v: string) => setEditingWord(prev => prev ? { ...prev, pronunciation: v } : null)} placeholder="Ví dụ: Suostei" />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                  <button type="button" className="btn" style={{ flex: 1, background: '#f1f5f9', color: '#64748b', borderRadius: '12px', border: 'none', fontWeight: 600, padding: '0.875rem' }} onClick={() => { setIsAddingWord(false); setEditingWord(null); }}>Hủy</button>
                  <button type="submit" className="btn" style={{ flex: 2, background: 'var(--primary)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 700, padding: '0.875rem' }} disabled={isProcessing}>{isProcessing ? 'Đang lưu...' : 'Lưu dữ liệu'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Vocabulary;

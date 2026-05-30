import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronDown, ChevronUp, Edit2, Search, Shield, Trash2, Plus, X, Award, Brain, Utensils } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Challenge {
  id: string;
  pagodaId: string;
  pagodaName: string;
  pagodaNameKm: string;
  imageUrl?: string;
  rental: string;
  color: string;
  accentColor: string;
  questions: Question[];
}

type TabKey = 'Chùa' | 'Văn hóa' | 'Ẩm thực';

const TABS: { key: TabKey; label: string; prefix: string; icon: any }[] = [
  { key: 'Chùa', label: 'Thử thách Chùa', prefix: 'pagoda_', icon: Brain },
  { key: 'Văn hóa', label: 'Thử thách Văn hóa', prefix: 'culture_', icon: Award },
  { key: 'Ẩm thực', label: 'Thử thách Ẩm thực', prefix: 'food_', icon: Utensils },
];

const InputField = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', textarea = false, disabled = false, list }: any) => {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={18} style={{ position: 'absolute', left: '1rem', top: textarea ? '1rem' : '50%', transform: textarea ? 'none' : 'translateY(-50%)', color: 'var(--text-muted)' }} />}
        {textarea ? (
          <textarea
            className="input-field"
            style={{ paddingLeft: Icon ? '3rem' : '1rem', minHeight: '80px', resize: 'vertical' }}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
        ) : (
          <input
            className="input-field"
            type={type}
            list={list}
            style={{ paddingLeft: Icon ? '3rem' : '1rem' }}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};

const Challenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey | 'Khác'>('Chùa');
  const [editingItem, setEditingItem] = useState<Challenge | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false, message: '', type: 'success'
  });
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false, title: '', message: '', onConfirm: () => { }
  });

  const [newItem, setNewItem] = useState<Partial<Challenge>>({
    pagodaId: '', pagodaName: '', pagodaNameKm: '', imageUrl: '', rental: '', color: '#6366f1', accentColor: '#e0e7ff',
    questions: [{ id: 'q1', question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' }]
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 3000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchChallenges();
      else signInAnonymously(auth).catch(err => console.error("Auth error:", err));
    });
    return () => unsubscribe();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const quizSnapshot = await getDocs(collection(db, 'quizzes'));
      const quizDocs = quizSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge)); 
      const destSnapshot = await getDocs(collection(db, 'destinations'));
      const destDocs = destSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDestinations(destDocs);
      setChallenges(quizDocs);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    }
    setLoading(false);
  };

  const validateChallenge = (item: Partial<Challenge>) => {
    if (!item.pagodaId?.trim() || !item.pagodaName?.trim()) return 'Vui lòng nhập đầy đủ thông tin định danh Thử thách';
    const qs = item.questions || [];
    if (qs.length === 0) return 'Vui lòng thêm ít nhất một câu hỏi';
    return null;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const error = validateChallenge(editingItem);
    if (error) { showToast(error, 'error'); return; }
    try {
      const { id, ...updateData } = editingItem;
      await setDoc(doc(db, 'quizzes', id), updateData, { merge: true });
      setChallenges(prev => prev.map(c => c.id === id ? editingItem : c));
      setEditingItem(null);
      showToast('Cập nhật Thử thách thành công');
    } catch (error) {
      console.error("Error updating:", error);
      showToast('Không thể cập nhật Thử thách', 'error');
    }
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateChallenge(newItem);
    if (error) { showToast(error, 'error'); return; }
    try {
      const docRef = doc(db, 'quizzes', newItem.pagodaId!);
      await setDoc(docRef, newItem);
      setChallenges([{ id: newItem.pagodaId!, ...newItem } as Challenge, ...challenges]);
      setIsAddingNew(false);
      showToast('Đã thêm Thử thách mới');
    } catch (error) {
      console.error("Error adding:", error);
      showToast('Không thể thêm Thử thách', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa Thử thách',
      message: 'Hành động này sẽ xóa vĩnh viễn bộ câu hỏi. Bạn có chắc chắn không?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'quizzes', id));
          setChallenges(challenges.filter(c => c.id !== id));
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          showToast('Đã xóa Thử thách');
        } catch (error) {
          showToast('Lỗi khi xóa Thử thách', 'error');
        }
      }
    });
  };

  const handleAddQuestion = () => {
    const qs = (isAddingNew ? newItem.questions : editingItem?.questions) || [];
    const newQ = { id: `q${qs.length + 1}`, question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' };
    if (isAddingNew) setNewItem({ ...newItem, questions: [...qs, newQ] });
    else if (editingItem) setEditingItem({ ...editingItem, questions: [...qs, newQ] });
    setExpandedQuestion(qs.length);
  };

  const handleRemoveQuestion = (index: number) => {
    if (isAddingNew) setNewItem({ ...newItem, questions: newItem.questions?.filter((_, i) => i !== index) });
    else if (editingItem) setEditingItem({ ...editingItem, questions: editingItem.questions?.filter((_, i) => i !== index) });
    if (expandedQuestion === index) setExpandedQuestion(null);
  };

  const filteredChallenges = challenges.filter(c => {
    const search = searchTerm.toLowerCase();
    const matches = c.pagodaName?.toLowerCase().includes(search) || c.id?.toLowerCase().includes(search);
    if (activeTab === 'Khác') return !TABS.some(t => c.id.startsWith(t.prefix)) && matches;
    return c.id.startsWith(TABS.find(t => t.key === activeTab)!.prefix) && matches;
  });

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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>Quản lý Thử thách</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Thiết kế các bộ câu hỏi tương tác cho người dùng.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setIsAddingNew(true); setExpandedQuestion(0); }}>
          <Plus size={20} /> Tạo thử thách
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem', background: 'var(--bg-accent)', padding: '0.5rem', borderRadius: '14px' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, border: 'none', padding: '0.75rem', borderRadius: '10px', background: isActive ? 'white' : 'transparent', color: isActive ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: isActive ? 'var(--shadow-sm)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <tab.icon size={18} /> {tab.label}
              </button>
            );
          })}
        </div>
        <div style={{ width: '320px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" placeholder="Tìm ID hoặc Tên thử thách..." style={{ paddingLeft: '3rem' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card glass-card skeleton" style={{ height: '300px' }} />
          ))
        ) : filteredChallenges.length === 0 ? (
          <div className="card glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Không tìm thấy thử thách nào khớp với tiêu chí tìm kiếm.</p>
          </div>
        ) : (
          filteredChallenges.map(item => (
            <motion.div layout key={item.id} className="card glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: '180px', background: 'var(--bg-accent)', position: 'relative' }}>
              <img src={item.imageUrl || 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=600'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', borderRadius: '10px', fontWeight: 800, fontSize: '0.7rem', color: 'var(--primary)' }}>{item.questions?.length} CÂU HỎI</div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem' }}>{item.pagodaName || 'Chưa đặt tên'}</h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={() => { setEditingItem(item); setExpandedQuestion(0); }}><Edit2 size={14} /> Sửa</button>
                <button className="btn" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '0.5rem' }} onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {(editingItem || isAddingNew) && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => { setEditingItem(null); setIsAddingNew(false); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '900px', padding: '3rem', borderRadius: '32px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{isAddingNew ? 'Thử thách mới' : 'Cập nhật Thử thách'}</h2>
                <button onClick={() => { setEditingItem(null); setIsAddingNew(false); }} className="btn btn-secondary" style={{ padding: '8px' }}><X size={20} /></button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }} className="custom-scrollbar">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <InputField label="ID Thử thách" value={isAddingNew ? newItem.pagodaId : editingItem?.pagodaId} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, pagodaId: v }) : setEditingItem({ ...editingItem!, pagodaId: v })} disabled={!isAddingNew} />
                  <InputField label="Tên Địa danh / Nội dung" value={isAddingNew ? newItem.pagodaName : editingItem?.pagodaName} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, pagodaName: v }) : setEditingItem({ ...editingItem!, pagodaName: v })} list="dest-list" />
                  <datalist id="dest-list">{destinations.map(d => <option key={d.id} value={d.name} />)}</datalist>
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Câu hỏi ({ (isAddingNew ? newItem.questions : editingItem?.questions)?.length })</h3>
                    <button type="button" className="btn btn-secondary" onClick={handleAddQuestion} style={{ fontSize: '0.8rem' }}><Plus size={16} /> Thêm câu</button>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {(isAddingNew ? newItem.questions : editingItem?.questions)?.map((q, idx) => (
                      <div key={idx} style={{ border: '1px solid var(--border-light)', borderRadius: '16px', background: expandedQuestion === idx ? 'var(--bg-accent)' : 'transparent' }}>
                        <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ width: '28px', height: '28px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{idx + 1}</span>
                            <span style={{ fontWeight: 700 }}>{q.question || `Câu hỏi #${idx + 1}`}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn" style={{ padding: '4px', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); handleRemoveQuestion(idx); }}><Trash2 size={16} /></button>
                            {expandedQuestion === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                        {expandedQuestion === idx && (
                          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'grid', gap: '1.5rem', background: 'white' }}>
                            <InputField label="Nội dung câu hỏi" textarea value={q.question} onChange={(v: string) => { const qs = [...(isAddingNew?newItem.questions!:editingItem!.questions)]; qs[idx].question=v; isAddingNew?setNewItem({...newItem, questions:qs}):setEditingItem({...editingItem!, questions:qs}) }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: q.correctIndex === oIdx ? 'var(--primary)' : 'var(--bg-accent)', color: q.correctIndex === oIdx ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, cursor: 'pointer' }} onClick={() => { const qs = [...(isAddingNew?newItem.questions!:editingItem!.questions)]; qs[idx].correctIndex=oIdx; isAddingNew?setNewItem({...newItem, questions:qs}):setEditingItem({...editingItem!, questions:qs}) }}>{String.fromCharCode(65+oIdx)}</div>
                                  <input className="input-field" value={opt} onChange={(e) => { const qs = [...(isAddingNew?newItem.questions!:editingItem!.questions)]; qs[idx].options[oIdx]=e.target.value; isAddingNew?setNewItem({...newItem, questions:qs}):setEditingItem({...editingItem!, questions:qs}) }} style={{ padding: '8px 12px' }} />
                                </div>
                              ))}
                            </div>
                            <InputField label="Giải thích đáp án" textarea value={q.explanation} onChange={(v: string) => { const qs = [...(isAddingNew?newItem.questions!:editingItem!.questions)]; qs[idx].explanation=v; isAddingNew?setNewItem({...newItem, questions:qs}):setEditingItem({...editingItem!, questions:qs}) }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setEditingItem(null); setIsAddingNew(false); }}>Hủy bỏ</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={isAddingNew ? handleAddNew : handleUpdate}>Lưu thay đổi</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmConfig.isOpen && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} />
             <div className="card" style={{ position: 'relative', width: '400px', textAlign: 'center', padding: '2.5rem', borderRadius: '28px' }}>
                <Shield size={48} color="var(--danger)" style={{ margin: '0 auto 1.5rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{confirmConfig.title}</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>{confirmConfig.message}</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}>Đóng</button>
                  <button className="btn" style={{ flex: 1, background: 'var(--danger)', color: 'white' }} onClick={confirmConfig.onConfirm}>Xóa</button>
                </div>
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Challenges;


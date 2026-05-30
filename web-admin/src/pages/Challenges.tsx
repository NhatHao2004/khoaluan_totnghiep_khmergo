import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Brain, CheckCircle, ChevronDown, ChevronUp, Shield, Trash2, Utensils } from 'lucide-react';
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

  const fetchChallengesData = async () => {
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchChallengesData();
      else signInAnonymously(auth).catch(err => console.error("Auth error:", err));
    });
    return () => unsubscribe();
  }, []);

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

  const handleOpenAddModal = () => {
    const currentTab = TABS.find(t => t.key === activeTab);
    const prefix = currentTab?.prefix || '';
    const countInTab = challenges.filter(c => c.id?.startsWith(prefix)).length;
    const nextId = `${prefix}${countInTab + 1}`;

    setNewItem({
      questions: [],
      pagodaId: nextId
    });
    setIsAddingNew(true);
    setExpandedQuestion(0);
  };

  const filteredChallenges = challenges.filter(c => {
    const search = searchTerm.toLowerCase();
    const matches = (c.pagodaName?.toLowerCase().includes(search) || c.id?.toLowerCase().includes(search));
    if (activeTab === 'Khác') return !TABS.some(t => c.id.startsWith(t.prefix)) && matches;
    const currentTab = TABS.find(t => t.key === activeTab);
    return (currentTab ? c.id.startsWith(currentTab.prefix) : true) && matches;
  });

  const normalizeStr = (s: string) => s?.trim().toLowerCase().replace(/\s+/g, ' ');

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
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Quản lý thử thách</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            className="input-field"
            placeholder="Tìm kiếm nhanh..."
            style={{ width: '300px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn" onClick={handleOpenAddModal} style={{ background: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700 }}>
            Thêm mới thử thách
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem', background: 'var(--bg-accent)', padding: '0.5rem', borderRadius: '14px' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, border: 'none', padding: '0.75rem', borderRadius: '10px', background: activeTab === tab.key ? 'white' : 'transparent', color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card glass-card skeleton" style={{ height: '300px' }} />
          ))
        ) : filteredChallenges.length === 0 ? (
          <div className="card glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Không tìm thấy kết quả</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Thử tìm kiếm với một từ khóa khác</p>
          </div>
        ) : (
          filteredChallenges.map(item => {
            const matchedDest = destinations.find(d => 
              (item.pagodaId && d.id === item.pagodaId) || 
              (d.id === item.id) ||
              (item.pagodaName && normalizeStr(d.name) === normalizeStr(item.pagodaName))
            );

            return (
              <motion.div layout key={item.id} className="card glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '220px', background: 'var(--bg-accent)', position: 'relative' }}>
                  <img 
                    src={item.imageUrl || matchedDest?.imageUrl || 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=600'} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    alt={item.pagodaName}
                  />
                  <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', borderRadius: '10px', fontWeight: 800, fontSize: '0.7rem', color: 'var(--primary)' }}>
                    {item.questions?.length} CÂU HỎI
                  </div>
                </div>
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {item.pagodaName || matchedDest?.name || 'Chưa đặt tên'}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {matchedDest?.location || matchedDest?.description || 'Chế độ thử thách tự do'}
                  </p>
                  <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }} onClick={() => { setEditingItem(item); setExpandedQuestion(0); }}>Chỉnh sửa câu hỏi</button>
                    <button className="btn" style={{ padding: '0.5rem', background: '#fef2f2', color: 'var(--danger)', borderRadius: '10px' }} onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {(editingItem || isAddingNew) && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => { setEditingItem(null); setIsAddingNew(false); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '900px', padding: '3rem', borderRadius: '32px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{isAddingNew ? 'Thử thách mới' : 'Cập nhật Thử thách'}</h2>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }} className="custom-scrollbar">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <InputField label="ID Thử thách" value={isAddingNew ? newItem.pagodaId : editingItem?.pagodaId} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, pagodaId: v }) : setEditingItem({ ...editingItem!, pagodaId: v })} disabled={!isAddingNew} />
                  <InputField
                    label={activeTab === 'Chùa' ? "Tên Ngôi chùa Khmer" : activeTab === 'Văn hóa' ? "Tên Văn hóa Khmer" : "Tên Ẩm thực Khmer"}
                    value={isAddingNew ? newItem.pagodaName : editingItem?.pagodaName}
                    onChange={(v: string) => {
                      const matched = destinations.find(d => d.name === v);
                      if (isAddingNew) setNewItem({ ...newItem, pagodaName: v, ...(matched ? { pagodaId: matched.id, imageUrl: matched.imageUrl } : {}) });
                      else setEditingItem({ ...editingItem!, pagodaName: v, ...(matched ? { pagodaId: matched.id, imageUrl: matched.imageUrl } : {}) });
                    }}
                    list="dest-list"
                  />
                  <datalist id="dest-list">{destinations.map(d => <option key={d.id} value={d.name} />)}</datalist>
                </div>
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Câu hỏi ({(isAddingNew ? newItem.questions : editingItem?.questions)?.length})</h3>
                    <button type="button" className="btn btn-secondary" onClick={handleAddQuestion}>Thêm câu hỏi</button>
                  </div>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {(isAddingNew ? newItem.questions : editingItem?.questions)?.map((q, idx) => (
                      <div key={idx} style={{ border: '1px solid var(--border-light)', borderRadius: '16px', background: expandedQuestion === idx ? 'var(--bg-accent)' : 'transparent' }}>
                        <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}>
                          <span>{q.question || `Câu hỏi ${idx + 1}`}</span>
                          <button className="btn" onClick={(e) => { e.stopPropagation(); handleRemoveQuestion(idx); }}><Trash2 size={16} /></button>
                        </div>
                        {expandedQuestion === idx && (
                          <div style={{ padding: '2rem', borderTop: '1px solid var(--border-light)', display: 'grid', gap: '2rem', background: 'white' }}>
                            <InputField label="Nội dung câu hỏi" textarea value={q.question} onChange={(v: string) => { const qs = [...(isAddingNew ? newItem.questions! : editingItem!.questions)]; qs[idx].question = v; isAddingNew ? setNewItem({ ...newItem, questions: qs }) : setEditingItem({ ...editingItem!, questions: qs }) }} />
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                  <div 
                                    style={{ 
                                      width: '36px', height: '36px', borderRadius: '12px', 
                                      background: q.correctIndex === oIdx ? 'var(--primary)' : 'var(--bg-accent)', 
                                      color: q.correctIndex === oIdx ? 'white' : 'var(--text-muted)', 
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                      fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                                      boxShadow: q.correctIndex === oIdx ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                                    }} 
                                    onClick={() => { const qs = [...(isAddingNew ? newItem.questions! : editingItem!.questions)]; qs[idx].correctIndex = oIdx; isAddingNew ? setNewItem({ ...newItem, questions: qs }) : setEditingItem({ ...editingItem!, questions: qs }) }}
                                  >
                                    {String.fromCharCode(65 + oIdx)}
                                  </div>
                                  <input 
                                    className="input-field" 
                                    value={opt} 
                                    placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}`}
                                    onChange={(e) => { const qs = [...(isAddingNew ? newItem.questions! : editingItem!.questions)]; qs[idx].options[oIdx] = e.target.value; isAddingNew ? setNewItem({ ...newItem, questions: qs }) : setEditingItem({ ...editingItem!, questions: qs }) }} 
                                    style={{ padding: '10px 15px' }} 
                                  />
                                </div>
                              ))}
                            </div>

                            <InputField label="Giải thích đáp án" textarea value={q.explanation} onChange={(v: string) => { const qs = [...(isAddingNew ? newItem.questions! : editingItem!.questions)]; qs[idx].explanation = v; isAddingNew ? setNewItem({ ...newItem, questions: qs }) : setEditingItem({ ...editingItem!, questions: qs }) }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                <button className="btn" style={{ flex: 1, background: 'var(--danger)', color: '#fff' }} onClick={() => { setEditingItem(null); setIsAddingNew(false); }}>Hủy bỏ</button>
                <button className="btn" style={{ flex: 2, background: '#3b82f6', color: '#fff' }} onClick={isAddingNew ? handleAddNew : handleUpdate}>Lưu thay đổi</button>
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
              <h3>{confirmConfig.title}</h3>
              <p>{confirmConfig.message}</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}>Đóng</button>
                <button className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={confirmConfig.onConfirm}>Xóa</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Challenges;

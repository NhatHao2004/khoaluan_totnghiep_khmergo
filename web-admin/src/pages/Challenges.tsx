import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Brain, Edit2, Shield, Trash2, Utensils } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../firebase/config';

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
  createdAt?: any;
}

type TabKey = 'Chùa' | 'Văn hóa' | 'Ẩm thực';

const TABS: { key: TabKey; label: string; prefix: string; icon: any }[] = [
  { key: 'Chùa', label: 'Ngôi chùa Khmer', prefix: 'pagoda_', icon: Brain },
  { key: 'Văn hóa', label: 'Văn hóa Khmer', prefix: 'culture_', icon: Award },
  { key: 'Ẩm thực', label: 'Ẩm thực khmer', prefix: 'food_', icon: Utensils },

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
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false, title: '', message: '', onConfirm: () => { }
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const [newItem, setNewItem] = useState<Partial<Challenge>>({
    pagodaId: '', pagodaName: '', pagodaNameKm: '', imageUrl: '', rental: '', color: '#6366f1', accentColor: '#e0e7ff',
    questions: [{ id: 'q1', question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' }]
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(`[TOAST] ${type}: ${message}`);
  };

  useEffect(() => {
    setLoading(true);
    // Real-time listener for quizzes
    const unsubQuizzes = onSnapshot(collection(db, 'quizzes'), (snap) => {
      const quizDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
      // Sắp xếp: Thời gian tạo mới nhất lên đầu (createdAt)
      const sortedDocs = quizDocs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setChallenges(sortedDocs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching challenges:", error);
      setLoading(false);
    });

    // Real-time listener for destinations
    const unsubDestinations = onSnapshot(collection(db, 'destinations'), (snap) => {
      const destDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDestinations(destDocs);
    });

    return () => {
      unsubQuizzes();
      unsubDestinations();
    };
  }, []);

  useEffect(() => {
    if (editingItem || isAddingNew) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [editingItem, isAddingNew]);

  const validateChallenge = (item: Partial<Challenge>) => {
    if (!item.pagodaId?.trim() || !item.pagodaName?.trim()) return 'Vui lòng nhập đầy đủ thông tin cho Thử thách';
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
      await setDoc(docRef, {
        ...newItem,
        createdAt: serverTimestamp()
      });
      setIsAddingNew(false);
      showToast('Đã thêm Thử thách mới');
    } catch (error) {
      console.error("Error adding:", error);
      showToast('Không thể thêm Thử thách', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const itemToDelete = challenges.find(c => c.id === id);
    if (!itemToDelete) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Xóa Thử thách',
      message: `Bạn chắc chắn xóa bộ câu hỏi này?\nNội dung sẽ được chuyển vào thùng rác.`,
      onConfirm: async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
          // Sao lưu vào thùng rác
          await addDoc(collection(db, 'trash'), {
            originalId: id,
            type: 'challenges',
            data: itemToDelete,
            deletedAt: serverTimestamp()
          });

          await deleteDoc(doc(db, 'quizzes', id));
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          showToast('Đã chuyển Thử thách vào thùng rác');
        } catch (error) {
          showToast('Lỗi khi xóa Thử thách', 'error');
        } finally {
          setIsProcessing(false);
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
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Quản lý Thử thách</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Theo dõi và thiết lập các bộ câu hỏi đố vui về văn hóa và địa danh</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="input-group" style={{ flex: '1', maxWidth: '400px', marginBottom: 0 }}>
            <input
              className="input-field"
              placeholder="Tìm kiếm thử thách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            Thêm mới thử thách
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-accent)', padding: '0.5rem', borderRadius: '14px', width: 'fit-content' }}>
          {TABS.map(tab => (
            <button 
              key={tab.key} 
              onClick={() => setActiveTab(tab.key)} 
              style={{ 
                border: 'none', 
                padding: '0.75rem 1.5rem', 
                borderRadius: '10px', 
                background: activeTab === tab.key ? 'white' : 'transparent', 
                color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)', 
                fontWeight: 700, 
                cursor: 'pointer', 
                transition: 'all 0.2s', 
                boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none', 
                whiteSpace: 'nowrap',
                fontSize: '0.875rem'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Địa danh / Chủ đề</th>
                <th className="mobile-hidden">Số câu hỏi</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '3rem' }}>Đang tải dữ liệu...</td>
                </tr>
              ) : filteredChallenges.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Không tìm thấy kết quả phù hợp</td>
                </tr>
              ) : (
                filteredChallenges.map(item => {
                  const matchedDest = destinations.find(d => 
                    (item.pagodaId && d.id === item.pagodaId) || 
                    (d.id === item.id) || 
                    (item.pagodaName && normalizeStr(d.name) === normalizeStr(item.pagodaName))
                  );
                  
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                          {item.pagodaName || matchedDest?.name || 'Thử thách tự do'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {item.id}</div>
                      </td>
                      <td className="mobile-hidden">
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.questions?.length || 0}</span>
                        <span style={{ marginLeft: '4px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>câu hỏi</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn" style={{ background: '#eff6ff', color: '#3b82f6', padding: '0.5rem' }} onClick={() => { setEditingItem(item); setExpandedQuestion(0); }}><Edit2 size={16} /></button>
                          <button className="btn" style={{ background: '#fef2f2', color: 'var(--danger)', padding: '0.5rem' }} onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {(editingItem || isAddingNew) && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => { setEditingItem(null); setIsAddingNew(false); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '900px', padding: '3rem', borderRadius: '32px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{isAddingNew ? 'Thử thách mới' : 'Cập nhật Thử thách'}</h2>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="custom-scrollbar">
                <style>{`
                  .editor-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
                  @media (min-width: 768px) { .editor-grid { grid-template-columns: 1fr 1fr; } }
                `}</style>
                <div className="editor-grid">
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
                    <button type="button" className="btn" onClick={handleAddQuestion} style={{ padding: '0.5rem 1.25rem', background: '#eff6ff', color: '#2563eb', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}>Thêm câu hỏi</button>
                  </div>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {(isAddingNew ? newItem.questions : editingItem?.questions)?.map((q, idx) => (
                      <div key={idx} style={{ border: '1px solid var(--border-light)', borderRadius: '16px', background: expandedQuestion === idx ? 'var(--bg-accent)' : 'transparent' }}>
                        <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}>
                          <span>{q.question || `Câu hỏi ${idx + 1}`}</span>
                          <button className="btn" style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: 'var(--danger)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); handleRemoveQuestion(idx); }}><Trash2 size={14} /> Xóa</button>
                        </div>
                        {expandedQuestion === idx && (
                          <div style={{ padding: '2rem', borderTop: '1px solid var(--border-light)', display: 'grid', gap: '2rem', background: 'white' }}>
                            <InputField label="Nội dung câu hỏi" textarea value={q.question} onChange={(v: string) => { const qs = [...(isAddingNew ? newItem.questions! : editingItem!.questions)]; qs[idx].question = v; isAddingNew ? setNewItem({ ...newItem, questions: qs }) : setEditingItem({ ...editingItem!, questions: qs }) }} />

                            <div className="editor-grid">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                  <div
                                    style={{
                                      width: '36px', height: '36px', borderRadius: '12px',
                                      background: q.correctIndex === oIdx ? 'var(--danger)' : 'var(--bg-accent)',
                                      color: q.correctIndex === oIdx ? 'white' : 'var(--text-muted)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                                      boxShadow: q.correctIndex === oIdx ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none'
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmConfig.isOpen && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1.5rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center', borderRadius: '32px' }}>
              <div style={{ width: '64px', height: '64px', background: '#fef2f2', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Shield size={32} color="var(--danger)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{confirmConfig.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem', whiteSpace: 'pre-line' }}>{confirmConfig.message}</p>
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

export default Challenges;

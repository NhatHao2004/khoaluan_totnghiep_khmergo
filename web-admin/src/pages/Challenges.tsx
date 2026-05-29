import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, CheckCircle, ChevronDown, ChevronUp, Edit2, Search, Shield, Trash2 } from 'lucide-react';
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

const TABS: { key: TabKey; label: string; prefix: string; color: string; bg: string }[] = [
  { key: 'Chùa', label: 'Thử thách Chùa', prefix: 'pagoda_', color: '#ffffffff', bg: '#4099ff' },
  { key: 'Văn hóa', label: 'Thử thách Văn hóa', prefix: 'culture_', color: '#ffffffff', bg: '#8B5CF6' },
  { key: 'Ẩm thực', label: 'Thử thách Ẩm thực', prefix: 'food_', color: '#ffffffff', bg: '#F59E0B' },
];

const InputField = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', textarea = false, disabled = false, list }: any) => {
  const commonStyles: any = {
    padding: Icon ? '1.125rem 1.25rem 1.125rem 3rem' : '1.125rem 1.25rem',
    fontSize: '0.9375rem',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    width: '100%',
    border: '1px solid transparent',
    boxSizing: 'border-box',
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <div className="input-group">
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: textarea ? '1rem' : '50%', transform: textarea ? 'none' : 'translateY(-50%)' }} />}
        {textarea ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            background: '#fff',
            boxSizing: 'border-box',
            minHeight: '0'
          }}>
            <textarea
              style={{
                width: '100%',
                padding: 0,
                margin: 0,
                border: 'none',
                outline: 'none',
                fontSize: '0.9375rem',
                fontFamily: 'inherit',
                lineHeight: '1.4',
                fontWeight: 600,
                color: '#1e293b',
                resize: 'none',
                overflow: 'hidden',
                background: 'transparent',
                height: 'auto',
                display: 'block',
                transform: 'translateY(2px)' // Đẩy chữ xuống thấp hơn một chút
              }}
              value={value || ''}
              onInput={(e: any) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              ref={(el) => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = el.scrollHeight + 'px';
                }
              }}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
            />
          </div>
        ) : (
          <input
            type={type}
            list={list}
            style={{ ...commonStyles, width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}
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
    pagodaId: '',
    pagodaName: '',
    pagodaNameKm: '',
    imageUrl: '',
    rental: '',
    color: '#0179e9ff',
    accentColor: '#e0f2fe',
    questions: [
      { id: 'q1', question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' }
    ]
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 3000);
  };

  useEffect(() => {
    // Đảm bảo người dùng đã đăng nhập (vô danh) để có quyền đọc/ghi dữ liệu
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Đã xác thực người dùng:", user.uid);
        fetchChallenges();
      } else {
        console.log("Đang thực hiện đăng nhập vô danh...");
        signInAnonymously(auth).catch(err => {
          console.error("Auth error details:", err);
          showToast('Lỗi xác thực người dùng', 'error');
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      // Tải thử thách
      const querySnapshot = await getDocs(collection(db, 'quizzes'));
      const quizDocs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          // Chuẩn hóa dữ liệu nếu là thực phẩm
          pagodaName: data.pagodaName || (data as any).foodName || '',
          pagodaNameKm: data.pagodaNameKm || (data as any).foodNamekh || '',
          pagodaId: data.pagodaId || (data as any).foodId || doc.id
        } as Challenge;
      });

      // Tải địa danh để lấy ảnh
      const destSnapshot = await getDocs(collection(db, 'destinations'));
      const destDocs = destSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDestinations(destDocs);

      // Tự động gán ảnh nếu bị thiếu dựa trên tên (Khớp nối thông minh)
      const updatedQuizzes = quizDocs.map(quiz => {
        const name = (quiz.pagodaName || (quiz as any).foodName || '').trim().toLowerCase();
        
        if (!quiz.imageUrl && name) {
          const match = destDocs.find((d: any) => (d.name || '').trim().toLowerCase() === name);
          if (match) return { ...quiz, imageUrl: (match as any).imageUrl };
        }
        return quiz;
      });

      setChallenges(updatedQuizzes);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      showToast('Lỗi khi tải dữ liệu', 'error');
    }
    setLoading(false);
  };

  const validateChallenge = (item: Partial<Challenge>) => {
    if (!item.pagodaId?.trim()) return 'Vui lòng nhập đầy đủ trường thông tin';
    if (!item.pagodaName?.trim()) return 'Vui lòng nhập đầy đủ trường thông tin';
    if (!item.pagodaNameKm?.trim()) return 'Vui lòng nhập đầy đủ trường thông tin';

    const questions = item.questions || [];
    if (questions.length === 0) return 'Vui lòng nhập đầy đủ trường thông tin';

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question?.trim()) return 'Vui lòng nhập đầy đủ trường thông tin';
      if (q.options.some(opt => !opt.trim())) return 'Vui lòng nhập đầy đủ trường thông tin';
      if (!q.explanation?.trim()) return 'Vui lòng nhập đầy đủ trường thông tin';
    }
    return null;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const error = validateChallenge(editingItem);
    if (error) {
      showToast(error, 'error');
      return;
    }

    console.log("Đang bắt đầu cập nhật item:", editingItem.id);
    try {
      const { id, ...updateData } = editingItem;
      const docRef = doc(db, 'quizzes', id);

      console.log("Gửi dữ liệu lên Firestore...");
      await setDoc(docRef, updateData, { merge: true });
      console.log("Cập nhật Firestore thành công!");

      setChallenges(prev => prev.map(c => c.id === id ? editingItem : c));

      // Đóng modal và reset trạng thái
      setEditingItem(null);
      setExpandedQuestion(0);
      showToast('Cập nhật thử thách thành công');
    } catch (error: any) {
      console.error("Lỗi chi tiết khi cập nhật:", error);
      showToast(`Lỗi: ${error.message || 'Không thể cập nhật'}`, 'error');
    }
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateChallenge(newItem);
    if (error) {
      showToast(error, 'error');
      return;
    }

    try {
      const docRef = doc(db, 'quizzes', newItem.pagodaId);
      await setDoc(docRef, newItem);
      const createdItem = { id: newItem.pagodaId, ...newItem } as Challenge;
      setChallenges([createdItem, ...challenges]);
      setIsAddingNew(false);
      setNewItem({
        pagodaId: '', pagodaName: '', pagodaNameKm: '', rental: '', color: '#0179e9ff', accentColor: '#e0f2fe',
        questions: [{ id: 'q1', question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' }]
      });
      showToast('Thêm thử thách mới thành công');
    } catch (error) {
      console.error("Error adding challenge:", error);
      showToast('Lỗi: Không thể thêm thử thách mới', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa thử thách',
      message: 'Bạn có chắc chắn muốn xóa bộ câu hỏi này\nThao tác này không thể hoàn tác',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'quizzes', id));
          setChallenges(challenges.filter(c => c.id !== id));
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          showToast('Đã xóa thử thách thành công');
        } catch (error) {
          console.error("Error deleting challenge:", error);
          showToast('Lỗi: Không thể xóa thử thách', 'error');
        }
      }
    });
  };

  const handleAddQuestion = () => {
    if (isAddingNew) {
      const qs = newItem.questions || [];
      const newId = `q${qs.length + 1}`;
      const defaultQuestion: Question = { id: newId, question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' };
      setNewItem({ ...newItem, questions: [...qs, defaultQuestion] });
      setExpandedQuestion(qs.length);
    } else if (editingItem) {
      const qs = editingItem.questions || [];
      const newId = `q${qs.length + 1}`;
      const defaultQuestion: Question = { id: newId, question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' };
      setEditingItem({ ...editingItem, questions: [...qs, defaultQuestion] });
      setExpandedQuestion(qs.length);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    if (isAddingNew) {
      setNewItem({ ...newItem, questions: newItem.questions?.filter((_, i) => i !== index) });
    } else if (editingItem) {
      setEditingItem({ ...editingItem, questions: editingItem.questions?.filter((_, i) => i !== index) });
    }
    if (expandedQuestion === index) setExpandedQuestion(null);
  };

  const handleUpdateQuestion = (index: number, field: keyof Question, value: any) => {
    if (isAddingNew) {
      const qs = [...(newItem.questions || [])];
      qs[index] = { ...qs[index], [field]: value };
      setNewItem({ ...newItem, questions: qs });
    } else if (editingItem) {
      const qs = [...(editingItem.questions || [])];
      qs[index] = { ...qs[index], [field]: value };
      setEditingItem({ ...editingItem, questions: qs });
    }
  };

  const handleUpdateOption = (qIdx: number, oIdx: number, value: string) => {
    if (isAddingNew) {
      const qs = [...(newItem.questions || [])];
      const opts = [...qs[qIdx].options];
      opts[oIdx] = value;
      qs[qIdx] = { ...qs[qIdx], options: opts };
      setNewItem({ ...newItem, questions: qs });
    } else if (editingItem) {
      const qs = [...(editingItem.questions || [])];
      const opts = [...qs[qIdx].options];
      opts[oIdx] = value;
      qs[qIdx] = { ...qs[qIdx], options: opts };
      setEditingItem({ ...editingItem, questions: qs });
    }
  };

  const filteredChallenges = challenges.filter(c => {
    const id = c.id || '';
    const matchesSearch = c.pagodaName?.toLowerCase().includes(searchTerm.toLowerCase()) || c.pagodaId?.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'Khác') return !TABS.some(t => id.startsWith(t.prefix)) && matchesSearch;
    const tab = TABS.find(t => t.key === activeTab);
    return id.startsWith(tab?.prefix || '') && matchesSearch;
  });

  const otherCount = challenges.filter(c => !TABS.some(t => c.id.startsWith(t.prefix))).length;

  const countByTab = (key: TabKey) => {
    const prefix = TABS.find(t => t.key === key)!.prefix;
    return challenges.filter(c => c.id.startsWith(prefix)).length;
  };



  return (
    <div style={{ paddingBottom: '2rem' }}>
      <AnimatePresence>
        {toast.isOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}
            style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 10000, padding: '1rem 1.5rem', background: toast.type === 'success' ? '#10b981' : '#ff5370', color: '#fff', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', fontWeight: 700 }}
          >
            {toast.type === 'success' ? <CheckCircle size={20} /> : <Shield size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.025em' }}>Quản lý Thử thách</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9375rem' }}>Quản lý bộ câu hỏi đố vui cho các thử thách</p>
        </div>
        <button
          onClick={() => {
            const currentTabPrefix = TABS.find(t => t.key === activeTab)?.prefix || 'other_';
            const tabChallenges = challenges.filter(c => c.id.startsWith(currentTabPrefix));
            const nextNum = tabChallenges.length + 1;
            const nextId = `${currentTabPrefix}${nextNum}`;

            setIsAddingNew(true);
            setNewItem({
              ...newItem,
              pagodaId: nextId,
              questions: [{ id: 'q1', question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' }]
            });
            setExpandedQuestion(0);
          }}
          style={{ padding: '0.625rem 1.5rem', background: 'var(--sidebar-bg)', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          Thêm Thử thách
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
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', padding: '0.875rem 1rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9375rem', transition: 'all 0.25s ease',
                background: isActive ? tab.bg : 'transparent', color: isActive ? tab.color : '#94a3b8',
              }}
            >
              {tab.label}
              <span style={{ padding: '0.125rem 0.625rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, background: isActive ? '#fff' : '#e2e8f0', color: isActive ? tab.bg : '#94a3b8', minWidth: '28px' }}>
                {count}
              </span>
            </button>
          );
        })}
        {otherCount > 0 && (
          <button
            onClick={() => setActiveTab('Khác')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', padding: '0.875rem 1rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9375rem', transition: 'all 0.25s ease',
              background: activeTab === 'Khác' ? '#64748b' : 'transparent', color: activeTab === 'Khác' ? '#fff' : '#94a3b8',
            }}
          >
            Khác
            <span style={{ padding: '0.125rem 0.625rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, background: activeTab === 'Khác' ? '#fff' : '#e2e8f0', color: activeTab === 'Khác' ? '#64748b' : '#94a3b8', minWidth: '28px' }}>
              {otherCount}
            </span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '16px', padding: '0.75rem 1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #edf2f7' }}>
          <Search size={20} color="#94a3b8" />
          <input
            type="text"
            placeholder={`Tìm kiếm thử thách...`}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.9375rem', color: '#1e293b', fontWeight: 500, marginLeft: '0.75rem', background: 'transparent' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 200, background: '#fff', borderRadius: '24px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
          <BookOpen size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontWeight: 700, color: '#1e293b' }}>Chưa có thử thách nào</h3>
          <p style={{ color: '#94a3b8' }}>Nhấn nút "Thêm Thử thách" để tạo bộ câu hỏi đầu tiên</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {filteredChallenges.map(item => (
            <motion.div
              key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                <img
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600'}
                  alt={item.pagodaName || (item as any).foodName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b', flex: 1, marginRight: '1rem' }}>
                    {item.pagodaName || (item as any).foodName || 'Chưa đặt tên'}
                  </h3>
                  <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{item.questions?.length || 0} câu hỏi</div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                  <button
                    onClick={() => { setEditingItem(item); setExpandedQuestion(0); }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#1e293b', fontWeight: 700, cursor: 'pointer' }}
                    title="Chỉnh sửa thử thách"
                  >
                    <Edit2 size={16} /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{ padding: '0.625rem', borderRadius: '10px', border: 'none', background: '#fff5f5', color: '#ff5370', cursor: 'pointer' }}
                    title="Xóa bộ thử thách"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(editingItem || isAddingNew) && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => { setEditingItem(null); setIsAddingNew(false); }} />
            <motion.div
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              style={{ position: 'relative', width: '100%', maxWidth: '900px', background: '#fff', borderRadius: '28px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>
                  {isAddingNew ? 'Tạo Thử thách mới' : 'Chỉnh sửa Thử thách'}
                </h2>
              </div>

              <form onSubmit={isAddingNew ? handleAddNew : handleUpdate} style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '20px' }}>
                  <InputField label="ID Thử thách" value={isAddingNew ? newItem.pagodaId : editingItem?.pagodaId} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, pagodaId: v }) : setEditingItem({ ...editingItem!, pagodaId: v })} disabled={!isAddingNew} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <InputField
                        label="Tên Địa danh (Tiếng Việt)"
                        list="destinations-list"
                        value={isAddingNew ? newItem.pagodaName : editingItem?.pagodaName}
                        onChange={(v: string) => {
                          const match = destinations.find(d => d.name === v);
                          if (isAddingNew) {
                            setNewItem({
                              ...newItem,
                              pagodaName: v,
                              pagodaNameKm: match?.name_khmer || newItem.pagodaNameKm,
                              imageUrl: match?.imageUrl || newItem.imageUrl
                            });
                          } else {
                            setEditingItem({
                              ...editingItem!,
                              pagodaName: v,
                              pagodaNameKm: match?.name_khmer || editingItem?.pagodaNameKm,
                              imageUrl: match?.imageUrl || editingItem?.imageUrl
                            });
                          }
                        }}
                      />
                      <datalist id="destinations-list">
                        {destinations.map((d, i) => (
                          <option key={i} value={d.name} />
                        ))}
                      </datalist>
                    </div>
                    <InputField label="Tên ngôi chùa (tiếng Khmer)" value={isAddingNew ? newItem.pagodaNameKm : editingItem?.pagodaNameKm} onChange={(v: string) => isAddingNew ? setNewItem({ ...newItem, pagodaNameKm: v }) : setEditingItem({ ...editingItem!, pagodaNameKm: v })} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b' }}>Danh sách câu hỏi ({(isAddingNew ? newItem.questions : editingItem?.questions)?.length || 0})</h3>
                    <button type="button" onClick={handleAddQuestion} style={{ padding: '0.5rem 1rem', background: '#10b981', color: '#fff', borderRadius: '10px', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Thêm câu hỏi
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {(isAddingNew ? newItem.questions : editingItem?.questions)?.map((q, idx) => {
                      const isExpanded = expandedQuestion === idx;
                      return (
                        <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                          <div
                            style={{ padding: '1rem 1.5rem', background: isExpanded ? '#f8fafc' : '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <span style={{ width: '24px', height: '24px', background: 'var(--sidebar-bg)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{idx + 1}</span>
                              <span style={{ fontWeight: 700, color: '#1e293b' }}>{q.question || `Câu hỏi ${idx + 1} (Chưa nhập nội dung)`}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveQuestion(idx); }} style={{ color: '#ff5370', border: 'none', background: 'transparent', cursor: 'pointer' }}><Trash2 size={16} /></button>
                              <div
                                onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem', borderRadius: '8px', transition: 'background 0.2s' }}
                                title={isExpanded ? "Thu gọn" : "Mở rộng"}
                                className="hover-bg-gray"
                              >
                                {isExpanded ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                                <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'grid', gap: '1.5rem' }}>
                                  <InputField label="Nội dung câu hỏi" textarea value={q.question} onChange={(v: string) => handleUpdateQuestion(idx, 'question', v)} />

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                          width: '32px', height: '32px', borderRadius: '8px', background: q.correctIndex === oIdx ? '#10b981' : '#f1f5f9',
                                          color: q.correctIndex === oIdx ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, cursor: 'pointer'
                                        }} onClick={() => handleUpdateQuestion(idx, 'correctIndex', oIdx)}>
                                          {String.fromCharCode(65 + oIdx)}
                                        </div>
                                        <input
                                          type="text" value={opt} onChange={(e) => handleUpdateOption(idx, oIdx, e.target.value)}
                                          placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}`}
                                          style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.875rem' }}
                                        />
                                      </div>
                                    ))}
                                  </div>

                                  <InputField label="Giải thích đáp án" textarea value={q.explanation} onChange={(v: string) => handleUpdateQuestion(idx, 'explanation', v)} />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingBottom: '1rem' }}>
                  <button type="button" onClick={() => { setEditingItem(null); setIsAddingNew(false); }} style={{ flex: 1, padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ff0000ff', color: '#ffffffff', fontWeight: 700, cursor: 'pointer' }}>Hủy bỏ</button>
                  <button type="submit" style={{ flex: 1, padding: '1rem', borderRadius: '16px', border: 'none', background: 'var(--card-blue)', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(64, 153, 255, 0.2)' }}>
                    {isAddingNew ? 'Lưu thử thách mới' : 'Cập nhật thay đổi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmConfig.isOpen && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1.5rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ position: 'relative', width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '32px', padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', background: '#fff5f5', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Trash2 size={32} color="#ff5370" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{confirmConfig.title}</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2.5rem' }}>{confirmConfig.message}</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} style={{ flex: 1, padding: '0.875rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: 700 }}>Hủy</button>
                <button onClick={confirmConfig.onConfirm} style={{ flex: 1, padding: '0.875rem', borderRadius: '14px', border: 'none', background: '#ff5370', color: '#fff', fontWeight: 700 }}>Xác nhận xóa</button>
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

export default Challenges;

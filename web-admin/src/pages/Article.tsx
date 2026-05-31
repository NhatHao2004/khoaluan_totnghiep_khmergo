import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, Filter, Plus, Search, Shield, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../firebase/config';

const Article = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    postId: string;
  }>({ isOpen: false, postId: '' });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'posts'), (snap) => {
      const postData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPosts(postData);
    });

    return () => unsubscribe();
  }, []);

  const handleDeletePost = async () => {
    if (!confirmDialog.postId) return;
    try {
      await deleteDoc(doc(db, 'posts', confirmDialog.postId));
      setConfirmDialog({ isOpen: false, postId: '' });
    } catch (error) {
      console.error("Error deleting post:", error);
      alert('Có lỗi xảy ra khi xóa bài viết.');
      setConfirmDialog({ isOpen: false, postId: '' });
    }
  };

  const filteredPosts = posts.filter(post =>
    (post.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (ts: any) => {
    if (!ts) return 'Chưa rõ';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Quản lý Bài viết</h1>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.5rem', borderRadius: '16px' }}>
          <Plus size={20} strokeWidth={2.5} />
          <span>Tạo bài viết mới</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem', borderRadius: '24px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết theo tiêu đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.875rem 1.25rem 0.875rem 3.25rem', borderRadius: '14px', border: '1px solid var(--border-light)', background: 'var(--bg-main)', fontSize: '0.925rem' }}
          />
        </div>
        <button className="btn" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '0.875rem 1.25rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <Filter size={18} />
          <span style={{ fontWeight: 600 }}>Bộ lọc</span>
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ borderRadius: '24px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nội dung bài viết</th>
              <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Người đăng</th>
              <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thời gian</th>
              <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái</th>
              <th style={{ textAlign: 'right', padding: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  Không tìm thấy bài viết nào.
                </td>
              </tr>
            ) : (
              filteredPosts.map((post) => (
                <tr key={post.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1.25rem' }}>
                    <div style={{ maxWidth: '450px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1rem' }}>
                        {post.content || 'Không có nội dung'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {post.location || 'Bản tin Cộng đồng'}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {post.user || 'Ẩn danh'}
                  </td>
                  <td style={{ padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {formatTime(post.createdAt)}
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: 700 }}>Công khai</span>
                  </td>
                  <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button 
                        title="Xem chi tiết"
                        style={{ 
                          border: 'none', 
                          background: '#eff6ff', 
                          color: '#3b82f6', 
                          cursor: 'pointer', 
                          padding: '8px', 
                          borderRadius: '12px',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          transition: 'opacity 0.2s' 
                        }}
                      >
                        <Eye size={18} strokeWidth={2.5} />
                      </button>
                      <button
                        title="Xóa bài viết"
                        style={{ 
                          border: 'none', 
                          background: '#fee2e2', 
                          color: '#ef4444', 
                          cursor: 'pointer', 
                          padding: '8px', 
                          borderRadius: '12px',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          transition: 'opacity 0.2s' 
                        }}
                        onClick={() => setConfirmDialog({ isOpen: true, postId: post.id })}
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1.5rem' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
              onClick={() => setConfirmDialog({ isOpen: false, postId: '' })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="card"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem',
                textAlign: 'center',
                borderRadius: '32px'
              }}
            >
              <div style={{ width: '60px', height: '60px', background: '#fee2e2', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Shield size={28} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Xác nhận xóa bài viết</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.</p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn"
                  style={{ flex: 1, background: 'var(--bg-accent)', color: 'var(--text-primary)', fontWeight: 600, borderRadius: '14px' }}
                  onClick={() => setConfirmDialog({ isOpen: false, postId: '' })}
                >
                  Hủy bỏ
                </button>
                <button
                  className="btn"
                  style={{ flex: 1, background: '#ef4444', color: 'white', fontWeight: 600, borderRadius: '14px' }}
                  onClick={handleDeletePost}
                >
                  Xác nhận xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Article;

import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Eye, Image as ImageIcon, Shield, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../firebase/config';

const getProxiedImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.includes('googleusercontent.com') || url.includes('lh3.googleusercontent.com')) {
    const cleanUrl = url.replace(/-rw$/, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
  }
  return url;
};

const Article = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    postId: string;
  }>({ isOpen: false, postId: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false, message: '', type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 3000);
  };

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

  useEffect(() => {
    if (!selectedPost) {
      setComments([]);
      return;
    }

    // Lắng nghe bình luận của bài viết được chọn (giả định sub-collection 'comments')
    const unsubComments = onSnapshot(collection(db, 'posts', selectedPost.id, 'comments'), (snap) => {
      const commentData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setComments(commentData);
    });

    return () => unsubComments();
  }, [selectedPost]);

  const handleDeletePost = async () => {
    if (!confirmDialog.postId || isProcessing) return;
    setIsProcessing(true);
    const itemToDelete = posts.find(p => p.id === confirmDialog.postId);
    if (!itemToDelete) { setIsProcessing(false); return; }

    try {
      // Sao lưu vào thùng rác
      await addDoc(collection(db, 'trash'), {
        originalId: confirmDialog.postId,
        type: 'posts',
        data: itemToDelete,
        deletedAt: serverTimestamp()
      });

      await deleteDoc(doc(db, 'posts', confirmDialog.postId));
      setConfirmDialog({ isOpen: false, postId: '' });
      showToast('Đã chuyển bài viết vào thùng rác');
    } catch (error) {
      console.error("Error deleting post:", error);
      showToast('Lỗi khi xóa dữ liệu', 'error');
      setConfirmDialog({ isOpen: false, postId: '' });
    } finally {
      setIsProcessing(false);
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
    <div className="fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Quản lý bài viết</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Theo dõi và quản lý các bài đăng từ cộng đồng người dùng</p>

        <div className="input-group" style={{ maxWidth: '400px', marginBottom: 0 }}>
          <input
            className="input-field"
            type="text"
            placeholder="Tìm kiếm nội dung bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Chưa có bài viết nào</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Bài viết từ người dùng sẽ hiển thị tại đây</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="mobile-hidden" style={{ width: '80px' }}>Ảnh</th>
                  <th>Nội dung</th>
                  <th>Người đăng</th>
                  <th className="mobile-hidden">Thời gian</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                      Không tìm thấy bài viết phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr key={post.id}>
                      <td className="mobile-hidden">
                        {post.image ? (
                          <img
                            src={getProxiedImageUrl(post.image)}
                            alt="post"
                            style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--bg-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <ImageIcon size={18} />
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ maxWidth: '400px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {post.content || 'Không có nội dung'}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {post.user || 'Ẩn danh'}
                      </td>
                      <td className="mobile-hidden" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {formatTime(post.createdAt)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            className="btn"
                            style={{ background: '#eff6ff', color: '#3b82f6', padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                            onClick={() => setSelectedPost(post)}
                          >
                            <Eye size={16} /> <span className="mobile-hidden">Xem</span>
                          </button>
                          <button
                            className="btn"
                            style={{ background: '#fef2f2', color: 'var(--danger)', padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                            onClick={() => setConfirmDialog({ isOpen: true, postId: post.id })}
                          >
                            <Trash2 size={16} /> <span className="mobile-hidden">Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                padding: '2.5rem 2rem',
                textAlign: 'center',
                borderRadius: '32px'
              }}
            >
              <div style={{ width: '64px', height: '64px', background: '#fef2f2', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Shield size={32} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Xác nhận xóa bài viết</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '2.5rem', whiteSpace: 'pre-line' }}>Bạn chắc chắn xóa bài viết này?{"\n"}Nội dung sẽ được chuyển vào thùng rác.</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="btn"
                  style={{ flex: 1, background: '#3b82f6', color: 'white', fontWeight: 700, borderRadius: '14px', opacity: isProcessing ? 0.7 : 1 }}
                  onClick={() => setConfirmDialog({ isOpen: false, postId: '' })}
                  disabled={isProcessing}
                >
                  Đóng
                </button>
                <button
                  className="btn"
                  style={{ flex: 1, background: '#ef4444', color: 'white', fontWeight: 700, borderRadius: '14px', opacity: isProcessing ? 0.7 : 1 }}
                  onClick={handleDeletePost}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Post Details Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
              onClick={() => setSelectedPost(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="card"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '0',
                borderRadius: '32px',
                display: 'flex',
                flexDirection: 'column',
                scrollbarWidth: 'none', /* Firefox */
                msOverflowStyle: 'none' /* IE and Edge */
              }}
            >
              {/* CSS to hide webkit scrollbar */}
              <style>{`
                .card::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {/* Header: Content on Left, Close on Right */}
              <div style={{ padding: '2rem 2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'white', position: 'sticky', top: 0, zIndex: 20 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0, flex: 1, paddingRight: '1rem' }}>
                  {selectedPost.content || 'Chi tiết bài viết'}
                </h2>
                <button
                  onClick={() => setSelectedPost(null)}
                  style={{ border: 'none', background: 'var(--bg-accent)', color: 'var(--danger)', padding: '8px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0 }}
                >
                  <X size={22} />
                </button>
              </div>

              {/* Image Section below Title */}
              {selectedPost.image && (
                <div style={{ width: '100%', background: 'white', position: 'relative', padding: '0 2rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={getProxiedImageUrl(selectedPost.image)}
                    alt="post content"
                    referrerPolicy="no-referrer"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      borderRadius: '20px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
                    }}
                  />
                </div>
              )}

              <div style={{ padding: '0 2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {selectedPost.userAvatar ? (
                        <img src={selectedPost.userAvatar || 'https://i.pravatar.cc/150?u=default'} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>{selectedPost.user?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{selectedPost.user || 'Ẩn danh'}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{formatTime(selectedPost.createdAt)}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>{selectedPost.likes || 0}</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Thích</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>{selectedPost.comments?.length || selectedPost.comments || 0}</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Bình luận</span>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div style={{ background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '24px', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Bình luận ({comments.length})
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {comments.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1rem 0', opacity: 0.6 }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Chưa có bình luận nào cho bài viết này</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {comments
                          .filter(c => !c.parentId && !c.replyTo) // Lấy bình luận gốc
                          .map((rootComment) => (
                            <div key={rootComment.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {/* Bình luận gốc */}
                              <div style={{ display: 'flex', gap: '0.875rem' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-light)' }}>
                                  {(rootComment.userAvatar || rootComment.userImage || rootComment.avatar || rootComment.photoURL) ? (
                                    <img src={rootComment.userAvatar || rootComment.userImage || rootComment.avatar || rootComment.photoURL || 'https://i.pravatar.cc/150?u=comment'} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    (rootComment.userId === selectedPost.userId || rootComment.userName === selectedPost.user) && selectedPost.userAvatar ? (
                                      <img src={selectedPost.userAvatar || 'https://i.pravatar.cc/150?u=default'} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--primary)' }}>{rootComment.userName?.charAt(0) || rootComment.user?.charAt(0) || '?'}</span>
                                    )
                                  )}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>{rootComment.userName || rootComment.user || 'Người dùng'}</h4>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatTime(rootComment.createdAt)}</span>
                                  </div>
                                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rootComment.text || rootComment.content}</p>
                                </div>
                              </div>

                              {/* Danh sách phản hồi (Replies) */}
                              {comments
                                .filter(reply => reply.parentId === rootComment.id || reply.replyTo === rootComment.id)
                                .map((reply) => (
                                  <div key={reply.id} style={{ display: 'flex', gap: '0.875rem', marginLeft: '2.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-light)' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-light)' }}>
                                      {(reply.userAvatar || reply.userImage || reply.avatar || reply.photoURL) ? (
                                        <img src={reply.userAvatar || reply.userImage || reply.avatar || reply.photoURL || 'https://i.pravatar.cc/150?u=reply'} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        (reply.userId === selectedPost.userId || reply.userName === selectedPost.user) && selectedPost.userAvatar ? (
                                          <img src={selectedPost.userAvatar || 'https://i.pravatar.cc/150?u=default'} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)' }}>{reply.userName?.charAt(0) || reply.user?.charAt(0) || '?'}</span>
                                        )
                                      )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.125rem' }}>
                                        <h4 style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{reply.userName || reply.user || 'Người dùng'}</h4>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatTime(reply.createdAt)}</span>
                                      </div>
                                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{reply.text || reply.content}</p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast.isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              zIndex: 10000,
              padding: '1rem 1.5rem',
              background: toast.type === 'success' ? '#10b981' : '#ef4444',
              color: '#fff',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            {toast.type === 'success' ? <CheckCircle size={20} /> : <Shield size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Article;

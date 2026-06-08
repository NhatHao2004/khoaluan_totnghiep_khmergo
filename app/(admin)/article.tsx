import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../utils/firebaseConfig';

const { width } = Dimensions.get('window');

const ArticleManagement = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete Confirm State
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any>(null);

  // Comments Management State
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    setLoading(true);
    const qPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
      setLoading(false);
    });

    return () => unsubPosts();
  }, []);

  // Comments listener
  useEffect(() => {
    if (selectedPost && commentModalVisible) {
      setLoadingComments(true);
      const q = query(collection(db, `posts/${selectedPost.id}/comments`), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComments(data);
        setLoadingComments(false);
      }, (err) => {
        console.error("Error fetching comments: ", err);
        setLoadingComments(false);
      });
      return () => unsub();
    }
  }, [selectedPost, commentModalVisible]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message: msg, type });
    Animated.spring(translateY, {
      toValue: 40,
      useNativeDriver: true,
      friction: 8,
    }).start();

    setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToast({ ...toast, visible: false }));
    }, 3000);
  };

  const handleDeletePost = (post: any) => {
    setPendingDelete(post);
    setDeleteConfirmVisible(true);
  };

  const [commentDeleteConfirmVisible, setCommentDeleteConfirmVisible] = useState(false);
  const [pendingCommentDelete, setPendingCommentDelete] = useState<string | null>(null);

  const handleDeleteComment = (commentId: string) => {
    setPendingCommentDelete(commentId);
    setCommentDeleteConfirmVisible(true);
  };

  const confirmDeleteComment = async () => {
    if (!selectedPost || !pendingCommentDelete) return;
    try {
      await deleteDoc(doc(db, `posts/${selectedPost.id}/comments`, pendingCommentDelete));
      setCommentDeleteConfirmVisible(false);
      setPendingCommentDelete(null);
      showToast('Đã xóa bình luận');
    } catch (e) {
      showToast('Lỗi khi xóa bình luận', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      // Move Post to Trash
      await setDoc(doc(db, 'system_trash', pendingDelete.id), {
        ...pendingDelete,
        deletedAt: serverTimestamp(),
        type: 'post'
      });
      await deleteDoc(doc(db, 'posts', pendingDelete.id));
      setDeleteConfirmVisible(false);
      showToast('Đã chuyển bài đăng vào thùng rác');
    } catch (e) {
      showToast('Lỗi khi thực hiện xóa', 'error');
    }
  };

  const renderPostItem = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image source={{ uri: item.userAvatar || 'https://via.placeholder.com/100' }} style={styles.postAvatar} />
        <View style={styles.postInfo}>
          <Text style={styles.postUserName}>{item.user || 'Người dùng'}</Text>
          <Text style={styles.postDate}>
            {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Mới nhất'}
          </Text>
        </View>
        <TouchableOpacity style={styles.deletePostBtn} onPress={() => handleDeletePost(item)}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <Text style={styles.postText}>{item.content}</Text>

      {item.image && (
        <View style={[styles.postImageWrapper, { aspectRatio: item.imageAspectRatio || 1.3 }]}>
          <Image source={{ uri: item.image }} style={styles.postImage} />
        </View>
      )}

      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={16} color="#ef4444" />
          <Text style={styles.statText}>{item.likes || 0}</Text>
        </View>
        <TouchableOpacity
          style={styles.statItem}
          onPress={() => {
            setSelectedPost(item);
            setCommentModalVisible(true);
          }}
        >
          <Ionicons name="chatbubble" size={16} color="#3b82f6" />
          <Text style={[styles.statText, { color: '#3b82f6', fontWeight: '700' }]}>{item.comments || 0} bình luận</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý bài viết</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderPostItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#e2e8f0" />
              <Text style={styles.emptyText}>Chưa có bài đăng nào</Text>
            </View>
          }
        />
      )}

      {/* Comment Management Modal */}
      <Modal visible={commentModalVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalBg}>
          <View style={styles.modalContentFull}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setCommentModalVisible(false); setSelectedPost(null); }} style={{ marginRight: 15 }}>
                <Ionicons name="chevron-back" size={32} color="#1e293b" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Bình luận</Text>
                <Text style={styles.modalSubTitle}>
                  Bài đăng của <Text style={{ fontWeight: '800', color: '#ff0000ff' }}>{selectedPost?.user}</Text>
                </Text>
              </View>
            </View>

            {loadingComments ? (
              <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <Image source={{ uri: item.userAvatar || item.avatar || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + item.id }} style={styles.commentAvatar} />
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentUserName}>{item.userName || item.user || 'Người dùng'}</Text>
                      </View>
                      <Text style={styles.commentText}>{item.text || item.content || ''}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteComment(item.id)} style={styles.deleteCommentBtn}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubble-outline" size={48} color="#e2e8f0" />
                    <Text style={styles.emptyText}>Chưa có bình luận nào</Text>
                  </View>
                }
                contentContainerStyle={{ paddingBottom: 50 }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Comment Delete Confirmation Modal */}
      <Modal visible={commentDeleteConfirmVisible} transparent animationType="fade" statusBarTranslucent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalContentSmall}>
            <View style={[styles.confirmIconBg, { backgroundColor: '#fff1f2' }]}>
              <Ionicons name="chatbubble-ellipses" size={32} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Xóa bình luận</Text>
            <Text style={styles.confirmSubText}>Bạn có chắc muốn xóa bình luận này</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: '#3b82f6' }]} onPress={() => setCommentDeleteConfirmVisible(false)}>
                <Text style={[styles.cancelBtnText, { color: '#fff' }]}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtnSmall, { backgroundColor: '#ef4444' }]} onPress={confirmDeleteComment}>
                <Text style={styles.saveBtnText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteConfirmVisible} transparent animationType="fade" statusBarTranslucent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalContentSmall}>
            <View style={styles.confirmIconBg}>
              <Ionicons name="trash" size={32} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Xác nhận xóa</Text>
            <Text style={styles.confirmSubText}>Bài đăng của {pendingDelete?.user} sẽ được chuyển vào thùng rác</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: '#3b82f6' }]} onPress={() => setDeleteConfirmVisible(false)}>
                <Text style={[styles.cancelBtnText, { color: '#fff' }]}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtnSmall, { backgroundColor: '#ef4444' }]} onPress={confirmDelete}>
                <Text style={styles.saveBtnText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
      {toast.visible && (
        <Animated.View style={[
          styles.toastContainer,
          { transform: [{ translateY }] },
          toast.type === 'success' ? styles.toastSuccess : styles.toastError
        ]}>
          <Ionicons name={toast.type === 'success' ? "checkmark-circle" : "alert-circle"} size={24} color="#fff" />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 45, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#1e293b', textAlign: 'center' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 50 },

  postCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  postAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9' },
  postInfo: { flex: 1, marginLeft: 12 },
  postUserName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  postDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  deletePostBtn: { padding: 8, borderRadius: 10, backgroundColor: '#fff1f2' },
  postText: { fontSize: 15, color: '#334155', lineHeight: 22, marginBottom: 12 },
  postImageWrapper: { width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 12, backgroundColor: '#f8fafc' },
  postImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  postStats: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, fontWeight: '600', color: '#64748b' },

  commentItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'flex-start' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9' },
  commentContent: { flex: 1, marginLeft: 12 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentUserName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  commentDate: { fontSize: 11, color: '#94a3b8' },
  commentText: { fontSize: 14, color: '#475569', lineHeight: 20 },
  deleteCommentBtn: { padding: 8 },

  emptyContainer: { alignItems: 'center', marginTop: 300 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#94a3b8', fontWeight: '600' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContentFull: { width: '100%', height: '100%', backgroundColor: '#fff', padding: 20, paddingTop: 45 },
  modalContentSmall: { width: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  modalSubTitle: { fontSize: 14, color: '#64748b', fontWeight: '600', marginTop: 2 },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 25 },
  cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center', backgroundColor: '#fff' },
  cancelBtnText: { fontSize: 16, fontWeight: '700', color: '#ef4444' },
  saveBtnSmall: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  confirmIconBg: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff1f2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  confirmSubText: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, marginTop: 10 },

  toastContainer: { position: 'absolute', top: 0, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, zIndex: 9999, gap: 12, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  toastSuccess: { backgroundColor: '#10b981' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
});

export default ArticleManagement;

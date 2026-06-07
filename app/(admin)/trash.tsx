import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../utils/firebaseConfig';

const TrashManagement = () => {
  const [trashedItems, setTrashedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete Confirm Modal State
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string, name: string } | null>(null);

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const translateY = useRef(new Animated.Value(-100)).current;

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

  useEffect(() => {
    const q = query(collection(db, 'system_trash'), orderBy('deletedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTrashedItems(items);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRestore = async (item: any) => {
    try {
      const { originalCollection, originalId, deletedAt, ...rest } = item;
      // 1. Chuyển lại vào collection gốc
      await setDoc(doc(db, originalCollection, originalId), rest);
      // 2. Xóa khỏi thùng rác
      await deleteDoc(doc(db, 'system_trash', item.id));
      showToast('Đã phục hồi nội dung thành công', 'success');
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi phục hồi nội dung', 'error');
    }
  };

  const handlePermanentDelete = (id: string, name: string) => {
    setPendingDelete({ id, name });
    setDeleteConfirmVisible(true);
  };

  const confirmPermanentDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteDoc(doc(db, 'system_trash', pendingDelete.id));
      setDeleteConfirmVisible(false);
      setPendingDelete(null);
      showToast('Đã xóa vĩnh viễn nội dung', 'success');
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi xóa vĩnh viễn', 'error');
    }
  };

  const renderTrashItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.name || item.title || 'Không có tên'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <Text style={styles.cardSubTitle}>
                Loại chủ đề: {item.originalCollection === 'vocab_categories' ? 'Học tập' :
                  (item.category === 'pagoda' ? 'Chùa' : item.category === 'culture' ? 'Văn hóa' : 'Ẩm thực')}
              </Text>
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>
                  {item.deletedAt?.toDate ? item.deletedAt.toDate().toLocaleDateString('vi-VN') : 'Vừa xong'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.restoreBtn} onPress={() => handleRestore(item)}>
            <Ionicons name="refresh-outline" size={18} color="#10b981" />
            <Text style={styles.restoreBtnText}>Phục hồi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={() => handlePermanentDelete(item.id, item.name)}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text style={styles.deleteBtnText}>Xóa vĩnh viễn</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Thùng rác hệ thống</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={trashedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderTrashItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="trash-bin-outline" size={80} color="#e2e8f0" />
              <Text style={styles.emptyText}>Thùng rác trống</Text>
            </View>
          }
        />
      )}

      {/* --- Custom Delete Confirmation Modal --- */}
      <Modal visible={deleteConfirmVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContentSmall}>
            <View style={styles.confirmIconBg}>
              <Ionicons name="trash" size={34} color="#ef4444" />
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 10 }]}>Xóa vĩnh viễn</Text>
            <Text style={styles.confirmSubText}>
              Bạn có chắc chắn muốn xóa vĩnh viễn{"\n"}
              Thao tác này <Text style={{ color: '#ef4444', fontWeight: '700' }}>không thể hoàn tác</Text>
            </Text>
            <View style={[styles.modalActions, { justifyContent: 'center', gap: 15 }]}>
              <TouchableOpacity style={[styles.saveBtnSmall, { backgroundColor: '#3b82f6', flex: 1, alignItems: 'center' }]} onPress={() => setDeleteConfirmVisible(false)}>
                <Text style={styles.saveBtnText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtnSmall, { backgroundColor: '#ef4444', flex: 1, alignItems: 'center' }]} onPress={confirmPermanentDelete}>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 35, height: 50, position: 'relative' },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 24, marginBottom: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardImage: { width: '100%', height: 160, resizeMode: 'cover' },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  cardSubTitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  timeBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  timeText: { fontSize: 11, fontWeight: '700', color: '#000000ff' },
  cardActions: { flexDirection: 'row', gap: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  restoreBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f0fdf4', paddingVertical: 10, borderRadius: 12 },
  restoreBtnText: { fontSize: 14, fontWeight: '700', color: '#10b981' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fef2f2', paddingVertical: 10, borderRadius: 12 },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: '#ef4444' },
  emptyContainer: { alignItems: 'center', marginTop: 290 },
  emptyText: { marginTop: 10, fontSize: 16, color: '#94a3b8', fontWeight: '600' },
  // Toast Styles
  toastContainer: { position: 'absolute', top: 0, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, zIndex: 9999, gap: 12 },
  toastSuccess: { backgroundColor: '#10b981' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
  // Modal & Button Styles (Sync with content.tsx)
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContentSmall: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  saveBtnSmall: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, textAlign: 'center' },
  confirmIconBg: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  confirmSubText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
});

export default TrashManagement;

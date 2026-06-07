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
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        ) : item.originalId?.includes('family') || item.title === 'cat_family' ? (
          <Image source={require('@/assets/images/giadinh.jpg')} style={styles.cardImage} />
        ) : item.originalCollection === 'vocab_categories' ? (
          <Image
            source={
              (item.title === 'cat_family' || item.id?.includes('family') || item.originalId?.includes('family'))
                ? require('@/assets/images/giadinh.jpg')
                : (item.title === 'cat_food' || item.id?.includes('food') || item.originalId?.includes('food'))
                  ? require('@/assets/images/monan.jpg')
                  : (item.title === 'cat_greetings' || item.id?.includes('greeting') || item.originalId?.includes('greeting'))
                    ? require('@/assets/images/chaohoi.jpg')
                    : (item.title === 'cat_numbers' || item.id?.includes('number') || item.originalId?.includes('number'))
                      ? require('@/assets/images/sodem.jpg')
                      : require('@/assets/images/giadinh.jpg')
            }
            style={styles.cardImage}
          />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={32} color="#cbd5e1" />
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name || item.title || 'Không có tên'}</Text>
          <Text style={styles.cardSubTitle}>
            Đã xóa ngày: {item.deletedAt?.toDate ? item.deletedAt.toDate().toLocaleDateString('vi-VN') : 'Mới xóa'}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.restoreBtnSmall}
            onPress={() => handleRestore(item)}
          >
            <Ionicons name="refresh" size={16} color="#3b82f6" />
            <Text style={styles.restoreBtnTextSmall}>Khôi phục</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtnSmall}
            onPress={() => handlePermanentDelete(item.id, item.name || item.title)}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.deleteBtnTextSmall}>Xóa ngay</Text>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imageContainer: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardImage: {
    width: 85,
    height: 85,
    borderRadius: 14,
    resizeMode: 'contain',
    backgroundColor: '#f8fafc',
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
    height: 85,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 2,
  },
  cardSubTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  restoreBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  restoreBtnTextSmall: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3b82f6'
  },
  deleteBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
  },
  deleteBtnTextSmall: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444'
  },
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

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../utils/firebaseConfig';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userFeedbacks, setUserFeedbacks] = useState<any[]>([]);
  const [fetchingFeedback, setFetchingFeedback] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ id: string, isBlocked: boolean, name: string } | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'users'), orderBy('name')), (snap) => {
      const allUsers = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(u => (u as any).role !== 'Quản trị viên');
      setUsers(allUsers);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const toggleUserLock = async (userId: string, currentStatus: boolean, userName: string) => {
    setPendingUser({ id: userId, isBlocked: currentStatus, name: userName });
    setConfirmVisible(true);
  };

  const handleConfirmLock = async () => {
    if (!pendingUser) return;

    setConfirmVisible(false);
    try {
      const userRef = doc(db, 'users', pendingUser.id);
      await updateDoc(userRef, {
        isBlocked: !pendingUser.isBlocked
      });
      // Hiển thị thông báo thành công nhẹ nhàng nếu cần
    } catch (error) {
      console.error('Error toggling lock:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện thao tác này.');
    } finally {
      setPendingUser(null);
    }
  };

  const openFeedback = async (user: any) => {
    setSelectedUser(user);
    setFeedbackVisible(true);
    setFetchingFeedback(true);
    setUserFeedbacks([]);

    try {
      // Dựa theo ảnh console: Collection là 'feedback' và field là 'e-mail'
      const q = query(
        collection(db, 'feedback'),
        where('e-mail', '==', user.email),
        orderBy('createdAt', 'desc')
      );

      const snap = await getDocs(q);
      const feedbacks = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUserFeedbacks(feedbacks);
    } catch (error) {
      // Tạm thời ẩn log lỗi index để tránh gây rối mắt khi index đang được build
      // console.error('Error fetching feedbacks:', error);

      // Fallback nếu có vấn đề về index hoặc field
      try {
        const qSimple = query(
          collection(db, 'feedback'),
          where('e-mail', '==', user.email)
        );
        const snapSimple = await getDocs(qSimple);
        const rawData = snapSimple.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sắp xếp thủ công tại client
        const sorted = rawData.sort((a: any, b: any) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
        setUserFeedbacks(sorted);
      } catch (err) {
        console.error('Simple fetch failed too:', err);
      }
    } finally {
      setFetchingFeedback(false);
    }
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <View style={[styles.userCard, item.isBlocked && styles.userCardLocked]}>
      <View style={styles.userInfoRow}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#94a3b8" />
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={[styles.userName, item.isBlocked && styles.textWhite]}>
            {item.name || 'N/A'}
          </Text>
          <Text style={[styles.userEmail, item.isBlocked && styles.textWhiteLight]}>
            {item.email || 'No email'}
          </Text>

          <View style={styles.userStatsRow}>
            <View style={[styles.statChip, item.isBlocked && styles.statChipLocked]}>
              <Text style={[styles.statChipText, item.isBlocked && styles.textWhite]} numberOfLines={1} adjustsFontSizeToFit>
                {item.points || 0} Điểm
              </Text>
            </View>

            <View style={[styles.statChip, item.isBlocked && styles.statChipLocked]}>
              <Text style={[styles.statChipText, item.isBlocked && styles.textWhite]} numberOfLines={1} adjustsFontSizeToFit>
                {item.completedQuizzes || 0} bài quiz
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.actionRow, item.isBlocked && styles.actionRowLocked]}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.feedbackBtn]}
          onPress={() => openFeedback(item)}
        >
          <MaterialCommunityIcons
            name="comment-text-outline"
            size={18}
            color="#3b82f6"
          />
          <Text style={[styles.actionBtnText, styles.feedbackBtnText]}>
            Phản hồi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, item.isBlocked ? styles.unlockBtn : styles.lockBtn]}
          onPress={() => toggleUserLock(item.id, !!item.isBlocked, item.name || 'Người dùng')}
        >
          <Ionicons
            name={item.isBlocked ? "lock-open-outline" : "lock-closed-outline"}
            size={18}
            color={item.isBlocked ? "#10b981" : "#ef4444"}
          />
          <Text style={[styles.actionBtnText, { color: item.isBlocked ? "#10b981" : "#ef4444" }]}>
            {item.isBlocked ? 'Mở khóa' : 'Khóa'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý người dùng</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>Chưa có người dùng nào</Text> : null
        }
      />

      <Modal
        visible={feedbackVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFeedbackVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Phản hồi từ {selectedUser?.name}</Text>
              <TouchableOpacity onPress={() => setFeedbackVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#ff0000ff" />
              </TouchableOpacity>
            </View>

            {fetchingFeedback ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Đang tải phản hồi...</Text>
              </View>
            ) : userFeedbacks.length > 0 ? (
              <FlatList
                data={userFeedbacks}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.feedbackItem}>
                    <View style={styles.feedbackTimeRow}>
                      <Ionicons name="time-outline" size={16} color="#ff0000ff" />
                      <Text style={styles.feedbackTime}>
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString('vi-VN') : 'Vừa xong'}
                      </Text>
                    </View>
                    <Text style={styles.feedbackSubject}>{item.subject || 'Không có tiêu đề'}</Text>
                    <Text style={styles.feedbackMessage}>{item.message || item.content}</Text>
                  </View>
                )}
                contentContainerStyle={styles.feedbackList}
              />
            ) : (
              <View style={styles.centerContainer}>
                <Text style={styles.noFeedbackText}>Người dùng này chưa có phản hồi nào</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={confirmVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContent}>
            <View style={[styles.confirmIconBg, { backgroundColor: pendingUser?.isBlocked ? '#ecfdf5' : '#fef2f2' }]}>
              <Ionicons
                name={pendingUser?.isBlocked ? "lock-open" : "lock-closed"}
                size={34}
                color={pendingUser?.isBlocked ? "#10b981" : "#ef4444"}
              />
            </View>

            <Text style={styles.confirmTitle}>
              {pendingUser?.isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
            </Text>

            <Text style={styles.confirmSub}>
              Bạn có chắc chắn muốn {pendingUser?.isBlocked ? 'mở lại quyền truy cập' : 'tạm đình chỉ'} cho người dùng <Text style={styles.boldText}>{pendingUser?.name}</Text>
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelActionBtn}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.cancelActionText}>Hủy bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmActionBtn, { backgroundColor: pendingUser?.isBlocked ? '#10b981' : '#ef4444' }]}
                onPress={handleConfirmLock}
              >
                <Text style={styles.confirmActionText}>
                  {pendingUser?.isBlocked ? 'Mở khóa' : 'Khóa ngay'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 45,
    height: 50,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 50, // Giúp text căn giữa theo chiều dọc của header (50px)
    zIndex: 1,
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    flexWrap: 'wrap',
  },
  lockedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  lockedText: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: '700',
  },
  userStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  statChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  statChipLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  feedbackBtnText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  lockBtn: {
    backgroundColor: '#fef2f2',
  },
  unlockBtn: {
    backgroundColor: '#f0fdf4',
  },
  userCardLocked: {
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
  },
  textWhite: {
    color: '#fff',
  },
  textWhiteLight: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionRowLocked: {
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 350,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '70%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 30,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 15,
  },
  noFeedbackText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  feedbackList: {
    paddingBottom: 20,
  },
  feedbackItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  feedbackTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  feedbackTime: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  feedbackSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  feedbackMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 10,
  },
  confirmSub: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  boldText: {
    fontWeight: '700',
    color: '#1e293b',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0080ffff',
    alignItems: 'center',
  },
  cancelActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffffff',
  },
  confirmActionBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

export default UserManagement;

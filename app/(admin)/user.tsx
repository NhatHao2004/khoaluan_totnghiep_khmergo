import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../utils/firebaseConfig';
import { ms, s, vs } from '../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Memoized Components ---

const UserItem = memo(({ item, onFeedback, onToggleLock }: any) => (
  <View style={[styles.userCard, item.isBlocked && styles.userCardLocked]}>
    <View style={styles.userInfoRow}>
      {item.avatar ? (
        <Image
          source={{ uri: item.avatar }}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={ms(24)} color="#94a3b8" />
        </View>
      )}
      <View style={styles.userDetails}>
        <Text style={[styles.userName, item.isBlocked && styles.textWhite]} numberOfLines={1} adjustsFontSizeToFit>
          {item.name || 'N/A'}
        </Text>
        <Text
          style={[styles.userEmail, item.isBlocked && styles.textWhiteLight]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {item.email || 'No email'}
        </Text>

        <View style={styles.userStatsRow}>
          <View style={[styles.statChip, item.isBlocked && styles.statChipLocked]}>
            <Text style={[styles.statChipText, item.isBlocked && styles.textWhite]} adjustsFontSizeToFit>
              {item.points || 0} Điểm
            </Text>
          </View>

          <View style={[styles.statChip, item.isBlocked && styles.statChipLocked]}>
            <Text style={[styles.statChipText, item.isBlocked && styles.textWhite]} adjustsFontSizeToFit>
              {item.completedQuizzes || 0} bài quiz
            </Text>
          </View>
        </View>
      </View>
    </View>

    <View style={[styles.actionRow, item.isBlocked && styles.actionRowLocked]}>
      <TouchableOpacity
        style={[styles.actionBtn, styles.feedbackBtn]}
        onPress={() => onFeedback(item)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="comment-text-outline"
          size={ms(18)}
          color="#3b82f6"
        />
        <Text style={[styles.actionBtnText, styles.feedbackBtnText]} numberOfLines={1} adjustsFontSizeToFit>
          Phản hồi
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionBtn, item.isBlocked ? styles.unlockBtn : styles.lockBtn]}
        onPress={() => onToggleLock(item.id, !!item.isBlocked, item.name || 'Người dùng')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={item.isBlocked ? "lock-open-outline" : "lock-closed-outline"}
          size={ms(18)}
          color={item.isBlocked ? "#10b981" : "#ef4444"}
        />
        <Text style={[styles.actionBtnText, { color: item.isBlocked ? "#10b981" : "#ef4444" }]} numberOfLines={1} adjustsFontSizeToFit>
          {item.isBlocked ? 'Mở khóa' : 'Khóa'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
));
UserItem.displayName = 'UserItem';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userFeedbacks, setUserFeedbacks] = useState<any[]>([]);
  const [fetchingFeedback, setFetchingFeedback] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ id: string, isBlocked: boolean, name: string } | null>(null);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [replyingFeedback, setReplyingFeedback] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Toast States
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const toastY = useSharedValue(-120);

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    toastY.value = withSpring(Platform.OS === 'ios' ? 50 : 40, {
      damping: 15,
      stiffness: 120,
    });

    setTimeout(() => {
      toastY.value = withTiming(-120, { duration: 400 });
      setTimeout(() => setShowToast(false), 400);
    }, 3000);
  };

  const animatedToastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
    opacity: interpolate(toastY.value, [-100, 40], [0, 1], 'clamp'),
  }));

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'users'), orderBy('name')), (snap) => {
      const allUsers = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(u => {
        const data = u as any;
        return data.role !== 'Quản trị viên' && data['quyền'] !== 'Quản trị viên';
      });
      setUsers(allUsers);
      setLoading(false);
    }, (err) => {
      console.error('Snapshot users error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const toggleUserLock = useCallback((userId: string, currentStatus: boolean, userName: string) => {
    setPendingUser({ id: userId, isBlocked: currentStatus, name: userName });
    setConfirmVisible(true);
  }, []);

  const handleConfirmLock = async () => {
    if (!pendingUser) return;
    setConfirmVisible(false);
    try {
      const userRef = doc(db, 'users', pendingUser.id);
      await updateDoc(userRef, { isBlocked: !pendingUser.isBlocked });
    } catch (error) {
      console.error('Error toggling lock:', error);
      triggerToast('Không thể thực hiện thao tác này.', 'error');
    } finally {
      setPendingUser(null);
    }
  };

  const openFeedback = useCallback(async (user: any) => {
    setSelectedUser(user);
    setFeedbackVisible(true);
    setFetchingFeedback(true);
    setUserFeedbacks([]);

    try {
      const q = query(
        collection(db, 'feedback'),
        where('e-mail', '==', user.email),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setUserFeedbacks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      // Simple fallback for index building or field mismatch
      try {
        const qSimple = query(collection(db, 'feedback'), where('e-mail', '==', user.email));
        const snapSimple = await getDocs(qSimple);
        const sorted = snapSimple.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setUserFeedbacks(sorted);
      } catch (err) {
        console.error('Fetch feedback failed:', err);
      }
    } finally {
      setFetchingFeedback(false);
    }
  }, []);

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !replyingFeedback) return;
    setSendingReply(true);
    try {
      await updateDoc(doc(db, 'feedback', replyingFeedback.id), {
        adminReply: replyMessage.trim(),
        repliedAt: new Date()
      });

      await addDoc(collection(db, 'notifications'), {
        toUserId: replyingFeedback.userId,
        fromUserName: 'Hệ thống',
        message: 'đã phản hồi góp ý của bạn.',
        type: 'reply',
        isRead: false,
        createdAt: serverTimestamp()
      });

      setUserFeedbacks(prev => prev.map(f =>
        f.id === replyingFeedback.id
          ? { ...f, adminReply: replyMessage.trim(), repliedAt: new Date() }
          : f
      ));

      setReplyModalVisible(false);
      setReplyingFeedback(null);
      setReplyMessage('');
      triggerToast('Đã gửi phản hồi tới người dùng', 'success');
    } catch (error) {
      console.error('Error replying:', error);
      triggerToast('Không thể gửi phản hồi.', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const renderItem = useCallback(({ item }: any) => (
    <UserItem item={item} onFeedback={openFeedback} onToggleLock={toggleUserLock} />
  ), [openFeedback, toggleUserLock]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, vs(10)) }]}>
      {/* Premium Toast System */}
      {showToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            animatedToastStyle,
            {
              backgroundColor: toastType === 'error' ? '#EF4444' : '#10B981',
              shadowColor: toastType === 'error' ? '#EF4444' : '#10B981',
            }
          ]}
        >
          <View style={styles.toastIcon}>
            <Ionicons
              name={toastType === 'success' ? "checkmark" : "close"}
              size={ms(20)}
              color="#FFF"
            />
          </View>
          <Text style={styles.toastText} numberOfLines={1} adjustsFontSizeToFit>{toastMsg}</Text>
        </Animated.View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={ms(28)} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Quản lý người dùng</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + vs(20) }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText} numberOfLines={1} adjustsFontSizeToFit>Chưa có người dùng nào</Text> : null
        }
      />

      {/* Feedback Modal */}
      <Modal
        visible={feedbackVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFeedbackVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + vs(20) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>Phản hồi từ {selectedUser?.name}</Text>
              <TouchableOpacity onPress={() => setFeedbackVisible(false)}>
                <Ionicons name="close-circle" size={ms(32)} color="#ef4444" />
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
                    <Text style={styles.feedbackSubject}>{item.subject || 'Không có tiêu đề'}</Text>
                    <Text style={styles.feedbackMessage}>Nội dung: {(item.message || item.content) + ' '}</Text>

                    {item.adminReply && (
                      <View style={styles.adminReplyContainer}>
                        <View style={styles.adminReplyHeader}>
                          <Ionicons name="chatbubble-ellipses" size={ms(14)} color="#3b82f6" />
                          <Text style={styles.adminReplyTitle}>Hệ thống trả lời</Text>
                        </View>
                        <Text style={styles.adminReplyText}>{item.adminReply + ' '}</Text>
                      </View>
                    )}

                    <View style={styles.feedbackFooter}>
                      <TouchableOpacity
                        style={styles.replyBtn}
                        onPress={() => {
                          setReplyingFeedback(item);
                          setReplyMessage(item.adminReply || '');
                          setReplyModalVisible(true);
                        }}
                      >
                        <Text style={styles.replyBtnText}>{item.adminReply ? 'Sửa phản hồi' : 'Trả lời phản hồi'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                contentContainerStyle={styles.feedbackList}
              />
            ) : (
              <View style={styles.centerContainer}>
                <Text style={styles.noFeedbackText} numberOfLines={1} adjustsFontSizeToFit>Người dùng này chưa có phản hồi nào</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Confirm Modal */}
      <Modal visible={confirmVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContent}>
            <View style={[styles.confirmIconBg, { backgroundColor: pendingUser?.isBlocked ? '#ecfdf5' : '#fef2f2' }]}>
              <Ionicons
                name={pendingUser?.isBlocked ? "lock-open" : "lock-closed"}
                size={ms(34)}
                color={pendingUser?.isBlocked ? "#10b981" : "#ef4444"}
              />
            </View>
            <Text style={styles.confirmTitle} numberOfLines={1} adjustsFontSizeToFit>
              {pendingUser?.isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
            </Text>
            <Text style={styles.confirmSub}>
              Bạn có chắc chắn muốn {pendingUser?.isBlocked ? 'mở lại quyền truy cập' : 'tạm đình chỉ'} cho người dùng <Text style={styles.boldText}>{pendingUser?.name}</Text>
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelActionBtn} onPress={() => setConfirmVisible(false)}>
                <Text style={styles.cancelActionText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmActionBtn, { backgroundColor: pendingUser?.isBlocked ? '#10b981' : '#0011ffff' }]}
                onPress={handleConfirmLock}
              >
                <Text style={styles.confirmActionText}>{pendingUser?.isBlocked ? 'Mở khóa' : 'Khóa ngay'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reply Modal */}
      <Modal visible={replyModalVisible} transparent animationType="fade" statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.replyOverlay}>
          <View style={styles.replyContent}>
            <Text style={styles.replyTitle} numberOfLines={1} adjustsFontSizeToFit>Trả lời phản hồi</Text>
            <View style={styles.originalFeedbackBox}>
              <Text style={styles.replyOriginalMessage}>Nội dung: {(replyingFeedback?.message || replyingFeedback?.content) + ' '}</Text>
            </View>
            <TextInput
              style={styles.replyInput}
              placeholder="Nhập nội dung trả lời..."
              value={replyMessage}
              onChangeText={setReplyMessage}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.replyActions}>
              <TouchableOpacity style={styles.cancelReplyBtn} onPress={() => setReplyModalVisible(false)}>
                <Text style={styles.cancelReplyText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmReplyBtn, !replyMessage.trim() && styles.disabledBtn]}
                onPress={handleSendReply}
                disabled={sendingReply || !replyMessage.trim()}
              >
                {sendingReply ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmReplyText}>Gửi phản hồi</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: s(12), height: vs(50), backgroundColor: 'transparent', justifyContent: 'center' },
  backBtn: { position: 'absolute', left: s(12), width: s(44), height: s(44), justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  headerTitle: { fontSize: ms(20), fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  listContent: { padding: s(16) },
  userCard: { backgroundColor: '#fff', borderRadius: s(20), padding: s(16), marginBottom: vs(16), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(16) },
  avatar: { width: s(60), height: s(60), borderRadius: s(30), backgroundColor: '#f1f5f9' },
  avatarPlaceholder: { width: s(60), height: s(60), borderRadius: s(30), backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  userDetails: { flex: 1, marginLeft: s(16), justifyContent: 'center' },
  userName: { fontSize: ms(17), fontWeight: '700', color: '#1e293b', marginBottom: vs(2) },
  userEmail: { fontSize: ms(13), color: '#64748b', width: '100%', lineHeight: vs(18) },
  userStatsRow: { flexDirection: 'row', gap: s(8), marginTop: vs(8), flexWrap: 'wrap' },
  statChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: s(10), paddingVertical: vs(5), borderRadius: s(8), borderWidth: 1, borderColor: '#e2e8f0', minWidth: s(70), justifyContent: 'center' },
  statChipText: { fontSize: ms(11.5), fontWeight: '700', color: '#475569' },
  statChipLocked: { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)' },
  actionRow: { flexDirection: 'row', gap: s(12), borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: vs(16) },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: vs(10), borderRadius: s(12), gap: s(6) },
  actionBtnText: { fontSize: ms(14), fontWeight: '600' },
  feedbackBtn: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe' },
  feedbackBtnText: { color: '#3b82f6' },
  lockBtn: { backgroundColor: '#fef2f2' },
  unlockBtn: { backgroundColor: '#f0fdf4' },
  userCardLocked: { backgroundColor: '#ef4444' },
  textWhite: { color: '#fff' },
  textWhiteLight: { color: 'rgba(255, 255, 255, 0.8)' },
  actionRowLocked: { borderTopColor: 'rgba(255, 255, 255, 0.2)' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: vs(330), fontSize: ms(16) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: s(30), borderTopRightRadius: s(30), height: '80%', padding: s(20) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(15) },
  modalTitle: { fontSize: ms(18), fontWeight: '800', color: '#1e293b', flex: 1, marginRight: s(10) },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: vs(10) },
  loadingText: { color: '#64748b', fontSize: ms(14) },
  noFeedbackText: { color: '#94a3b8', fontSize: ms(15) },
  feedbackItem: { backgroundColor: '#f8fafc', borderRadius: s(16), padding: s(16), marginBottom: vs(16), borderWidth: 1, borderColor: '#e2e8f0' },
  feedbackSubject: { fontSize: ms(16), fontWeight: '700', color: '#1e293b', marginBottom: vs(4) },
  feedbackMessage: { fontSize: ms(14), color: '#475569', lineHeight: vs(24), textAlign: 'justify', paddingLeft: s(6), paddingRight: s(12), paddingBottom: vs(2), includeFontPadding: false },
  adminReplyContainer: { backgroundColor: '#eff6ff', padding: s(12), borderRadius: s(12), marginTop: vs(12), borderLeftWidth: 3, borderLeftColor: '#3b82f6' },
  adminReplyHeader: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginBottom: vs(4) },
  adminReplyTitle: { fontSize: ms(12), fontWeight: '800', color: '#1e293b' },
  adminReplyText: { fontSize: ms(14), color: '#334155', lineHeight: vs(24), textAlign: 'justify', paddingLeft: s(6), paddingRight: s(12), paddingBottom: vs(2), includeFontPadding: false },
  feedbackList: { paddingBottom: vs(20) },
  feedbackFooter: { marginTop: vs(12), paddingTop: vs(8), borderTopWidth: 1, borderTopColor: '#f1f5f9', alignItems: 'flex-end' },
  replyBtn: { paddingVertical: vs(5) },
  replyBtnText: { fontSize: ms(13), fontWeight: '700', color: '#3b82f6' },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: s(20) },
  confirmContent: { backgroundColor: '#fff', borderRadius: s(24), padding: s(24), width: '100%', alignItems: 'center' },
  confirmIconBg: { width: s(70), height: s(70), borderRadius: s(35), justifyContent: 'center', alignItems: 'center', marginBottom: vs(15) },
  confirmTitle: { fontSize: ms(20), fontWeight: '800', color: '#1e293b', marginBottom: vs(8) },
  confirmSub: { fontSize: ms(15), color: '#64748b', textAlign: 'center', lineHeight: vs(22), marginBottom: vs(24) },
  boldText: { fontWeight: '800', color: '#1e293b' },
  confirmActions: { flexDirection: 'row', gap: s(12), width: '100%' },
  cancelActionBtn: { flex: 1, paddingVertical: vs(12), borderRadius: s(12), backgroundColor: '#ff0000ff', alignItems: 'center' },
  cancelActionText: { fontSize: ms(15), fontWeight: '800', color: '#ffffffff' },
  confirmActionBtn: { flex: 1, paddingVertical: vs(12), borderRadius: s(12), alignItems: 'center' },
  confirmActionText: { fontSize: ms(15), fontWeight: '800', color: '#fff' },
  replyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: s(20) },
  replyContent: { backgroundColor: '#fff', borderRadius: s(24), padding: s(20) },
  replyTitle: { fontSize: ms(20), fontWeight: '800', color: '#1e293b', marginBottom: vs(10) },
  originalFeedbackBox: { backgroundColor: '#f1f5f9', padding: s(12), borderRadius: s(12), marginBottom: vs(16) },
  replyOriginalMessage: { fontSize: ms(14), color: '#475569', lineHeight: vs(24), textAlign: 'justify', paddingLeft: s(6), paddingRight: s(12), paddingBottom: vs(2), includeFontPadding: false },
  replyInput: { backgroundColor: '#f8fafc', borderRadius: s(12), padding: s(12), fontSize: ms(15), color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0', height: vs(150), marginBottom: vs(20) },
  replyActions: { flexDirection: 'row', gap: s(12) },
  cancelReplyBtn: { flex: 1, paddingVertical: vs(12), borderRadius: s(12), backgroundColor: '#ff0000ff', alignItems: 'center' },
  cancelReplyText: { fontSize: ms(15), fontWeight: '800', color: '#ffffffff' },
  confirmReplyBtn: { flex: 1, paddingVertical: vs(12), borderRadius: s(12), backgroundColor: '#3b82f6', alignItems: 'center' },
  confirmReplyText: { fontSize: ms(15), fontWeight: '800', color: '#fff' },
  disabledBtn: { backgroundColor: '#94a3b8' },
  toastContainer: { position: 'absolute', top: 0, left: s(16), right: s(16), height: vs(56), borderRadius: ms(18), flexDirection: 'row', alignItems: 'center', paddingHorizontal: s(14), zIndex: 9999, elevation: 10 },
  toastIcon: { width: s(32), height: s(32), borderRadius: s(16), backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  toastText: { color: '#FFF', fontSize: ms(15), fontWeight: '700', marginLeft: s(12), flex: 1 },
});

export default UserManagement;

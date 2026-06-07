import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../utils/firebaseConfig';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const toggleUserLock = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'mở khóa' : 'khóa';
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc muốn ${action} người dùng này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              const userRef = doc(db, 'users', userId);
              await updateDoc(userRef, {
                isBlocked: !currentStatus
              });
            } catch (error) {
              console.error('Error toggling lock:', error);
              Alert.alert('Lỗi', 'Không thể thực hiện thao tác này.');
            }
          }
        }
      ]
    );
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
              <Text style={[styles.statChipText, item.isBlocked && styles.textWhite]}>
                {item.points || 0} Điểm
              </Text>
            </View>

            <View style={[styles.statChip, item.isBlocked && styles.statChipLocked]}>
              <Text style={[styles.statChipText, item.isBlocked && styles.textWhite]}>
                {item.completedQuizzes || 0} bài quiz
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.actionRow, item.isBlocked && styles.actionRowLocked]}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.feedbackBtn]}
          onPress={() => Alert.alert('Thông báo', 'Tính năng xem phản hồi đang được phát triển.')}
        >
          <MaterialCommunityIcons
            name="comment-text-outline"
            size={18}
            color="#fff"
          />
          <Text style={[styles.actionBtnText, styles.feedbackBtnText]}>
            Phản hồi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, item.isBlocked ? styles.unlockBtn : styles.lockBtn]}
          onPress={() => toggleUserLock(item.id, !!item.isBlocked)}
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
          !loading ? <Text style={styles.emptyText}>Không tìm thấy người dùng nào</Text> : null
        }
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    position: 'relative',
    minHeight: 85,
  },
  backBtn: {
    padding: 8,
    zIndex: 10,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 15,
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    zIndex: 1,
    paddingHorizontal: 60, // Tránh đè lên nút back
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
    backgroundColor: '#3b82f6',
  },
  feedbackBtnText: {
    color: '#fff',
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
    marginTop: 100,
    fontSize: 16,
  },
});

export default UserManagement;

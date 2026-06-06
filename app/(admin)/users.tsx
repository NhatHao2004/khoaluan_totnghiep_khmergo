import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../utils/firebaseConfig';

const UsersManagement = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const now = new Date().getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      const usersData = snap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((user: any) => {
          // Lọc: Không phải admin VÀ phải trong vòng 24h
          const isAdmin = user.role === 'Quản trị viên';
          if (isAdmin) return false;

          if (!user.createdAt) return false;
          const createTime = user.createdAt.toDate ? user.createdAt.toDate().getTime() : new Date(user.createdAt).getTime();
          return (now - createTime) < oneDayInMs;
        });

      setUsers(usersData);
    });

    return () => unsub();
  }, []);

  // Hàm tính thời gian tương đối
  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Vừa xong';
    const now = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Vừa xong';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return `${Math.floor(diffInHours / 24)} ngày trước`;
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityInfo}>
        <Text style={styles.activityItemTitle}>{item.name || 'Người dùng mới'}</Text>
      </View>
      <Text style={styles.activityTime}>{getTimeAgo(item.createdAt)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hoạt động gần đây</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có hoạt động mới nào</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1e293b',
  },
  listContent: {
    padding: 16,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  activityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginLeft: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 340,
    fontSize: 16,
  },
});

export default UsersManagement;

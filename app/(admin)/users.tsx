import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../utils/firebaseConfig';
import { ms, s, vs } from '../../utils/responsive';

// --- Memoized Components ---

const ActivityCard = memo(({ item, getTimeAgo }: any) => (
  <View style={styles.activityCard}>
    <View style={styles.activityHeaderRow}>
      <View style={styles.activityAvatar}>
        {item.avatar ? (
          <Image
            source={{ uri: item.avatar }}
            style={styles.avatarImg}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Ionicons name="person" size={ms(18)} color="#cbd5e1" />
        )}
      </View>
      <Text style={styles.activityItemTitle} numberOfLines={1} adjustsFontSizeToFit>{item.name || 'Người dùng mới'}</Text>
    </View>
    <View style={styles.activityFooter}>
      <Text style={styles.activityDesc} numberOfLines={1} adjustsFontSizeToFit>Đã trở thành thành viên chính thức từ hôm nay </Text>
    </View>
  </View>
));
ActivityCard.displayName = 'ActivityCard';

const UsersActivity = () => {
  const insets = useSafeAreaInsets();
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
    }, (err) => {
      console.error('Snapshot users activity error:', err);
    });

    return () => unsub();
  }, []);

  const getTimeAgo = useCallback((timestamp: any) => {
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
  }, []);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, vs(10)) }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={ms(28)} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Hoạt động gần đây</Text>
        <View style={{ width: s(44) }} />
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityCard item={item} getTimeAgo={getTimeAgo} />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + vs(20) }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={ms(64)} color="#e2e8f0" />
            <Text style={styles.emptyText} numberOfLines={1} adjustsFontSizeToFit>Chưa có hoạt động mới nào</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(16),
    paddingBottom: vs(15),
    backgroundColor: '#fff',
  },
  backBtn: { width: s(44), height: s(44), justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: ms(20), fontWeight: '400', color: '#1e293b', textAlign: 'center' },
  listContent: { padding: s(16) },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: ms(16),
    padding: s(16),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginBottom: vs(10),
  },
  activityAvatar: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  activityItemTitle: {
    fontSize: ms(16),
    fontWeight: '400',
    color: '#1e293b',
    flex: 1,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityDesc: {
    fontSize: ms(14),
    color: '#64748b',
    fontWeight: '400',
    flex: 1,
  },
  activityTime: {
    fontSize: ms(12),
    color: '#94a3b8',
    fontWeight: '400',
    marginLeft: s(10),
  },
  emptyContainer: { alignItems: 'center', marginTop: vs(280), opacity: 0.5 },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: vs(16),
    fontSize: ms(16),
    fontWeight: '400'
  },
});

export default UsersActivity;

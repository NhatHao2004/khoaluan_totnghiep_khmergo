import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../contexts/AuthContext';
import { db } from '../../utils/firebaseConfig';
import { ms, s, vs } from '../../utils/responsive';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - s(48)) / 2;

// --- Optimized Sub-components ---

const StatCard = memo(({ label, count, icon, onPress }: any) => (
  <TouchableOpacity
    style={styles.statCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.iconBox}>
      {icon}
    </View>
    <View style={styles.statInfoRow}>
      <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
      <View style={styles.statNumberGroup}>
        <Text style={styles.statNumber}>{count}</Text>
      </View>
    </View>
  </TouchableOpacity>
));

const PodiumItem = memo(({ user, index }: any) => {
  const rank = index + 1;
  const barColor = useMemo(() => {
    if (rank === 1) return '#ef4444';
    if (rank === 2) return '#facc15';
    if (rank === 3) return '#22c55e';
    return '#94a3b8';
  }, [rank]);

  const barHeight = useMemo(() => {
    if (rank === 1) return vs(125);
    if (rank === 2) return vs(105);
    if (rank === 3) return vs(90);
    return vs(70);
  }, [rank]);

  return (
    <View style={styles.podiumCol}>
      <View style={styles.userHead}>
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={rank === 1 ? styles.avatarLarge : styles.avatarMini}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, rank === 1 && styles.avatarLarge]}>
              <Ionicons name="person" size={rank === 1 ? ms(24) : ms(16)} color="#cbd5e1" />
            </View>
          )}
        </View>
        <View style={styles.podiumTextGroup}>
          <Text style={styles.podiumName} numberOfLines={1} adjustsFontSizeToFit>{user.name || '---'}</Text>
          <Text style={styles.podiumPoints} numberOfLines={1} adjustsFontSizeToFit>{user.points || 0} điểm</Text>
        </View>
      </View>
      <View style={[styles.bar, { height: barHeight, backgroundColor: barColor }]}>
        <Text style={styles.rankNum}>{rank}</Text>
      </View>
    </View>
  );
});

const ActivityCard = memo(({ activity }: any) => (
  <View style={styles.activityCard}>
    <Text style={styles.activityItemTitle} numberOfLines={1} adjustsFontSizeToFit>{activity.name}</Text>
    <View style={styles.activityBottomRow}>
      <Text style={styles.activityDesc} numberOfLines={1} adjustsFontSizeToFit>Đã đăng ký tài khoản thành công</Text>
      <Text style={styles.activityTime}>{activity.timeAgo || 'Vừa xong'}</Text>
    </View>
  </View>
));

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    content: 0,
    challenges: 0,
    posts: 0
  });
  const [allSortedUsers, setAllSortedUsers] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [adminName, setAdminName] = useState('');
  const leaderboardRef = useRef<ScrollView>(null);
  const { logout, user } = useContext(AuthContext);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Lấy số lượng người dùng (loại bỏ Admin một cách an toàn)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const regularUsers = snap.docs.filter(doc => {
        const data = doc.data();
        return data.role !== 'Quản trị viên' && data['quyền'] !== 'Quản trị viên';
      });
      setStats(prev => ({ ...prev, users: regularUsers.length }));
    });

    // Lấy số lượng địa điểm/nội dung
    onSnapshot(collection(db, 'destinations'), (snap) => {
      setStats(prev => ({ ...prev, content: snap.size }));
    });

    // Lấy số lượng thử thách
    onSnapshot(collection(db, 'quizzes'), (snap) => {
      setStats(prev => ({ ...prev, challenges: snap.size }));
    });

    // Lấy số lượng bài viết
    onSnapshot(collection(db, 'posts'), (snap) => {
      setStats(prev => ({ ...prev, posts: snap.size }));
    });

    // Lấy bảng xếp hạng
    onSnapshot(collection(db, 'users'), (snap) => {
      const allUsers = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((u: any) => u.role !== 'Quản trị viên' && u['quyền'] !== 'Quản trị viên');

      const sortedUsers = allUsers.sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
      setAllSortedUsers(sortedUsers);
    });

    // Lấy hoạt động gần đây
    const unsubRecent = onSnapshot(collection(db, 'users'), (snap) => {
      const now = new Date().getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      const recentUsers = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => {
          if (!u.createdAt) return false;
          const createTime = u.createdAt.toDate ? u.createdAt.toDate().getTime() : new Date(u.createdAt).getTime();
          return (now - createTime) < oneDayInMs;
        });

      const sortedRecent = recentUsers.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });

      const activities = sortedRecent.slice(0, 5).map((u: any) => ({
        id: u.id,
        name: u.name || u['tên'] || 'Người dùng mới',
        timeAgo: getTimeAgo(u.createdAt)
      }));

      setRecentActivities(activities);
    });
 
    let unsubAdmin: any;
    if (user?.uid) {
      unsubAdmin = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAdminName(data.name || data['tên'] || '');
        }
      });
    }
    return () => {
      unsubUsers();
      unsubRecent();
      if (unsubAdmin) unsubAdmin();
    };
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
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ngày trước`;
  }, []);

  // Tính danh sách hiển thị
  const displayedLeaderboard = useMemo(() => {
    const leaderboardLimit = 20;
    const topUsers = allSortedUsers.slice(0, leaderboardLimit);
    return Array.from({ length: leaderboardLimit }, (_, i) => {
      return topUsers[i] || { id: `empty-${i}`, name: '---', points: 0, dummy: true };
    });
  }, [allSortedUsers]);



  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, vs(15)) }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + vs(40) }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.push('/(admin)/profile' as any)}
            activeOpacity={0.7}
            style={{ flex: 1 }}
          >
            <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
              {adminName || 'Quản trị viên'}
            </Text>
          </TouchableOpacity>
          <View style={styles.headerRightActions}>
          </View>
        </View>

        {/* Statistics Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Người dùng"
            count={stats.users}
            icon={<Ionicons name="person-outline" size={ms(22)} color="#ef4444" />}
            onPress={() => router.push('/(admin)/user' as any)}
          />
          <StatCard
            label="Nội dung"
            count={stats.content}
            icon={<Ionicons name="book-outline" size={ms(22)} color="#10b981" />}
            onPress={() => router.push('/(admin)/content' as any)}
          />
          <StatCard
            label="Thử thách"
            count={stats.challenges}
            icon={<Ionicons name="help-circle-outline" size={ms(26)} color="#f59e0b" />}
            onPress={() => router.push('/(admin)/challenges' as any)}
          />
          <StatCard
            label="Bài viết"
            count={stats.posts}
            icon={<MaterialCommunityIcons name="chat-outline" size={ms(25)} color="#ec4899" />}
            onPress={() => router.push('/(admin)/article' as any)}
          />
        </View>

        {/* Leaderboard Chart Section */}
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle} numberOfLines={1} adjustsFontSizeToFit>Biểu đồ bảng xếp hạng</Text>
        </View>

        <View style={styles.podiumContainer}>
          <ScrollView
            ref={leaderboardRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.podiumScrollContent}
            decelerationRate="fast"
            snapToInterval={s(100)}
          >
            {displayedLeaderboard.map((user, index) => (
              <PodiumItem key={user.id} user={user} index={index} />
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle} numberOfLines={1} adjustsFontSizeToFit>Hoạt động gần đây</Text>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push('/(admin)/users' as any)}
          >
            <Text style={styles.seeAllText} numberOfLines={1} adjustsFontSizeToFit>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityContainer}>
          {recentActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
          {recentActivities.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có hoạt động mới nào</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Logout Modal removed from here, moved to profile.tsx */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(20),
    paddingBottom: vs(5),
    minHeight: vs(70),
  },
  headerTitle: {
    fontSize: ms(22),
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
  },
  menuBtn: {
    padding: s(6),
    backgroundColor: '#fff',
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  trashBtnHeader: {
    padding: s(8),
    backgroundColor: '#fff',
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: s(16),
    justifyContent: 'space-between',
    gap: s(12),
    marginBottom: vs(30),
    marginTop: vs(5),
  },
  statCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: s(24),
    padding: s(14),
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: s(38),
    height: s(38),
    borderRadius: s(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(8),
  },
  statInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: vs(4),
  },
  statLabel: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#64748b',
    flex: 1,
  },
  statNumberGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: s(4),
  },
  statNumber: {
    fontSize: ms(15),
    fontWeight: '800',
    color: '#1e293b',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(20),
    marginBottom: vs(10),
  },
  chartTitle: {
    fontSize: ms(16),
    fontWeight: '800',
    color: '#1e293b',
  },
  podiumContainer: {
    marginHorizontal: s(16),
    marginBottom: vs(15),
  },
  podiumScrollContent: {
    paddingHorizontal: s(4),
    alignItems: 'flex-end',
    gap: s(10),
  },
  podiumCol: {
    width: s(90),
    alignItems: 'center',
    paddingHorizontal: s(4),
  },
  userHead: {
    alignItems: 'center',
    marginBottom: vs(10),
    width: '100%',
    minHeight: vs(95),
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginBottom: vs(4),
  },
  podiumTextGroup: {
    alignItems: 'center',
    width: '100%',
    height: vs(35),
    justifyContent: 'center',
  },
  avatarMini: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  avatarLarge: {
    width: s(54),
    height: s(54),
    borderRadius: s(27),
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarPlaceholder: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumName: {
    fontSize: ms(10),
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    width: '100%',
  },
  podiumPoints: {
    fontSize: ms(9),
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: vs(1),
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: s(10),
    borderTopRightRadius: s(10),
    borderBottomLeftRadius: s(4),
    borderBottomRightRadius: s(4),
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: vs(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  rankNum: {
    fontSize: ms(22),
    fontWeight: '900',
    color: '#fff',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(20),
    marginBottom: vs(15),
  },
  activityTitle: {
    fontSize: ms(16),
    fontWeight: '800',
    color: '#1e293b',
  },
  seeAllBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: s(14),
    paddingVertical: vs(7),
    borderRadius: s(10),
    minWidth: s(90),
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllText: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  activityContainer: {
    paddingHorizontal: s(16),
    marginBottom: vs(40),
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: s(16),
    padding: s(14),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  activityItemTitle: {
    fontSize: ms(16),
    fontWeight: '800',
    color: '#1e293b',
  },
  activityBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(4),
  },
  activityDesc: {
    fontSize: ms(14),
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  activityTime: {
    fontSize: ms(12),
    color: '#94a3b8',
    fontWeight: '600',
    marginLeft: s(10),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(65),
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: ms(14),
  },

  // Premium Logout Modal
  logoutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  logoutBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(32),
    borderTopRightRadius: ms(32),
    paddingTop: vs(30),
    paddingBottom: vs(40),
    paddingHorizontal: s(28),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  logoutAvatarCircle: {
    width: s(72),
    height: s(72),
    borderRadius: s(36),
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(14),
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  logoutAvatarInitial: {
    fontSize: ms(28),
    fontWeight: '900',
    color: '#fff',
  },
  logoutTitle: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: vs(4),
  },
  logoutName: {
    fontSize: ms(20),
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: vs(2),
  },
  logoutEmail: {
    fontSize: ms(13),
    color: '#64748b',
    fontWeight: '500',
    marginBottom: vs(24),
  },
  logoutDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: vs(24),
  },
  logoutConfirmBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(10),
    backgroundColor: '#ef4444',
    paddingVertical: vs(16),
    borderRadius: s(18),
    marginBottom: vs(12),
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoutConfirmText: {
    color: '#fff',
    fontSize: ms(16),
    fontWeight: '800',
  },
  logoutCancelBtn: {
    width: '100%',
    paddingVertical: vs(14),
    borderRadius: s(18),
    backgroundColor: '#0080ffff',
    alignItems: 'center',
  },
  logoutCancelText: {
    color: '#ffffffff',
    fontSize: ms(15),
    fontWeight: '700',
  },
  profileDetailBtn: {
    width: '100%',
    backgroundColor: '#f1f5f9',
    paddingVertical: vs(14),
    borderRadius: s(18),
    alignItems: 'center',
    marginBottom: vs(12),
  },
  profileDetailText: {
    color: '#475569',
    fontSize: ms(15),
    fontWeight: '700',
  },
});

export default AdminDashboard;
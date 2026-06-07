import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { db } from '../../utils/firebaseConfig';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    content: 0,
    challenges: 0,
    posts: 0
  });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [allSortedUsers, setAllSortedUsers] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const leaderboardRef = useRef<ScrollView>(null);
  const { logout, user } = useContext(AuthContext);

  useEffect(() => {
    // Lấy số lượng người dùng (loại bỏ Admin một cách an toàn)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const regularUsers = snap.docs.filter(doc => {
        const data = doc.data();
        return data.role !== 'Quản trị viên';
      });
      setStats(prev => ({ ...prev, users: regularUsers.length }));
    });

    // Lấy số lượng địa điểm/nội dung
    const unsubContent = onSnapshot(collection(db, 'destinations'), (snap) => {
      setStats(prev => ({ ...prev, content: snap.size }));
    });

    // Lấy số lượng thử thách
    const unsubChallenges = onSnapshot(collection(db, 'quizzes'), (snap) => {
      setStats(prev => ({ ...prev, challenges: snap.size }));
    });

    // Lấy số lượng bài viết
    const unsubPosts = onSnapshot(collection(db, 'posts'), (snap) => {
      setStats(prev => ({ ...prev, posts: snap.size }));
    });

    // Lấy bảng xếp hạng (chỉ chạy 1 lần, lưu toàn bộ)
    const unsubLeaderboard = onSnapshot(collection(db, 'users'), (snap) => {
      const allUsers = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(user => (user as any).role !== 'Quản trị viên');

      const sortedUsers = allUsers.sort((a: any, b: any) => {
        return (b.points || 0) - (a.points || 0);
      });

      setAllSortedUsers(sortedUsers);
    });

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
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ngày trước`;
    };

    // Lấy hoạt động gần đây (Chỉ lấy người dùng đăng ký trong 24h qua)
    const unsubRecent = onSnapshot(collection(db, 'users'), (snap) => {
      const now = new Date().getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      const recentUsers = snap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((user: any) => {
          if (!user.createdAt) return false;
          const createTime = user.createdAt.toDate ? user.createdAt.toDate().getTime() : new Date(user.createdAt).getTime();
          return (now - createTime) < oneDayInMs; // Chỉ lấy trong vòng 24h
        });

      // Sắp xếp người mới nhất lên đầu
      const sortedRecent = recentUsers.sort((a: any, b: any) => {
        const timeA = a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });

      const activities = sortedRecent.slice(0, 5).map((user: any) => ({
        id: user.id,
        name: user.name || 'Người dùng mới',
        timeAgo: getTimeAgo(user.createdAt)
      }));

      setRecentActivities(activities);
    });

    return () => {
      unsubUsers();
      unsubContent();
      unsubChallenges();
      unsubPosts();
      unsubLeaderboard();
      unsubRecent();
    };
  }, []);

  // Tính danh sách hiển thị (mặc định lấy top 20)
  const displayedLeaderboard = (() => {
    const leaderboardLimit = 20;
    const topUsers = allSortedUsers.slice(0, leaderboardLimit);
    return Array.from({ length: leaderboardLimit }, (_, i) => {
      return topUsers[i] || { id: `empty-${i}`, name: '---', points: 0, dummy: true };
    });
  })();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản trị viên</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Quản trị viên',
                `Tài khoản: ${user?.name || user?.email}\nBạn muốn thực hiện hành động gì?`,
                [
                  { text: 'Hủy', style: 'cancel' },
                  {
                    text: 'Đăng xuất',
                    onPress: async () => {
                      await logout();
                      router.replace('/login');
                    },
                    style: 'destructive'
                  },
                ]
              );
            }}
            style={styles.menuBtn}
          >
            <Ionicons name="menu" size={30} color="#1e293b" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(admin)/trash' as any)}
            style={styles.trashBtnHeader}
          >
            <Ionicons name="trash-outline" size={26} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/(admin)/user' as any)}
        >
          <View style={styles.iconBox}>
            <Ionicons name="person-outline" size={22} color="#ef4444" />
          </View>
          <View style={styles.statInfoRow}>
            <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Người dùng</Text>
            <View style={styles.statNumberGroup}>
              <Text style={styles.statNumber}>{stats.users}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/(admin)/content' as any)}
        >
          <View style={styles.iconBox}>
            <Ionicons name="book-outline" size={22} color="#10b981" />
          </View>
          <View style={styles.statInfoRow}>
            <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Nội dung</Text>
            <View style={styles.statNumberGroup}>
              <Text style={styles.statNumber}>{stats.content}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.statCard}>
          <View style={styles.iconBox}>
            <Ionicons name="help-circle-outline" size={26} color="#f59e0b" />
          </View>
          <View style={styles.statInfoRow}>
            <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Thử thách</Text>
            <View style={styles.statNumberGroup}>
              <Text style={styles.statNumber}>{stats.challenges}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="chat-outline" size={25} color="#ec4899" />
          </View>
          <View style={styles.statInfoRow}>
            <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Bài viết</Text>
            <View style={styles.statNumberGroup}>
              <Text style={styles.statNumber}>{stats.posts}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Leaderboard Chart Section */}
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Biểu đồ bảng xếp hạng</Text>
      </View>

      <View style={styles.podiumContainer}>
        <ScrollView
          ref={leaderboardRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.podiumScrollContent}
          decelerationRate="fast"
          bounces={true}
          overScrollMode="always"
        >
          {displayedLeaderboard.map((user, index) => {
            const rank = index + 1;
            const barColor = rank === 1 ? '#ef4444' : rank === 2 ? '#facc15' : rank === 3 ? '#22c55e' : '#94a3b8';
            const barHeight = rank === 1 ? 120 : rank === 2 ? 100 : rank === 3 ? 85 : 65;

            return (
              <View key={user.id} style={styles.podiumCol}>
                <View style={styles.userHead}>
                  {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={rank === 1 ? styles.avatarLarge : styles.avatarMini} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, rank === 1 && styles.avatarLarge]}>
                      <Ionicons name="person" size={rank === 1 ? 24 : 16} color="#cbd5e1" />
                    </View>
                  )}
                  <Text style={styles.podiumName}>{user.name || '---'}</Text>
                  <Text style={styles.podiumPoints} numberOfLines={1} adjustsFontSizeToFit>{user.points || 0} điểm</Text>
                </View>
                <View style={[styles.bar, { height: barHeight, backgroundColor: barColor }]}>
                  <Text style={styles.rankNum}>{rank}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Recent Activity Section */}
      <View style={styles.activityHeader}>
        <Text style={styles.activityTitle}>Hoạt động gần đây</Text>
        <TouchableOpacity
          style={styles.seeAllBtn}
          onPress={() => router.push('/(admin)/users' as any)}
        >
          <Text style={styles.seeAllText} numberOfLines={1} adjustsFontSizeToFit>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.activityContainer}>
        {recentActivities.map((activity, index) => (
          <View key={activity.id} style={styles.activityCard}>
            <Text style={styles.activityItemTitle}>{activity.name}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <Text style={styles.activityDesc} numberOfLines={1}>Đã đăng ký tài khoản thành công</Text>
              <Text style={styles.activityTime}>{activity.timeAgo || 'Vừa xong'}</Text>
            </View>
          </View>
        ))}
        {recentActivities.length === 0 && (
          <Text style={styles.emptyText}>Chưa có hoạt động mới nào</Text>
        )}
      </View>
    </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 5,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    minHeight: 70,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  menuBtn: {
    padding: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trashBtnHeader: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 30,
    marginTop: 5,
  },
  statCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 14,
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
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    flex: 1,
  },
  statNumberGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 4,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  statTotal: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '500',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  podiumContainer: {
    marginHorizontal: 16,
    paddingBottom: 0,
    marginBottom: 15,
  },
  podiumScrollContent: {
    paddingHorizontal: 4,
    paddingRight: 4,
    alignItems: 'flex-end',
    gap: 10,
  },
  podiumCol: {
    width: 80,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  userHead: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
    height: 85,
    justifyContent: 'flex-end',
  },
  avatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 6,
    textAlign: 'center',
  },
  podiumPoints: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  rankNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  seeAllBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    minWidth: 90, // Đảm bảo không bị co lại
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  activityContainer: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
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
    marginBottom: 6,
  },
  activityItemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  activityDesc: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginLeft: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 105,
    fontSize: 14,
  },
});

export default AdminDashboard;

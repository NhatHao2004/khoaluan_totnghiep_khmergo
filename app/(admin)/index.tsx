import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [activeTab, setActiveTab] = useState('weekly');
  const leaderboardRef = useRef<ScrollView>(null);

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

    return () => {
      unsubUsers();
      unsubContent();
      unsubChallenges();
      unsubPosts();
      unsubLeaderboard();
    };
  }, []);

  // Tính danh sách hiển thị dựa trên tab (không gọi lại Firebase)
  const displayedLeaderboard = (() => {
    const leaderboardLimit = activeTab === 'all' ? 20 : 10;
    const topUsers = allSortedUsers.slice(0, leaderboardLimit);
    return Array.from({ length: leaderboardLimit }, (_, i) => {
      return topUsers[i] || { id: `empty-${i}`, name: '---', points: 0, dummy: true };
    });
  })();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header View - Injected by layout, but matches style */}
      <View style={styles.topActions}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="menu-outline" size={28} color="#1e293b" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(admin)/trash' as any)}
          >
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.iconBox}>
            <Ionicons name="person-outline" size={22} color="#ef4444" />
          </View>
          <View style={styles.statInfoRow}>
            <Text style={styles.statLabel}>Người dùng</Text>
            <View style={styles.statNumberGroup}>
              <Text style={styles.statNumber}>{stats.users}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.iconBox}>
            <Ionicons name="book-outline" size={22} color="#10b981" />
          </View>
          <View style={styles.statInfoRow}>
            <Text style={styles.statLabel}>Nội dung</Text>
            <View style={styles.statNumberGroup}>
              <Text style={styles.statNumber}>{stats.content}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.iconBox}>
            <Ionicons name="help-circle-outline" size={26} color="#f59e0b" />
          </View>
          <View style={styles.statInfoRow}>
            <Text style={styles.statLabel}>Thử thách</Text>
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
            <Text style={styles.statLabel}>Bài viết</Text>
            <View style={styles.statNumberGroup}>
              <Text style={styles.statNumber}>{stats.posts}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Leaderboard Chart Section */}
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Biểu đồ bảng xếp hạng</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
            onPress={() => { leaderboardRef.current?.scrollTo({ x: 0, animated: false }); setActiveTab('weekly'); }}
          >
            <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>Hàng ngày</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => { leaderboardRef.current?.scrollTo({ x: 0, animated: false }); setActiveTab('all'); }}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>Tất cả</Text>
          </TouchableOpacity>
        </View>
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
                  <Text style={styles.podiumName} numberOfLines={1}>{user.name || '---'}</Text>
                  <Text style={styles.podiumPoints}>{user.points || 0}đ</Text>
                </View>
                <View style={[styles.bar, { height: barHeight, backgroundColor: barColor }]}>
                  <Text style={styles.rankNum}>{rank}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
    marginBottom: 20,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
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
    marginBottom: 10,
  },
  statInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  statNumberGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
  },
  podiumContainer: {
    marginHorizontal: 16,
    paddingBottom: 0,
    marginBottom: 40,
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
  }
});

export default AdminDashboard;

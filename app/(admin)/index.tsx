import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

const AdminDashboard = () => {
  const adminModules = [
    {
      id: 'users',
      title: 'Người dùng',
      subtitle: 'Quản lý thành viên',
      icon: 'people',
      color: ['#4facfe', '#00f2fe'],
      route: '/(admin)/users',
      lib: Ionicons
    },
    {
      id: 'content',
      title: 'Nội dung',
      subtitle: 'Địa điểm & Bài học',
      icon: 'book-open-variant',
      color: ['#667eea', '#764ba2'],
      route: '/(admin)/content',
      lib: MaterialCommunityIcons
    },
    {
      id: 'challenges',
      title: 'Thử thách',
      subtitle: 'Quản lý câu hỏi',
      icon: 'trophy',
      color: ['#f6d365', '#fda085'],
      route: '/(admin)/challenges',
      lib: FontAwesome5
    },
    {
      id: 'trash',
      title: 'Thùng rác',
      subtitle: 'Khôi phục dữ liệu',
      icon: 'trash-can-outline',
      color: ['#ff0844', '#ffb199'],
      route: '/(admin)/trash',
      lib: MaterialCommunityIcons
    },
    {
      id: 'feedback',
      title: 'Phản hồi',
      subtitle: 'Ý kiến người dùng',
      icon: 'chatbubbles-outline',
      color: ['#43e97b', '#38f9d7'],
      route: '/(admin)/feedback',
      lib: Ionicons
    },
    {
      id: 'settings',
      title: 'Cài đặt hệ thống',
      subtitle: 'Cấu hình App',
      icon: 'settings-outline',
      color: ['#243949', '#517fa4'],
      route: '/(admin)/settings',
      lib: Ionicons
    }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, Quản trị viên!</Text>
        <Text style={styles.subGreeting}>Hôm nay bạn muốn quản lý nội dung nào?</Text>
      </View>

      <View style={styles.grid}>
        {adminModules.map((module) => {
          const IconLib = module.lib;
          return (
            <TouchableOpacity
              key={module.id}
              style={styles.cardWrapper}
              onPress={() => {
                // Tạm thời log ra nếu chưa có route
                console.log(`Navigating to ${module.route}`);
                // router.push(module.route);
              }}
            >
              <LinearGradient
                colors={module.color as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.iconContainer}>
                  <IconLib name={module.icon as any} size={32} color="white" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>{module.title}</Text>
                  <Text style={styles.cardSubtitle}>{module.subtitle}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity 
        style={styles.exitButton}
        onPress={() => router.replace('/(tabs)')}
      >
        <Ionicons name="exit-outline" size={20} color="#ef4444" />
        <Text style={styles.exitText}>Thoát chế độ Quản trị</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: COLUMN_WIDTH,
    marginBottom: 8,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    height: 180,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  exitButton: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fee2e2',
    gap: 8,
  },
  exitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ef4444',
  }
});

export default AdminDashboard;

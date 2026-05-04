import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLeaderboardUsers } from '@/services/firebase-service';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';


type MenuItem = {
  id: string;
  titleKey: string;
  icon: string;
  color?: string;
};

const menuItems: MenuItem[] = [
  { id: 'personal-info', titleKey: 'edit_profile', icon: 'person-outline' },
  { id: 'favorites', titleKey: 'favorites', icon: 'heart-outline' },
  { id: 'support', titleKey: 'support_feedback', icon: 'chatbubble-ellipses-outline' },
  { id: 'settings', titleKey: 'settings', icon: 'settings-outline' },
  { id: 'login', titleKey: 'login', icon: 'power-outline', color: '#0022ffff' },
  { id: 'logout', titleKey: 'logout_full', icon: 'power-outline', color: '#FF4D4D' },
];


export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [userRank, setUserRank] = useState<string | number>('---');
  const lastFetchTime = useRef<number>(0);

  const fetchRank = async (force = false) => {
    // Only fetch if forced or it's been more than 30 seconds
    const now = Date.now();
    if (!force && lastFetchTime.current && now - lastFetchTime.current < 30000) {
      return;
    }

    if (!user) {
      if (userRank !== '---') setUserRank('---');
      return;
    }
    try {
      const users = await getLeaderboardUsers(100);
      const index = users.findIndex(u => u.uid === user.uid);
      const newRank = index !== -1 ? index + 1 : '>100';
      if (newRank !== userRank) {
        setUserRank(newRank);
      }
      lastFetchTime.current = Date.now();
    } catch (error) {
      console.log('Error fetching rank:', error);
      if (userRank !== '---') setUserRank('---');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchRank();
    }, [user?.uid])
  );


  const handleLogout = () => {
    Alert.alert(t('confirm'), t('logout_confirm_msg'), [
      { text: t('back'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleMenuPress = (id: string) => {
    // Nếu chưa đăng nhập, chỉ cho phép nhấn vào 'login'
    if (!user && id !== 'login') {
      Alert.alert(
        t('login_required'),
        t('login_to_use'),
        [
          { text: t('back'), style: 'cancel' },
          { text: t('login'), onPress: () => router.push('/login') }
        ]
      );
      return;
    }

    if (id === 'logout') handleLogout();
    else if (id === 'login') router.push('/login');
    else if (id === 'personal-info') router.push('/(tabs)/personal-info');
    else if (id === 'support') router.push('/(tabs)/support');
    else if (id === 'settings') router.push('/(tabs)/settings');
  };


  // Lọc các menu item dựa trên trạng thái đăng nhập
  const filteredMenuItems = menuItems.filter(item => {
    if (item.id === 'logout') return !!user;
    if (item.id === 'login') return !user;
    return true;
  });


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('my_profile')}</Text>
      </View>


      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.springify().damping(20).duration(600)}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              {user?.avatar ?
                (
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                  <Ionicons name="person-circle-outline" size={115} color="#000000ff" />
                )}
            </View>

            {/* Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || t('guest')}</Text>
              <Text style={styles.profileEmail}>{user?.email || t('login_to_view')}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Menu List */}
        <View style={styles.menuList}>
          {filteredMenuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index < filteredMenuItems.length - 1 && styles.menuItemBorder,
                !user && item.id !== 'login' && { opacity: 0.5 }
              ]}
              onPress={() => handleMenuPress(item.id)}
              activeOpacity={0.6}
            >
              <Ionicons
                name={item.icon as any}
                size={22}
                color={item.color || '#555'}
                style={[
                  styles.menuIcon,
                  item.id === 'login' && { marginLeft: 3, marginRight: 12 }
                ]}
              />
              <Text style={[styles.menuTitle, item.color ? { color: item.color } : {}]}>
                {t(item.titleKey)}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={item.color || '#CCC'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 5,
    minHeight: 60,
  },

  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: '#ffffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginTextBtn: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#00CFA3',
    marginTop: 10,
    alignSelf: 'center',
  },


  loginTextBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffffff',
    lineHeight: 18,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000ff',
    lineHeight: 48,
    paddingVertical: 5,
    textAlign: 'center',
  },


  // Profile Card
  profileCard: {
    flexDirection: 'column', // Changed from row to center vertically
    alignItems: 'center',
    paddingHorizontal: 33,
    paddingTop: 0, // Increased top padding
    paddingBottom: 0, // Increased bottom padding
    gap: 15,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 115,
    height: 115,
    borderRadius: 60,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  profileInfo: {
    alignItems: 'center', // Center text horizontally
    gap: 0,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 5,
    lineHeight: 32,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 0,
    lineHeight: 20,
    textAlign: 'center',
  },


  // Menu
  menuList: {
    paddingHorizontal: 24,
    paddingTop: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    marginRight: 15,
    width: 24,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    lineHeight: 22,
  },
});

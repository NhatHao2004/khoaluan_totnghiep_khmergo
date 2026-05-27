import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLeaderboardUsers } from '@/services/firebase-service';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Image,
  Modal,
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
  { id: 'medal', titleKey: 'achievements', icon: 'ribbon-outline' },
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
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoginRequiredVisible, setLoginRequiredVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    setIsLoggingOut(true);
    await logout();
    router.replace({ pathname: '/(tabs)', params: { toast: 'logout_success' } });
  };

  const handleMenuPress = (id: string) => {
    // Nếu chưa đăng nhập, chỉ cho phép nhấn vào 'login'
    if (!user && id !== 'login') {
      setLoginRequiredVisible(true);
      return;
    }

    if (id === 'logout') handleLogout();
    else if (id === 'login') router.push('/login');
    else if (id === 'personal-info') router.push('/(tabs)/personal-info');
    else if (id === 'favorites') router.push('/(tabs)/favorites');
    else if (id === 'medal') router.push('/(tabs)/medal');
    else if (id === 'support') router.push('/(tabs)/support');
    else if (id === 'settings') router.push('/(tabs)/settings');
  };


  // Lọc các menu item dựa trên trạng thái đăng nhập
  const filteredMenuItems = menuItems.filter(item => {
    if (item.id === 'logout') return !!user && !isLoggingOut;
    if (item.id === 'login') return !user || isLoggingOut;
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
              <Text style={styles.profileName}>{(user && !isLoggingOut) ? user?.name : t('guest')}</Text>
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
                (!user || isLoggingOut) && item.id !== 'login' && { opacity: 0.5 }
              ]}
              onPress={() => handleMenuPress(item.id)}
              activeOpacity={0.6}
            >
              <Ionicons
                name={item.icon as any}
                size={22}
                color={((!user || isLoggingOut) && item.id !== 'login') ? '#94A3B8' : (item.color || '#555')}
                style={[
                  styles.menuIcon,
                  item.id === 'login' && { marginLeft: 3, marginRight: 12 }
                ]}
              />
              <Text style={[
                styles.menuTitle,
                ((!user || isLoggingOut) && item.id !== 'login') ? { color: '#94A3B8' } : (item.color ? { color: item.color } : {})
              ]}>
                {t(item.titleKey)}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={((!user || isLoggingOut) && item.id !== 'login') ? '#E2E8F0' : (item.color || '#CCC')}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Custom Login Modal */}
      <Modal
        visible={isLoginRequiredVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setLoginRequiredVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={styles.loginModalContent}>
            <View style={styles.loginModalIconCircle}>
              <Ionicons name="person-circle-outline" size={40} color="#3B82F6" />
            </View>
            <Text style={styles.loginModalTitle}>{t('login_required')}</Text>
            <Text style={styles.loginModalSub}>{t('login_to_use')}</Text>

            <View style={styles.loginModalActionRow}>
              <TouchableOpacity
                style={styles.loginModalPrimaryBtn}
                onPress={() => {
                  setLoginRequiredVisible(false);
                  router.push('/login');
                }}
              >
                <Text style={styles.loginModalPrimaryBtnText}>{t('login_title')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginModalSecondaryBtn}
                onPress={() => setLoginRequiredVisible(false)}
              >
                <Text style={styles.loginModalSecondaryBtnText}>{t('back')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Bottom Sheet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isLogoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
        statusBarTranslucent
      >
        <View
          style={styles.modalOverlay}
        >
          <View style={styles.logoutContent}>


            <View style={styles.logoutHeader}>
              <Text style={styles.logoutMsg}>{t('logout_confirm_msg')}</Text>
            </View>

            <View style={styles.logoutActionRow}>
              <TouchableOpacity
                style={styles.confirmLogoutBtn}
                onPress={confirmLogout}
              >
                <Text style={styles.confirmLogoutText}>{t('logout')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelLogoutBtn}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelLogoutText}>{t('back')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    lineHeight: 32,
    paddingVertical: 5,
    paddingRight: 5,
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
    paddingRight: 5,
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
    lineHeight: 23,
    paddingRight: 5,
  },

  // Logout Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  logoutContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingBottom: 40,
    paddingTop: 10,
    // Add shadow for white sheet
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 25,
  },
  logoutHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  logoutIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoutTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  logoutMsg: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  logoutActionRow: {
    gap: 12,
  },
  confirmLogoutBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLogoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 28, // Increased for VN accents
  },
  cancelLogoutBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#1877F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelLogoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 28,
  },

  // Login Required Modal (centered card)
  loginModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  loginModalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  loginModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginModalSub: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  loginModalActionRow: {
    width: '100%',
    gap: 12,
  },
  loginModalPrimaryBtn: {
    backgroundColor: '#3B82F6',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginModalPrimaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  loginModalSecondaryBtn: {
    backgroundColor: '#EF4444',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loginModalSecondaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

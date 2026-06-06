import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLeaderboardUsers } from '@/services/firebase-service';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from '@/utils/responsive';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { Easing, FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');


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

  // Animation for Logout Modal
  const logoutX = useSharedValue(SCREEN_WIDTH);

  React.useEffect(() => {
    if (isLogoutModalVisible) {
      logoutX.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.poly(4)),
      });
    } else {
      logoutX.value = SCREEN_WIDTH;
    }
  }, [isLogoutModalVisible]);

  const animatedLogoutStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: logoutX.value }]
  }));

  const fetchRank = async (force = false) => {
    if (!user || user.isAnonymous) {
      if (userRank !== 0) setUserRank(0);
      return;
    }

    const now = Date.now();
    if (!force && lastFetchTime.current && now - lastFetchTime.current < 30000) {
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
      setUserRank('---');
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
    const isGuest = !user || user.isAnonymous;
    // Nếu chưa đăng nhập (hoặc là khách), chỉ cho phép nhấn vào 'login' và một số mục công khai
    if (isGuest && id !== 'login') {
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
    const isGuest = !user || user.isAnonymous;
    if (item.id === 'logout') return !isGuest && !isLoggingOut;
    if (item.id === 'login') return isGuest || isLoggingOut;
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
                  <Ionicons name="person-circle-outline" size={scale(115)} color="#000000ff" />
                )}
            </View>

            {/* Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{(user && !user.isAnonymous && !isLoggingOut) ? user?.name : t('guest')}</Text>
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
                (!user || user.isAnonymous || isLoggingOut) && item.id !== 'login' && { opacity: 0.5 }
              ]}
              onPress={() => handleMenuPress(item.id)}
              activeOpacity={0.6}
            >
              <Ionicons
                name={item.icon as any}
                size={scale(22)}
                color={((!user || user.isAnonymous || isLoggingOut) && item.id !== 'login') ? '#94A3B8' : (item.color || '#555')}
                style={[
                  styles.menuIcon,
                  item.id === 'login' && { marginLeft: scale(3), marginRight: scale(12) }
                ]}
              />
              <Text style={[
                styles.menuTitle,
                ((!user || user.isAnonymous || isLoggingOut) && item.id !== 'login') ? { color: '#94A3B8' } : (item.color ? { color: item.color } : {})
              ]}>
                {t(item.titleKey)}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={scale(18)}
                color={((!user || user.isAnonymous || isLoggingOut) && item.id !== 'login') ? '#E2E8F0' : (item.color || '#CCC')}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: verticalScale(40) }} />
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

      <Modal
        animationType="fade"
        transparent={true}
        visible={isLogoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
        statusBarTranslucent
      >
        <View
          style={styles.modalOverlay}
        >
          <Animated.View style={[styles.logoutContent, animatedLogoutStyle]}>


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
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: verticalScale(40),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(20),
    paddingTop: 0,
    paddingBottom: verticalScale(5),
    minHeight: verticalScale(60),
  },

  notifBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(15),
    backgroundColor: '#ffffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginTextBtn: {
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(6),
    borderRadius: scale(15),
    backgroundColor: '#00CFA3',
    marginTop: verticalScale(10),
    alignSelf: 'center',
  },


  loginTextBtnLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#ffffffff',
    lineHeight: verticalScale(18),
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: '#000000ff',
    lineHeight: verticalScale(32),
    paddingVertical: verticalScale(5),
    paddingRight: scale(5),
    textAlign: 'center',
  },


  // Profile Card
  profileCard: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: scale(33),
    paddingTop: 0,
    paddingBottom: 0,
    gap: verticalScale(15),
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: scale(115),
    height: scale(115),
    borderRadius: scale(60),
  },
  cameraBtn: {
    position: 'absolute',
    bottom: verticalScale(2),
    right: scale(2),
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  profileInfo: {
    alignItems: 'center',
    gap: 0,
  },
  profileName: {
    fontSize: moderateScale(24),
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: verticalScale(5),
    lineHeight: verticalScale(32),
    paddingRight: scale(5),
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: moderateScale(14),
    color: '#666',
    marginBottom: 0,
    lineHeight: verticalScale(20),
    textAlign: 'center',
  },


  // Menu
  menuList: {
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(5),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(20),
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    marginRight: scale(15),
    width: scale(24),
  },
  menuTitle: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#1A1A1A',
    lineHeight: verticalScale(23),
    paddingRight: scale(5),
  },

  // Logout Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  logoutContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scale(30),
    borderTopRightRadius: scale(30),
    paddingHorizontal: scale(25),
    paddingBottom: verticalScale(40),
    paddingTop: verticalScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(-4) },
    shadowOpacity: 0.1,
    shadowRadius: scale(10),
    elevation: 20,
  },
  modalHandle: {
    width: scale(40),
    height: verticalScale(4),
    borderRadius: scale(2),
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: verticalScale(25),
  },
  logoutHeader: {
    alignItems: 'center',
    marginBottom: verticalScale(30),
    paddingTop: verticalScale(20),
  },
  logoutIconCircle: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  logoutTitle: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: '#FFF',
    marginBottom: verticalScale(8),
  },
  logoutMsg: {
    fontSize: moderateScale(16),
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: verticalScale(24),
    fontWeight: '500',
  },
  logoutActionRow: {
    gap: verticalScale(12),
  },
  confirmLogoutBtn: {
    height: verticalScale(56),
    borderRadius: scale(16),
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLogoutText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '800',
    lineHeight: verticalScale(28),
  },
  cancelLogoutBtn: {
    height: verticalScale(56),
    borderRadius: scale(16),
    backgroundColor: '#1877F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelLogoutText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '800',
    lineHeight: verticalScale(28),
  },

  // Login Required Modal (centered card)
  loginModalContent: {
    backgroundColor: '#FFF',
    borderRadius: scale(32),
    padding: scale(30),
    width: '100%',
    maxWidth: scale(340),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.1,
    shadowRadius: scale(20),
    elevation: 10,
  },
  loginModalIconCircle: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  loginModalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  loginModalSub: {
    fontSize: moderateScale(15),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: verticalScale(22),
    marginBottom: verticalScale(24),
  },
  loginModalActionRow: {
    width: '100%',
    gap: scale(12),
  },
  loginModalPrimaryBtn: {
    backgroundColor: '#3B82F6',
    height: verticalScale(56),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.2,
    shadowRadius: scale(8),
    elevation: 4,
  },
  loginModalPrimaryBtnText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
  loginModalSecondaryBtn: {
    backgroundColor: '#EF4444',
    height: verticalScale(56),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loginModalSecondaryBtnText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '800',
    lineHeight: verticalScale(28),
  },
});

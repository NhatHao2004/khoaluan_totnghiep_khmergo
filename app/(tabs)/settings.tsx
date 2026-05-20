import { AuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { scheduleDaily7AMReminder } from '@/utils/notification-handler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';

import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useContext(AuthContext);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showIntro, setShowIntro] = useState(false);

  // Load notification setting
  useEffect(() => {
    const loadSetting = async () => {
      const saved = await AsyncStorage.getItem('notifications_enabled');
      if (saved !== null) {
        setNotificationsEnabled(saved === 'true');
      }
    };
    loadSetting();
  }, []);

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', value.toString());

    if (value) {
      await scheduleDaily7AMReminder();
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const animatedTrackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      notificationsEnabled ? 1 : 0,
      [0, 1],
      ['#CCCCCC', '#FF4B4B']
    );
    return { backgroundColor };
  });

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withSpring(notificationsEnabled ? 20 : 0, { damping: 20 }) }],
    };
  });


  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('settings')}</Text>
        <View style={{ width: 25 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>


        {/* Ngôn ngữ */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('language')}</Text>
            <TouchableOpacity
              style={[styles.optionItem, language === 'vi' && styles.activeOption]}
              onPress={() => setLanguage('vi')}
            >
              <Text style={[styles.optionText, language === 'vi' && styles.activeOptionText]}>{t('vietnamese')}</Text>
              {language === 'vi' && <Ionicons name="checkmark-circle" size={20} color="#ff0000ff" />}
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={[styles.optionItem, language === 'km' && styles.activeOption]}
              onPress={() => setLanguage('km')}
            >
              <Text style={[styles.optionText, language === 'km' && styles.activeOptionText]}>{t('khmer')}</Text>
              {language === 'km' && <Ionicons name="checkmark-circle" size={20} color="#ff0000ff" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Thông báo */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('notif_settings')}</Text>
            <View style={styles.switchItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchSubLabel}>{t('study_reminder')}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toggleNotifications(!notificationsEnabled)}
              >
                <Animated.View style={[styles.customToggleTrack, animatedTrackStyle]}>
                  <Animated.View style={[styles.customToggleThumb, animatedThumbStyle]} />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Thông tin ứng dụng */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('app_info')}</Text>
            <TouchableOpacity style={styles.infoItem} onPress={() => setShowIntro(true)}>
              <Text style={styles.infoLabel}>{t('intro')}</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('version')}</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>


      <Modal
        visible={showIntro}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowIntro(false)}
      >
        <View style={styles.introOverlay}>
          <View style={styles.introContent}>
            <View style={styles.introHeader}>
              <Text style={styles.introTitle}>Giới thiệu ứng dụng</Text>
              <TouchableOpacity onPress={() => setShowIntro(false)} style={styles.introCloseBtn}>
                <Ionicons name="close" size={28} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.introScroll}>
              {/* App Identity */}
              <View style={styles.appIdentity}>
                <Image source={require('@/assets/images/icon.png')} style={styles.appLogo} />
                <Text style={styles.appName}>KhmerGo</Text>
                <Text style={styles.appVersionTag}>Phiên bản 1.0.0</Text>
              </View>

              <Text style={styles.appDesc}>
                Ứng dụng hỗ trợ nâng cao kiến thức về văn hóa người Khmer Nam Bộ.
              </Text>

              {/* Learning Goals */}
              <View style={styles.introSection}>
                <Text style={styles.introSectionTitle}>KhmerGo giúp người dùng tìm hiểu về:</Text>
                <Text style={styles.introBullet}>• Chùa Khmer</Text>
                <Text style={styles.introBullet}>• Lễ hội truyền thống</Text>
                <Text style={styles.introBullet}>• Ẩm thực Khmer</Text>
                <Text style={styles.introBullet}>• Nghệ thuật dân gia</Text>
                <Text style={styles.introBullet}>• Ngôn ngữ và chữ viết Khmer</Text>
              </View>

              {/* Objectives */}
              <View style={styles.introSection}>
                <Text style={styles.introSectionTitle}>Mục tiêu chung của ứng dụng:</Text>
                <Text style={styles.introItemText}>- Góp phần bảo tồn giá trị văn hóa Khmer Nam Bộ.</Text>
                <Text style={styles.introItemText}>- Hỗ trợ học tập và nghiên cứu.</Text>
                <Text style={styles.introItemText}>- Quảng bá văn hóa truyền thống đến cộng đồng.</Text>
              </View>

              {/* Team & Tech */}
              <View style={styles.introSection}>
                <View style={styles.introDetailRow}>
                  <Text style={styles.introSectionTitle}>Người phát triển: </Text>
                  <Text style={styles.introItemText}>Lâm Nhật Hào</Text>
                </View>
                <View style={[styles.introDetailRow, { marginTop: 0 }]}>
                  <Text style={styles.introSectionTitle}>Công nghệ sử dụng: </Text>
                  <Text style={styles.introItemText}>React Native, Expo, Firebase</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  backBtn: {
    width: 25,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingBottom: 5,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    // Elevation for Android
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000ff',
    paddingTop: 15,
    paddingBottom: 5,
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 55, // Fixed height for visual stability
  },
  optionText: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
    lineHeight: 22,
  },
  activeOption: {
    // optional active styling
  },
  activeOptionText: {
    color: '#1A1A1A',
    fontWeight: '600',
    lineHeight: 22,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52, // Fixed height for visual stability
  },
  switchLabel: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '700',
    lineHeight: 22,
  },
  switchSubLabel: {
    fontSize: 15,
    color: '#000000ff',
    marginTop: 2,
  },
  customToggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  customToggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeText: {
    fontSize: 14,
    color: '#ffffffff',
    fontWeight: '700',
    lineHeight: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 55, // Fixed height for visual stability
  },
  infoLabel: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
    lineHeight: 22,
  },
  infoValue: {
    fontSize: 14,
    color: '#000000ff',
    fontWeight: '500',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  // Intro Modal Styles
  introOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  introContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    width: '100%',
    maxHeight: '90%',
  },
  introHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  introCloseBtn: {
    padding: 5,
  },
  introScroll: {
    paddingBottom: 20,
  },
  appIdentity: {
    alignItems: 'center',
    marginBottom: 15,
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 12,
  },
  appName: {
    fontSize: 25,
    fontWeight: '900',
    color: '#000000ff',
    marginBottom: 4,
  },
  appVersionTag: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  appDesc: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 25,
    fontStyle: 'italic',
  },
  introSection: {
    marginBottom: 20,
  },
  introSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  introDetailRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  introBullet: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
    paddingLeft: 10,
  },
  introItemText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  introRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 5,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    marginVertical: 20,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  copyright: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
  }
});

import { AuthContext } from '@/contexts/AuthContext';
import { translations, useLanguage } from '@/contexts/LanguageContext';
import { scale, verticalScale, moderateScale } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';

import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useContext(AuthContext);
  const [chatButtonEnabled, setChatButtonEnabled] = useState(true);
  const [showIntro, setShowIntro] = useState(false);

  // Toast States
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const toastY = useSharedValue(-120);

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    toastY.value = withTiming(Platform.OS === 'ios' ? 50 : 40, { duration: 400 });

    setTimeout(() => {
      toastY.value = withTiming(-120, { duration: 400 });
      setTimeout(() => setShowToast(false), 400);
    }, 4000);
  };

  // Load chat button setting
  useEffect(() => {
    const loadSetting = async () => {
      const savedChat = await AsyncStorage.getItem('chat_button_enabled');
      if (savedChat !== null) {
        setChatButtonEnabled(savedChat === 'true');
      }
    };
    loadSetting();
  }, []);

  const toggleChatButton = async (value: boolean) => {
    setChatButtonEnabled(value);
    await AsyncStorage.setItem('chat_button_enabled', value.toString());
    triggerToast(value ? t('chat_on') : t('chat_off'), 'success');
  };

  const chatToggleAnim = useSharedValue(chatButtonEnabled ? 1 : 0);

  useEffect(() => {
    chatToggleAnim.value = withTiming(chatButtonEnabled ? 1 : 0, { duration: 250 });
  }, [chatButtonEnabled]);

  const animatedChatTrackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      chatToggleAnim.value,
      [0, 1],
      ['#CCCCCC', '#FF4B4B']
    );
    return { backgroundColor };
  });

  const animatedChatThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: chatToggleAnim.value * scale(20) }],
    };
  });

  const animatedToastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
    opacity: interpolate(toastY.value, [-100, 40], [0, 1], 'clamp'),
  }));


  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scale(26)} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('settings')}</Text>
        <View style={{ width: scale(25) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>


        {/* Ngôn ngữ */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('language')}</Text>
            <TouchableOpacity
              style={[styles.optionItem, language === 'vi' && styles.activeOption]}
              onPress={() => {
                setLanguage('vi');
                triggerToast(translations.vi.lang_changed_vi, 'success');
              }}
            >
              <Text style={[styles.optionText, language === 'vi' && styles.activeOptionText]}>{t('vietnamese')}</Text>
              <Ionicons
                name={language === 'vi' ? "checkmark-circle" : "ellipse-outline"}
                size={scale(22)}
                color={language === 'vi' ? "#FF4B4B" : "#CCCCCC"}
              />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={[styles.optionItem, language === 'km' && styles.activeOption]}
              onPress={() => {
                setLanguage('km');
                triggerToast(translations.km.lang_changed_km, 'success');
              }}
            >
              <Text style={[styles.optionText, language === 'km' && styles.activeOptionText]}>{t('khmer')}</Text>
              <Ionicons
                name={language === 'km' ? "checkmark-circle" : "ellipse-outline"}
                size={scale(22)}
                color={language === 'km' ? "#FF4B4B" : "#CCCCCC"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Thông tin ứng dụng */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('app_info')}</Text>
            <TouchableOpacity style={styles.infoItem} onPress={() => setShowIntro(true)}>
              <Text style={styles.infoLabel}>{t('intro')}</Text>
              <Ionicons name="chevron-forward" size={scale(18)} color="#CCC" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('version')}</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={{ height: verticalScale(40) }} />
      </ScrollView>


      <Modal
        visible={showIntro}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setShowIntro(false)}
      >
        <View style={styles.introOverlay}>
          <View style={styles.introContent}>
            <View style={styles.introHeader}>
              <Text style={styles.introTitle}>Giới thiệu ứng dụng</Text>
              <TouchableOpacity onPress={() => setShowIntro(false)} style={styles.introCloseBtn}>
                <Ionicons name="close" size={scale(28)} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.introScroll} showsVerticalScrollIndicator={false}>

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
                <Text style={styles.introBullet}>• Ngôi chùa Khmer</Text>
                <Text style={styles.introBullet}>• Văn hóa Khmer</Text>
                <Text style={styles.introBullet}>• Ẩm thực Khmer</Text>
                <Text style={styles.introBullet}>• Học tiếng Khmer</Text>
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
                <View style={[styles.introDetailRow, { marginTop: 0 }]}>
                  <Text style={styles.introSectionTitle}>Công nghệ sử dụng: </Text>
                  <Text style={styles.introItemText}>React Native, Expo, Firebase</Text>
                </View>
                <View style={styles.introDetailRow}>
                  <Text style={styles.introSectionTitle}>Người phát triển: </Text>
                  <Text style={styles.introItemText}>Lâm Nhật Hào</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Premium Toast System */}
      {showToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            animatedToastStyle,
            {
              backgroundColor: toastType === 'success' || toastType === 'info' ? '#10B981' : '#EF4444',
              shadowColor: toastType === 'success' || toastType === 'info' ? '#10B981' : '#EF4444',
            }
          ]}
        >
          <View style={styles.toastIcon}>
            <Ionicons
              name={toastType === 'success' ? "checkmark" : "close"}
              size={scale(20)}
              color="#FFF"
            />
          </View>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}

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
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(50),
    paddingBottom: verticalScale(10),
    minHeight: verticalScale(100), // Fixed height for visual stability
    backgroundColor: '#ffffff',
  },
  backBtn: {
    width: scale(25),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: verticalScale(28),
  },
  scroll: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
  },
  section: {
    marginBottom: verticalScale(20),
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: scale(16),
    paddingHorizontal: scale(15),
    paddingBottom: verticalScale(5),
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.05,
    shadowRadius: scale(10),
    // Elevation for Android
    elevation: 2,
  },
  cardTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#000000ff',
    paddingTop: verticalScale(15),
    paddingBottom: verticalScale(5),
    letterSpacing: 0.5,
    lineHeight: verticalScale(22),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: verticalScale(60), // Minimum height for visual stability
  },
  optionText: {
    fontSize: moderateScale(15),
    color: '#444',
    fontWeight: '500',
    lineHeight: verticalScale(24),
  },
  activeOption: {
    // optional active styling
  },
  activeOptionText: {
    color: '#1A1A1A',
    fontWeight: '600',
    lineHeight: verticalScale(24),
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: verticalScale(60), // Minimum height for visual stability
  },
  switchLabel: {
    fontSize: moderateScale(15),
    color: '#1E293B',
    fontWeight: '700',
    lineHeight: verticalScale(24),
  },
  switchSubLabel: {
    fontSize: moderateScale(15),
    color: '#000000ff',
    marginTop: verticalScale(2),
    lineHeight: verticalScale(24),
  },
  customToggleTrack: {
    width: scale(48),
    height: verticalScale(28),
    borderRadius: scale(14),
    padding: scale(3),
    justifyContent: 'center',
  },
  customToggleThumb: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(1) },
    shadowOpacity: 0.1,
    shadowRadius: scale(2),
    elevation: 2,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000ff',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
  },
  timeText: {
    fontSize: moderateScale(14),
    color: '#ffffffff',
    fontWeight: '700',
    lineHeight: verticalScale(20),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: verticalScale(55), // Fixed height for visual stability
  },
  infoLabel: {
    fontSize: moderateScale(15),
    color: '#444',
    fontWeight: '500',
    lineHeight: verticalScale(22),
  },
  infoValue: {
    fontSize: moderateScale(14),
    color: '#000000ff',
    fontWeight: '500',
    lineHeight: verticalScale(20),
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
    borderTopLeftRadius: scale(32),
    borderTopRightRadius: scale(32),
    paddingTop: verticalScale(20),
    paddingHorizontal: scale(24),
    paddingBottom: 0,
    width: '100%',
    maxHeight: '79%',
  },
  introHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(25),
    paddingHorizontal: scale(5),
  },
  introTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#1A1A1A',
  },
  introCloseBtn: {
    padding: scale(5),
  },
  introScroll: {
    // ScrollView inside modal
  },
  appIdentity: {
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  appLogo: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(20),
    marginBottom: verticalScale(12),
  },
  appName: {
    fontSize: moderateScale(25),
    fontWeight: '900',
    color: '#000000ff',
    marginBottom: verticalScale(4),
  },
  appVersionTag: {
    fontSize: moderateScale(13),
    color: '#64748B',
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: scale(20),
  },
  appDesc: {
    fontSize: moderateScale(15),
    lineHeight: verticalScale(24),
    color: '#475569',
    textAlign: 'center',
    marginBottom: verticalScale(15),
    fontStyle: 'italic',
  },
  introSection: {
    marginBottom: verticalScale(8),
  },
  introSectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: verticalScale(4),
  },
  introDetailRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: verticalScale(4),
  },
  introBullet: {
    fontSize: moderateScale(14),
    color: '#475569',
    marginBottom: verticalScale(4),
    paddingLeft: scale(10),
  },
  introItemText: {
    fontSize: moderateScale(14),
    color: '#475569',
    lineHeight: verticalScale(20),
    marginBottom: verticalScale(4),
  },
  introRow: {
    flexDirection: 'row',
    gap: scale(20),
    marginBottom: verticalScale(4),
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: scale(20),
    padding: scale(20),
    marginVertical: verticalScale(20),
  },
  actionItem: {
    alignItems: 'center',
    gap: scale(8),
  },
  actionIcon: {
    width: scale(45),
    height: scale(45),
    borderRadius: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  copyright: {
    fontSize: moderateScale(12),
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: verticalScale(15),
  },
  // Toast Styles
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: scale(20),
    right: scale(20),
    height: verticalScale(56),
    borderRadius: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.3,
    shadowRadius: scale(20),
    elevation: 10,
  },
  toastIcon: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    color: '#FFF',
    fontSize: moderateScale(15),
    fontWeight: '700',
    marginLeft: scale(12),
    flex: 1,
    letterSpacing: 0.2,
  },
});

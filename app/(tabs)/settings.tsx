import { AuthContext } from '@/contexts/AuthContext';
import { translations, useLanguage } from '@/contexts/LanguageContext';
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
      transform: [{ translateX: chatToggleAnim.value * 20 }],
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
              onPress={() => {
                setLanguage('vi');
                triggerToast(translations.vi.lang_changed_vi, 'success');
              }}
            >
              <Text style={[styles.optionText, language === 'vi' && styles.activeOptionText]}>{t('vietnamese')}</Text>
              <Ionicons
                name={language === 'vi' ? "checkmark-circle" : "ellipse-outline"}
                size={22}
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
                size={22}
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
        statusBarTranslucent={true}
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

            <View style={styles.introScroll}>

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
            </View>
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
              size={20}
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    minHeight: 100, // Fixed height for visual stability
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
    lineHeight: 28,
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
    lineHeight: 22,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60, // Minimum height for visual stability
  },
  optionText: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
    lineHeight: 24,
  },
  activeOption: {
    // optional active styling
  },
  activeOptionText: {
    color: '#1A1A1A',
    fontWeight: '600',
    lineHeight: 24,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60, // Minimum height for visual stability
  },
  switchLabel: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '700',
    lineHeight: 24,
  },
  switchSubLabel: {
    fontSize: 15,
    color: '#000000ff',
    marginTop: 2,
    lineHeight: 24,
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
    paddingBottom: 0,
    width: '100%',
    maxHeight: '79%',
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
    marginBottom: 15,
    fontStyle: 'italic',
  },
  introSection: {
    marginBottom: 8,
  },
  introSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
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
    marginBottom: 4,
  },
  introRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 4,
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
    marginTop: 15,
  },
  // Toast Styles
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  toastIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
    letterSpacing: 0.2,
  },
});

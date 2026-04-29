import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Animation for the notification bell
  const bellRotation = useSharedValue(0);

  useEffect(() => {
    bellRotation.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 100 }),
        withTiming(12, { duration: 100 }),
        withTiming(-12, { duration: 100 }),
        withTiming(12, { duration: 100 }),
        withTiming(0, { duration: 100 }),
        withDelay(2000, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );
  }, []);

  const animatedBellStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${bellRotation.value}deg` }],
    };
  });

  const services = [
    { id: 1, label: t('temple'), icon: require('@/assets/images/pagoda.jpg'), color: '#FF7000', route: '/(tabs)/index' },
    { id: 3, label: t('culture'), icon: require('@/assets/images/festival.jpg'), color: '#A000FF', route: '/(tabs)/index' },
    { id: 2, label: t('food'), icon: require('@/assets/images/amthuc.jpg'), color: '#FF0050', route: '/(tabs)/index' },
    { id: 4, label: t('language_study'), icon: require('@/assets/images/hoctap.jpg'), color: '#00C850', route: '/(tabs)/index' },
  ];

  const featuredDestinations = [
    {
      id: 1,
      name: t('som_rong_temple'),
      price: '4.8 ★',
      tag: t('temple'),
      image: require('@/assets/images/pagoda.jpg'),
      accent: '#FF7A00'
    },
    {
      id: 2,
      name: 'Bún Nước Lèo',
      price: '5.0 ★',
      tag: t('food'),
      image: require('@/assets/images/amthuc.jpg'),
      accent: '#3B82F6'
    }
  ];

  const handleCategoryPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown} style={styles.header}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile' as any)}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-circle-outline" size={40} color="#000000ff" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.welcomeText}>
            <ThemedText style={styles.helloText}>Chào mừng bạn 👋</ThemedText>
            <ThemedText style={styles.userName}>{user?.name || t('guest')}</ThemedText>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notificationBtnSimple}
          onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
        >
          <Animated.View style={animatedBellStyle}>
            <Ionicons name="notifications-outline" size={30} color="#000" />
            <View style={styles.notificationBadge}>
              <ThemedText style={styles.badgeText}>2</ThemedText>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Promo Banner */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.promoBanner}>
          <Image
            source={require('@/assets/images/banner.png')}
            style={styles.promoImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Categories Grid */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Danh mục khám phá</ThemedText>
        </View>

        <View style={styles.gridContainer}>
          {services.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(400 + index * 100)}
              style={styles.gridItemQuarter}
            >
              <TouchableOpacity
                onPress={() => handleCategoryPress(item.route)}
                style={styles.serviceCardMini}
              >
                {/* Custom Border Layer */}
                <View style={styles.cardOutline} />
                <View style={styles.notchShield} />
                <View style={[styles.sideActionMini, { backgroundColor: '#F8FAFC' }]} />
                <View style={styles.outsideMask} />
                <View style={styles.iconGlassMini}>
                  <Image source={item.icon} style={styles.serviceIconImage} />
                </View>
                <ThemedText style={styles.serviceLabelMini} numberOfLines={2}>{item.label}</ThemedText>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Featured List */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Gợi ý cho bạn</ThemedText>
          <TouchableOpacity>
            <ThemedText style={styles.viewAllText}>{t('view_all')}</ThemedText>
          </TouchableOpacity>
        </View>

        {featuredDestinations.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInRight.delay(600 + index * 100)}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={styles.imageContainer}>
                <Image source={item.image} style={styles.cardAvatar} />
                <View style={[styles.statusDot, { backgroundColor: item.accent }]} />
              </View>
              <View style={styles.cardInfo}>
                <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <ThemedText style={styles.cardPrice}>{item.price}</ThemedText>
                </View>
              </View>
              <View style={[styles.tag, { backgroundColor: item.accent + '20' }]}>
                <ThemedText style={[styles.tagText, { color: item.accent }]}>{item.tag}</ThemedText>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <Ionicons name="map-outline" size={18} color="#666" />
                <ThemedText style={styles.secondaryBtnText}>Vị trí</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: item.accent }]}
                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
              >
                <ThemedText style={styles.primaryBtnText}>Đặt chỗ ngay</ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  welcomeText: {
    justifyContent: 'center',
  },
  helloText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  headerActionBtn: {
    width: 52,
    height: 52,
    backgroundColor: '#FFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  notificationBtnSimple: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    zIndex: 99,
    elevation: 5,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 14,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 20,
  },
  searchBox: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  filterBtn: {
    width: 58,
    height: 58,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  content: {
    flex: 1,
  },
  promoBanner: {
    marginHorizontal: 24,
    height: 170,
    backgroundColor: '#DBEAFE',
    borderRadius: 28,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  promoLeft: {
    flex: 1.3,
    padding: 24,
    justifyContent: 'center',
    zIndex: 2,
  },
  promoOff: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 18,
    lineHeight: 24,
  },
  bookBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bookBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  promoImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E293B',
    lineHeight: 22,
    paddingBottom: 0,
  },
  viewAllText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  gridItemQuarter: {
    width: '25%',
    padding: 5,
  },
  serviceCardMini: {
    height: 100,
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#FFF',
    overflow: 'visible',
  },
  cardOutline: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    zIndex: 1,
  },
  iconGlassMini: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceIconImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  serviceLabelMini: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 10,
  },
  sideActionMini: {
    position: 'absolute',
    right: -15,
    top: '50%',
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    zIndex: 20,
  },
  notchShield: {
    position: 'absolute',
    right: -1,
    top: '50%',
    marginTop: -14,
    width: 5,
    height: 28,
    backgroundColor: '#F8FAFC',
    zIndex: 15,
  },
  outsideMask: {
    position: 'absolute',
    right: -30,
    top: '50%',
    marginTop: -20,
    width: 30,
    height: 40,
    backgroundColor: '#F8FAFC',
    zIndex: 25,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#FFF',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    textAlign: 'center',
    marginTop: 2,
  },
  card: {
    marginHorizontal: 24,
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
  },
  cardAvatar: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardPrice: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '800',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 14,
  },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  primaryBtn: {
    flex: 1.4,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
  },
});

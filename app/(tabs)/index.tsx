import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const DEST_METADATA = [
    {
      id: 1,
      title: 'Chùa Âng',
      locationKey: 'nguyet_hoa_vinh_long',
      image: require('@/assets/images/chuaang.jpg'),
      route: '/pagoda'
    },
    {
      id: 2,
      title: 'Lễ hội Oóc Om Bóc',
      locationKey: 'oc_om_boc_time',
      image: require('@/assets/images/lehoi.jpg'),
      route: '/(tabs)/index'
    },
    {
      id: 3,
      title: 'Bún Nước Lèo',
      locationKey: 'bun_nuoc_leo_desc',
      image: require('@/assets/images/cuisine.jpg'),
      route: '/(tabs)/index'
    }
  ];

  const [reviewsData, setReviewsData] = useState<Record<number, number>>({});

  // Animation for the notification bell
  const bellRotation = useSharedValue(0);

  useEffect(() => {
    // Lắng nghe thay đổi reviews từ Firestore cho các địa điểm
    const q = query(collection(db, 'destinations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData: Record<number, number> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        liveData[data.id] = data.reviews || 0;
      });
      setReviewsData(liveData);
    });

    return () => unsubscribe();
  }, []);

  const featuredDestinations = useMemo(() => {
    return DEST_METADATA.map(item => ({
      ...item,
      location: t(item.locationKey),
      reviews: reviewsData[item.id] || 0
    }));
  }, [language, reviewsData, t]);

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
    { id: 1, label: t('temple'), icon: require('@/assets/images/pagoda.jpg'), color: '#FF7000', route: '/(tabs)/pagoda' },
    { id: 3, label: t('culture'), icon: require('@/assets/images/festival.jpg'), color: '#A000FF', route: '/(tabs)/culture' },
    { id: 2, label: t('food'), icon: require('@/assets/images/amthuc.jpg'), color: '#FF0050', route: '/(tabs)/food' },
    { id: 4, label: t('language_study'), icon: require('@/assets/images/hoctap.jpg'), color: '#00C850', route: '/(tabs)/language_study' },
  ];



  const toggleFavorite = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleCategoryPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile' as any)}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-circle-outline" size={53} color="#000000ff" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.welcomeText}>
            <ThemedText style={styles.helloText}>{t('welcome_hello')}</ThemedText>
            <ThemedText style={styles.userName} numberOfLines={1}>{user?.name || t('guest')}</ThemedText>
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
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0 }}
      >
        {/* Promo Banner */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.promoBanner}>
          <Image
            source={require('@/assets/images/banner.png')}
            style={styles.promoImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Categories Grid */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{t('explore_categories')}</ThemedText>
        </Animated.View>

        <View style={styles.gridContainer}>
          {services.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(400 + index * 50).springify()}
              style={styles.gridItemQuarter}
            >
              <TouchableOpacity
                onPress={() => handleCategoryPress(item.route)}
                style={styles.serviceCardMini}
              >
                <View style={styles.iconGlassMini}>
                  <Image source={item.icon} style={styles.serviceIconImage} />
                </View>
                <ThemedText style={styles.serviceLabelMini} numberOfLines={2}>{item.label}</ThemedText>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Featured List */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { flex: 1 }]}>{t('suggestions_for_you')}</ThemedText>
          <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <ThemedText style={styles.viewAllText}>{t('see_all')}</ThemedText>
          </TouchableOpacity>
        </Animated.View>

        {featuredDestinations.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInRight.delay(600 + index * 100).springify()}
            style={styles.featuredCard}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleCategoryPress(item.route)}
            >
              <View style={styles.cardImageContainer}>
                <Image source={item.image} style={styles.cardImage} />
                <View style={styles.cardOverlay}>
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                  >
                    <Ionicons
                      name={favorites.includes(item.id) ? "heart" : "heart-outline"}
                      size={25}
                      color={favorites.includes(item.id) ? "#ff0000ff" : "#000000ff"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <ThemedText style={styles.cardTitle} numberOfLines={1}>{item.title}</ThemedText>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.locationInfo}>
                    <ThemedText style={styles.locationText}>{item.location}</ThemedText>
                  </View>
                  {(item.reviews ?? 0) > 0 && (
                    <View style={styles.reviewInfo}>
                      <ThemedText style={styles.reviewText}>{item.reviews} {t('reviews_label')}</ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    width: 50,
    height: 50,
    borderRadius: 26, // Half of 52 to make it a circle
    backgroundColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25, // Half of 52 to make it a circle
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
    paddingHorizontal: 20,
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
    fontSize: 13,
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
    height: 105,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
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
    fontSize: 8.5,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 11,
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
  featuredCard: {
    marginHorizontal: 25,
    backgroundColor: '#FFF',
    borderRadius: 28,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  cardImageContainer: {
    height: 180,
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heartBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    flex: 1,
    marginRight: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  reviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
  },
});

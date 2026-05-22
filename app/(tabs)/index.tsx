import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { MOCK_NOTIFICATIONS } from '@/utils/notification-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [featuredDestinations, setFeaturedDestinations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [routeIndex, setRouteIndex] = useState(0);
  const [indexLoading, setIndexLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Slide animation for notifications
  const slideX = useSharedValue(width);
  const scrollY = useSharedValue(0);



  // Animation for the notification bell
  const bellRotation = useSharedValue(0);

  // Helper functions to get local images if needed
  const getAppImage = (item: any) => {
    const { id, name, category, imageUrl } = item;
    if (imageUrl && imageUrl.startsWith('http')) return { uri: imageUrl };

    // Fallback logic by category
    if (category === 'Chùa') {
      const pagodaImages: any = {
        'pagoda_1': require('@/assets/images/chuaang.jpg'),
        'pagoda_2': require('@/assets/images/chuahang.jpg'),
        'pagoda_3': require('@/assets/images/kampong.jpg'),
        'pagoda_4': require('@/assets/images/salengcu.jpg'),
        'pagoda_5': require('@/assets/images/veluvana.jpg'),
      };
      return pagodaImages[id] || require('@/assets/images/pagoda.jpg');
    }
    if (category === 'Văn hóa') return require('@/assets/images/lehoi.jpg');
    if (category === 'Ẩm thực') return require('@/assets/images/amthuc.jpg');
    return require('@/assets/images/pagoda.jpg');
  };

  const loadFeaturedData = () => {
    setIsLoading(true);
    const q = query(collection(db, 'destinations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allItems = snapshot.docs.map(doc => {
        const data = doc.data();
        let detailRoute = '/(tabs)/index';
        if (data.category === 'Chùa') detailRoute = '/pagoda-detail';
        else if (data.category === 'Văn hóa') detailRoute = '/culture-detail';
        else if (data.category === 'Ẩm thực') detailRoute = '/food-detail';

        return {
          ...data,
          id_num: data.id,
          category: data.category,
          image: getAppImage(data),
          route: {
            pathname: detailRoute,
            params: {
              id: data.id,
              name: data.name,
              location: data.location,
              description: data.description,
              imageUrl: data.imageUrl,
              source: data.category === 'Chùa' ? 'pagoda' : data.category === 'Văn hóa' ? 'culture' : 'food',
            }
          }
        };
      });

      // Group by category
      const pagodas = allItems.filter(i => i.category === 'Chùa');
      const cultures = allItems.filter(i => i.category === 'Văn hóa');
      const foods = allItems.filter(i => i.category === 'Ẩm thực');

      // Randomly pick one from each category
      const featured: any[] = [];
      if (pagodas.length > 0) featured.push(pagodas[Math.floor(Math.random() * pagodas.length)]);
      if (cultures.length > 0) featured.push(cultures[Math.floor(Math.random() * cultures.length)]);
      if (foods.length > 0) featured.push(foods[Math.floor(Math.random() * foods.length)]);

      setFeaturedDestinations(featured);
      setIsLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error("Firestore Error in loadFeaturedData:", error);
      setIsLoading(false);
      setRefreshing(false);
    });
    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = loadFeaturedData();
    return () => unsubscribe();
  }, [language, t]);

  const onRefresh = React.useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    loadFeaturedData();
  }, [language, t, refreshing]);

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

  // Real-time Notifications Listener
  useEffect(() => {
    if (!user) return;
    const { query, collection, where, orderBy, onSnapshot } = require('firebase/firestore');
    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const nData = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Vừa xong'
      }));
      setNotifications(nData);
      setUnreadCount(nData.filter((n: any) => !n.isRead).length);
    });

    return () => unsubscribe();
  }, [user]);

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    const { writeBatch, doc } = require('firebase/firestore');
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.isRead) {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      }
    });
    await batch.commit();
  };

  const animatedBellStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${bellRotation.value}deg` }],
    };
  });

  const animatedSlideStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: slideX.value }],
    };
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteNotification = async (id: string) => {
    if (!user) return;
    const { doc, deleteDoc } = require('firebase/firestore');
    try {
      await deleteDoc(doc(db, 'notifications', id));
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const closeNotifications = () => {
    setDeletingId(null); // Reset trạng thái xóa khi đóng
    slideX.value = withTiming(width, { duration: 300 });
    setTimeout(() => setShowNotifications(false), 300);
  };

  const services = [
    { id: 1, label: t('temple'), icon: require('@/assets/images/pagoda.jpg'), color: '#FF7000', route: '/pagoda' },
    { id: 3, label: t('culture'), icon: require('@/assets/images/festival.jpg'), color: '#A000FF', route: '/culture' },
    { id: 2, label: t('food'), icon: require('@/assets/images/amthuc.jpg'), color: '#FF0050', route: '/food' },
    { id: 4, label: t('language_study'), icon: require('@/assets/images/hoctap.jpg'), color: '#00C850', route: '/language_study' },
    { id: 5, label: t('ai_camera'), icon: require('@/assets/images/ai_camera.png'), color: '#1877F2', route: '/ai-camera' },
  ];

  const toggleFavorite = (id: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleCategoryPress = (route: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile' as any)}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar as string }} style={styles.avatar} />
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
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowNotifications(true);
            markAllAsRead(); // Đánh dấu đã đọc khi mở bảng thông báo
            slideX.value = withTiming(0, { duration: 300 });
          }}
        >
          <Animated.View style={animatedBellStyle}>
            <Ionicons name="notifications-outline" size={30} color="#000" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>


      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 2 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={50}
            colors={['#FF0050']}
            tintColor="#FF0050"
          />
        }
      >
        {/* Promo Banner */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.promoBanner}>
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

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.scrollGridContainer}
        >
          {services.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(400 + index * 50).springify()}
              style={styles.gridItemScroll}
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
        </ScrollView>

        {/* Featured List Header */}
        <Animated.View entering={FadeInDown.delay(500)} style={[styles.sectionHeader, { paddingBottom: 10 }]}>
          <ThemedText style={[styles.sectionTitle, { flex: 1, marginRight: 10 }]} numberOfLines={1}>
            {t('suggestions_for_you')}
          </ThemedText>
          <TouchableOpacity
            style={{ flexShrink: 0 }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const cyclicRoutes: any[] = ['/pagoda', '/culture', '/food'];
              const route = cyclicRoutes[routeIndex % cyclicRoutes.length];
              setRouteIndex(prev => prev + 1);
              router.push(route);
            }}
          >
            <ThemedText style={styles.viewAllText} numberOfLines={1}>{t('see_all')}</ThemedText>
          </TouchableOpacity>
        </Animated.View>

        {isLoading && !refreshing ? (
          <View style={styles.featuredLoader}>
            <ActivityIndicator size="large" color="#FF0050" />
          </View>
        ) : (
          featuredDestinations.map((item, index) => (
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
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardHeaderRow}>
                    <ThemedText style={styles.cardTitle} numberOfLines={1}>
                      {language === 'km' ? (item.name_khmer || item.name || item.title) : (item.name || item.title)}
                    </ThemedText>
                  </View>

                  <View style={styles.cardFooter}>
                    {(item.reviews ?? 0) > 0 && (
                      <View style={styles.reviewInfo}>
                        <ThemedText style={styles.reviewText}>{item.reviews} {t('reviews_label')}</ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Notification Center Modal */}
      <Modal
        visible={showNotifications}
        animationType="none"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={closeNotifications}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeNotifications}
        >
          <Animated.View style={[styles.notificationContainer, animatedSlideStyle]}>
            <View style={styles.nHeader}>
              <Text style={styles.nTitle}>Thông báo</Text>
            </View>

            <ScrollView 
              style={styles.nList} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={notifications.length === 0 ? { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 } : { paddingBottom: 20 }}
            >
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.nItem, !item.isRead && { backgroundColor: '#F0F9FF' }]}
                    onLongPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setDeletingId(item.id);
                    }}
                    onPress={async () => {
                      if (deletingId) {
                        setDeletingId(null);
                        return;
                      }
                      // Đánh dấu đã đọc
                      if (!item.isRead) {
                        const { doc, updateDoc } = require('firebase/firestore');
                        await updateDoc(doc(db, 'notifications', item.id), { isRead: true });
                      }
                      
                      closeNotifications();
                      
                      // Chuyển hướng sang Community
                      if (item.postId) {
                        if (item.type === 'like') {
                          // Nếu là Like: Chỉ sang Community xem bài viết
                          router.push('/(tabs)/community' as any);
                        } else {
                          // Nếu là Comment/Reply: Sang Community và mở Modal
                          router.push({
                            pathname: '/(tabs)/community',
                            params: { openPostId: item.postId }
                          } as any);
                        }
                      } else {
                        router.push('/(tabs)/community' as any);
                      }
                    }}
                  >
                    <View style={[
                      styles.nIcon, 
                      { backgroundColor: item.type === 'reply' ? '#E0F2FE' : item.type === 'quiz' ? '#FEF3C7' : item.type === 'like' ? '#FEE2E2' : '#F0FDF4' }
                    ]}>
                      <Ionicons
                        name={item.type === 'reply' ? 'chatbubble-ellipses-outline' : item.type === 'quiz' ? 'game-controller-outline' : item.type === 'like' ? 'heart-outline' : 'notifications-outline'}
                        size={20}
                        color={item.type === 'reply' ? '#007AFF' : item.type === 'quiz' ? '#D97706' : item.type === 'like' ? '#EF4444' : '#10B981'}
                      />
                    </View>
                    <View style={styles.nContent}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={styles.nItemTitle} numberOfLines={2}>
                            <Text style={{ fontWeight: '800' }}>{item.fromUserName}</Text> {item.message}
                          </Text>
                        </View>
                        {deletingId === item.id ? (
                          <TouchableOpacity 
                            onPress={() => deleteNotification(item.id)}
                            style={{ padding: 5 }}
                          >
                            <Ionicons name="close-circle" size={24} color="#FF3B30" />
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.nItemTime}>{item.time}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="notifications-off-outline" size={45} color="#E2E8F0" />
                  <Text style={{ color: '#94A3B8', marginTop: 12, fontSize: 14 }}>Chưa có thông báo nào</Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 10,
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
    marginBottom: 7,
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
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 5,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    lineHeight: 30,
    paddingBottom: 0,
  },
  viewAllText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollGridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  gridItemScroll: {
    width: 85,
    padding: 2,
  },
  serviceCardMini: {
    height: 108,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconGlassMini: {
    width: 48,
    height: 48,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  serviceIconImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Hiển thị trọn vẹn 100% nội dung icon
  },
  serviceLabelMini: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 16, // Tăng lên 14 thay vì 12 để không bị cắt dấu
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
  comingSoonSub: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
  },
  featuredCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardImageContainer: {
    width: '100%',
    aspectRatio: 16 / 10,
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  featuredLoader: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#888',
    fontSize: 14,
  },
  // Notification Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  notificationContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    width: '85%',
    height: '100%',
    padding: 24,
    alignSelf: 'flex-end',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  nHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  nTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 20,
  },
  nList: {
    flex: 1,
  },
  nPromo: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  nPromoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
  },
  nPromoText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  nItem: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  nIcon: {
    width: 45,
    height: 43,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nContent: {
    flex: 1,
  },
  nItemTitle: {
    fontSize: 15,
    fontWeight: '500', // Chỉ dùng mức trung bình cho nội dung chung
    color: '#1E293B',
    marginBottom: 4,
  },
  nItemBody: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
    lineHeight: 18,
  },
  nItemTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});

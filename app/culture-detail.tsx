import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { ms, s, vs } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.40;

export default function CultureDetailScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isKm = language === 'km';
  const params = useLocalSearchParams();

  const id = params.id as string;
  const initialName = (params.name as string) || '';
  const initialLocation = (params.location as string) || '';
  const initialDescription = (params.description as string) || '';
  const initialImageUrl = (params.imageUrl1 as string) || (params.imageUrl as string);

  const [templeData, setTempleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'gallery' | 'quiz'>('gallery');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const docRef = doc(db, 'destinations', id);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTempleData({ id, ...data });
        const targetImg = data.imageUrl1 || data.imageUrl || initialImageUrl;
        if (targetImg) {
          try { await Image.prefetch(targetImg); } catch (e) { }
        }
      }
      setTimeout(() => setLoading(false), 800);
    }, (error) => {
      console.error('Error fetching culture detail:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!id || !user?.uid) {
      setIsFavorite(false);
      return;
    }
    const favRef = doc(db, 'users', user.uid, 'favorites', id);
    const unsubFav = onSnapshot(favRef, (snap) => {
      setIsFavorite(snap.exists());
    });
    return () => unsubFav();
  }, [id, user?.uid]);

  const name = isKm ? (templeData?.name_khmer || templeData?.name || initialName) : (templeData?.name || initialName);
  const location = isKm ? (templeData?.location_khmer || templeData?.location || initialLocation) : (templeData?.location || initialLocation);
  const description = isKm ? (templeData?.description_khmer || templeData?.description || initialDescription) : (templeData?.description || initialDescription);
  const contentBlocks = templeData?.contentBlocks || [];
  const imageUrl = templeData?.imageUrl1 || templeData?.imageUrl || initialImageUrl;

  const imageSource = React.useMemo(() => {
    return imageUrl && typeof imageUrl === 'string' && imageUrl !== ''
      ? { uri: imageUrl }
      : null;
  }, [imageUrl]);

  const handleToggleFavorite = async () => {
    if (!user || user.isAnonymous) {
      setShowLoginModal(true);
      return;
    }
    try {
      const { toggleFavorite } = require('@/services/firebase-service');
      const templeToFav = {
        id,
        name: templeData?.name || name,
        name_khmer: templeData?.name_khmer || '',
        location: templeData?.location || location,
        location_khmer: templeData?.location_khmer || '',
        imageUrl: templeData?.imageUrl || imageUrl,
        category: templeData?.category || 'Văn hóa'
      };
      await toggleFavorite(user.uid, templeToFav, !isFavorite);
    } catch (e) {
      console.error("Favorite Error:", e);
    }
  };

  const insets = useSafeAreaInsets();
  const galleryImages = React.useMemo(() => {
    const imgs = [];
    for (let i = 1; i <= 5; i++) {
      const url = templeData?.[`imageUrl${i}`] || params?.[`imageUrl${i}`];
      if (url) imgs.push(url);
    }
    if (imgs.length === 0 && (templeData?.imageUrl || initialImageUrl)) {
      imgs.push(templeData?.imageUrl || initialImageUrl);
    }
    return imgs;
  }, [templeData, params, initialImageUrl]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF0050" />
        <Text style={styles.loaderText}>
          {isKm ? 'កំពុងផ្ទុកមាតិកា...' : 'Đang tải nội dung...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.heroImg}
            contentFit="cover"
          />
          <View style={styles.heroOverlay} />

          <View style={[styles.topNav, { top: insets.top + vs(10) }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={ms(24)} color="#1E293B" />
            </TouchableOpacity>
            {!user?.role?.includes('Quản trị viên') && (
              <TouchableOpacity onPress={handleToggleFavorite} style={styles.iconBtn}>
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={ms(ms(22))} color={isFavorite ? "#EF4444" : "#1E293B"} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.contentArea}>
          <View style={styles.titleBox}>
            <Text style={styles.mainTitle} adjustsFontSizeToFit numberOfLines={2}>{name}</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel} numberOfLines={1}>{location}</Text>
            </View>
          </View>

          <View style={styles.tabHeader}>
            <TouchableOpacity
              onPress={() => setActiveTab('gallery')}
              style={[styles.tabItem, activeTab === 'gallery' && styles.tabItemActive]}
            >
              <Text style={[styles.tabLabel, activeTab === 'gallery' && styles.tabLabelActive]}>
                {isKm ? 'រូបភាព' : 'Bộ sưu tập'}
              </Text>
            </TouchableOpacity>

            {!user?.role?.includes('Quản trị viên') && (
              <TouchableOpacity
                onPress={() => setActiveTab('quiz')}
                style={[styles.tabItem, activeTab === 'quiz' && styles.tabItemActive]}
              >
                <Text style={[styles.tabLabel, activeTab === 'quiz' && styles.tabLabelActive]}>
                  {isKm ? 'ការប្រកួត' : 'Thử thách'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {activeTab === 'gallery' ? (
            <View style={styles.tabContent}>
              {description ? <Text style={styles.piecePara}>{description}</Text> : null}

              {contentBlocks.map((block: any, index: number) => (
                <View key={index} style={styles.contentPiece}>
                  {block.images && (
                    <Image
                      source={{ uri: block.images }}
                      style={styles.blockPic}
                      contentFit="cover"
                      transition={300}
                    />
                  )}
                  <Text style={block.type === 'title' ? styles.pieceTitle : styles.piecePara}>
                    {isKm ? (block.value_khmer || block.value) : block.value}
                  </Text>
                </View>
              ))}

              <View style={styles.galleryGrid}>
                {galleryImages.map((img, idx) => (
                  <View key={idx} style={styles.galleryItem}>
                    <Image source={{ uri: img }} style={styles.gridImg} contentFit="cover" transition={200} />
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.tabContent}>
              <View style={styles.quizCard}>
                <View style={styles.quizIconBg}>
                  <Ionicons name="trophy-outline" size={ms(32)} color="#FF6B2C" />
                </View>
                <Text style={styles.quizTitle}>{isKm ? 'សាកល្បងចំណេះដឹង' : 'Kiểm tra kiến thức'}</Text>
                <Text style={styles.quizSub}>{isKm ? 'ចូលរួមការប្រកួតដើម្បីទទួលបានពិន្ទុ' : 'Tham gia thử thách để nhận điểm thưởng'}</Text>
                <TouchableOpacity
                  style={styles.quizStartBtn}
                  onPress={() => router.push({ pathname: '/game-mcq', params: { pagodaId: id, imageUrl: imageUrl, pagodaLocation: location } })}
                >
                  <Text style={styles.quizStartBtnText}>{isKm ? 'ចាប់ផ្តើមការប្រកួត' : 'Bắt đầu ngay'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: insets.bottom + vs(40) }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF'
  },
  loaderText: {
    marginTop: vs(15),
    fontSize: ms(14),
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5
  },
  topNav: {
    position: 'absolute',
    left: s(20),
    right: s(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100
  },
  iconBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroWrapper: { width: width, height: HERO_HEIGHT, backgroundColor: '#E2E8F0' },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  contentArea: {
    paddingHorizontal: s(20),
    paddingTop: vs(30),
    backgroundColor: '#FFF',
    borderTopLeftRadius: s(36),
    borderTopRightRadius: s(36),
    marginTop: vs(-30),
    minHeight: height - HERO_HEIGHT + vs(30),
  },
  titleBox: { marginBottom: vs(20), paddingHorizontal: s(5) },
  mainTitle: { fontSize: ms(28), fontWeight: '900', color: '#1E293B', lineHeight: ms(36) },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: vs(6), gap: s(4) },
  locationLabel: { fontSize: ms(14), color: '#64748B', fontWeight: '500' },

  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: s(16),
    padding: s(4),
    marginBottom: vs(20)
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(10),
    gap: s(8),
    borderRadius: s(12),
  },
  tabItemActive: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  tabLabel: { fontSize: ms(14), fontWeight: '700', color: '#64748B' },
  tabLabelActive: { color: '#1E293B' },

  tabContent: { marginTop: vs(10) },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: s(2),
    marginBottom: 0
  },
  galleryItem: {
    width: (width - s(40) - s(15)) / 2,
    height: vs(130),
    borderRadius: s(16),
    overflow: 'hidden',
    marginBottom: vs(12)
  },
  gridImg: { width: '100%', height: '100%' },

  contentPiece: { marginBottom: vs(25) },
  blockPic: { width: '100%', height: vs(220), borderRadius: s(24), marginBottom: vs(15) },
  pieceTitle: { fontSize: ms(20), fontWeight: '900', color: '#1E293B', marginBottom: vs(8) },
  piecePara: { fontSize: ms(16), lineHeight: ms(26), color: '#475569', textAlign: 'justify', marginBottom: vs(15) },

  quizCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: s(28),
    padding: s(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginTop: vs(20)
  },
  quizIconBg: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(16),
    elevation: 2,
    shadowColor: '#FF6B2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  quizTitle: { fontSize: ms(20), fontWeight: '900', color: '#1E293B', marginBottom: vs(4) },
  quizSub: { fontSize: ms(14), color: '#64748B', marginBottom: vs(20), textAlign: 'center' },
  quizStartBtn: {
    backgroundColor: '#FF6B2C',
    paddingHorizontal: s(32),
    paddingVertical: vs(14),
    borderRadius: s(16),
    elevation: 4,
    shadowColor: '#FF6B2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  quizStartBtnText: { color: '#FFF', fontSize: ms(16), fontWeight: '800' }
});

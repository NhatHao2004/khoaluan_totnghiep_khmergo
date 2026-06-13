import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions, Image,
  ScrollView,
  StatusBar,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.40;

export default function FoodDetailScreen() {
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
  const [activeTab, setActiveTab] = useState<'map' | 'quiz'>('map');
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
      console.error('Error fetching food detail:', error);
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
        category: templeData?.category || 'Ẩm thực'
      };
      await toggleFavorite(user.uid, templeToFav, !isFavorite);
    } catch (e) {
      console.error("Favorite Error:", e);
    }
  };

  const lat = (templeData?.latitude || params.latitude || '9.9231') as string;
  const lng = (templeData?.longitude || params.longitude || '106.3406') as string;

  const webViewRef = useRef<any>(null);
  const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background-color: #000; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false, maxZoom: 18 }).setView([${lat}, ${lng}], 16);
    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 20, detectRetina: true }).addTo(map);
    var icon = L.divIcon({
      html: '<div style="width:28px;height:28px;background:#FF4B4B;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>',
      iconSize: [28, 28], iconAnchor: [14, 28]
    });
    L.marker([${lat}, ${lng}], { icon: icon }).addTo(map);
  </script>
</body>
</html>
  `;

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF0050" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <ScrollView scrollEnabled={scrollEnabled} showsVerticalScrollIndicator={false}>
        <View style={styles.imageBlock}>
          {imageSource && <Image source={imageSource} style={styles.fullImg} />}
          <View style={styles.topNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            {!user?.role?.includes('Quản trị viên') && (
              <TouchableOpacity onPress={handleToggleFavorite} style={styles.iconBtn}>
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#FF4B4B" : "#000"} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.contentArea}>
          <View style={styles.titleBox}>
            <Text style={styles.mainTitle}>{name}</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>{location}</Text>
            </View>
          </View>

          {description ? <Text style={styles.piecePara}>{description}</Text> : null}

          {contentBlocks.map((block: any, index: number) => (
            <View key={index} style={styles.contentPiece}>
              {block.images && <Image source={{ uri: block.images }} style={styles.blockPic} />}
              <Text style={block.type === 'title' ? styles.pieceTitle : styles.piecePara}>
                {isKm ? (block.value_khmer || block.value) : block.value}
              </Text>
            </View>
          ))}

          <View style={styles.mapWrap}>
            <View style={styles.sectionTabRow}>
              <TouchableOpacity onPress={() => setActiveTab('map')} style={[styles.tabBtn, activeTab === 'map' && styles.tabActive]}><Text style={[styles.tabText, activeTab === 'map' && styles.tabTextActive]}>{t('map_location')}</Text></TouchableOpacity>
              {!user?.role?.includes('Quản trị viên') && <TouchableOpacity onPress={() => setActiveTab('quiz')} style={[styles.tabBtn, activeTab === 'quiz' && styles.tabActiveQuiz]}><Text style={[styles.tabText, activeTab === 'quiz' && styles.tabTextActive]}>{isKm ? 'ការប្រកួត' : 'THỬ THÁCH'}</Text></TouchableOpacity>}
            </View>

            {activeTab === 'map' ? (
              <View style={styles.mapBox} onTouchStart={() => setScrollEnabled(false)} onTouchEnd={() => setScrollEnabled(true)} onTouchCancel={() => setScrollEnabled(true)}>
                <WebView style={styles.mapWebView} source={{ html: leafletHtml }} />
              </View>
            ) : (
              <View style={styles.quizCard}>
                <Text style={styles.quizTitle}>{isKm ? 'សាកល្បងចំណេះដឹង' : 'Kiểm tra kiến thức'}</Text>
                <TouchableOpacity style={styles.quizStartBtn} onPress={() => router.push({ pathname: '/game-mcq', params: { pagodaId: id, imageUrl: imageUrl, pagodaLocation: location } })}><Text style={styles.quizStartBtnText}>{isKm ? 'ចាប់ផ្តើមការប្រកួត' : 'Bắt đầu thử thách'}</Text></TouchableOpacity>
              </View>
            )}
          </View>
          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topNav: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 100 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  imageBlock: { width: width, height: HERO_HEIGHT },
  fullImg: { width: '100%', height: '100%' },
  contentArea: { paddingHorizontal: 25, paddingTop: 30, backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -30, minHeight: height - HERO_HEIGHT + 30 },
  titleBox: { marginBottom: 20 },
  mainTitle: { fontSize: 28, fontWeight: '900', color: '#0F172A' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  locationLabel: { fontSize: 14, color: '#64748B' },
  contentPiece: { marginTop: 15 },
  blockPic: { width: '100%', height: 220, borderRadius: 24, marginBottom: 15 },
  pieceTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  piecePara: { fontSize: 16, lineHeight: 26, color: '#475569' },
  mapWrap: { marginTop: 10 },
  mapBox: { height: 350, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
  mapWebView: { width: '100%', height: '100%' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTabRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#F8FAFC', borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  tabActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  tabActiveQuiz: { backgroundColor: '#FF6B2C', borderColor: '#FF6B2C' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#FFF' },
  quizCard: { height: 350, backgroundColor: '#FFF7ED', borderRadius: 28, alignItems: 'center', justifyContent: 'center', padding: 30 },
  quizTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 15 },
  quizStartBtn: { backgroundColor: '#FF6B2C', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  quizStartBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});

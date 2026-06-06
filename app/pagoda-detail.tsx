import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { scale, verticalScale, moderateScale } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions, Image, Linking, Modal, ScrollView,
  Share,
  StatusBar,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.40;

export default function PagodaDetailScreen() {
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
  const initialIsFavorite = params.favorite === 'true';

  const [templeData, setTempleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'map' | 'quiz'>('map');
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const docRef = doc(db, 'destinations', id);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTempleData(data);

        // Tải trước ảnh vào cache để khi hiện giao diện là có ảnh ngay lập tức
        const targetImg = data.imageUrl1 || (params.imageUrl1 as string);
        if (targetImg) {
          try {
            await Image.prefetch(targetImg);
          } catch (e) {
            console.log("Prefetch error:", e);
          }
        }
      }

      // Đảm bảo loading hiện đủ lâu để mọi thứ sẵn sàng
      setTimeout(() => {
        setLoading(false);
      }, 800);
    }, (error) => {
      console.error('Error fetching temple detail:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  const name = isKm ? (templeData?.name_khmer || templeData?.name || initialName) : (templeData?.name || initialName);
  const location = isKm ? (templeData?.location_khmer || templeData?.location || initialLocation) : (templeData?.location || initialLocation);
  const description = isKm ? (templeData?.description_khmer || templeData?.description || templeData?.detailedDescription || initialDescription) : (templeData?.description || templeData?.detailedDescription || initialDescription);
  const contentBlocks = templeData?.contentBlocks || [];
  const imageUrl = templeData?.imageUrl1 || (params.imageUrl1 as string);

  const imageSource = React.useMemo(() => {
    return imageUrl && typeof imageUrl === 'string' && imageUrl !== ''
      ? { uri: imageUrl }
      : null;
  }, [imageUrl]);

  const handleShare = async () => {
    try { await Share.share({ message: `${name}\n${location}` }); } catch (e) { }
  };

  const isFavorite = templeData?.favorite ?? initialIsFavorite;

  const handleToggleFavorite = async () => {
    try {
      const { toggleFavorite } = require('@/services/firebase-service');
      await toggleFavorite(id, !isFavorite);
    } catch (e) {
      console.error(e);
    }
  };

  const lat = (templeData?.latitude || params.latitude || '9.9231') as string;
  const lng = (templeData?.longitude || params.longitude || '106.3406') as string;

  const handleOpenDirections = () => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  };

  const webViewRef = useRef<any>(null);

  const reCenterMap = () => {
    webViewRef.current?.injectJavaScript(`
      map.setView([${lat}, ${lng}], 16);
      true;
    `);
  };

  const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background-color: #000; }
    .leaflet-container { image-rendering: -webkit-optimize-contrast; }
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
      iconSize: [28, 28], iconAnchor: [14, 28], className: ''
    });
    L.marker([${lat}, ${lng}], { icon: icon }).addTo(map);
  </script>
</body>
</html>
  `;

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loaderContent}>
          <ActivityIndicator size="large" color="#FF0050" />
          <Text style={[styles.loaderText, isKm && { letterSpacing: 0 }]}>{t('loading_content') || 'Đang tải nội dung...'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <ScrollView
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* --- Hero Image --- */}
        <View style={[styles.imageBlock, { backgroundColor: '#fff' }]}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={[styles.fullImg, { backgroundColor: '#fff' }]}
              fadeDuration={0}
            />
          ) : (
            <View style={styles.noImg}>
              <Ionicons name="image" size={scale(60)} color="#E2E8F0" />
            </View>
          )}

          {/* --- Navigation inside Image --- */}
          <View style={styles.topNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={scale(24)} color="#000" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: scale(12) }}>
              <TouchableOpacity onPress={handleToggleFavorite} style={styles.iconBtn}>
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={scale(22)} color={isFavorite ? "#FF4B4B" : "#000"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* --- Content Area --- */}
        <View style={styles.contentArea}>
          <View style={styles.titleBox}>
            <Text style={styles.mainTitle}>{name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={scale(18)} color="#FF6B6B" />
              <Text style={styles.locationLabel}>{location}</Text>
            </View>
          </View>

          {/* Description Section */}
          {description ? (
            <View style={{ marginBottom: 0 }}>
              <Text style={[styles.piecePara, { textAlign: isKm ? 'left' : 'justify' }]}>{description}</Text>
            </View>
          ) : null}

          {/* Dynamic Content Blocks */}
          {contentBlocks.map((block: any, index: number) => (
            <View key={index} style={styles.contentPiece}>
              {block.images && (
                <Image source={{ uri: block.images }} style={styles.blockPic} />
              )}
              <View style={styles.blockTextWrap}>
                {block.type === 'title' ? (
                  <Text style={styles.pieceTitle}>{isKm ? (block.value_khmer || block.value) : block.value}</Text>
                ) : (
                  <Text style={[styles.piecePara, { textAlign: isKm ? 'left' : 'justify' }]}>{isKm ? (block.value_khmer || block.value) : block.value}</Text>
                )}
              </View>
            </View>
          ))}

          {/* Map & Quiz Section */}
          <View style={styles.mapWrap}>
            <View style={styles.sectionTabRow}>
              <TouchableOpacity
                onPress={() => setActiveTab('map')}
                style={[
                  styles.tabBtn,
                  activeTab === 'map' && { backgroundColor: '#3B82F6', borderColor: '#3B82F6' }
                ]}
              >
                <Text style={[styles.tabBtnText, activeTab === 'map' && styles.tabBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{t('map_location')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('quiz')}
                style={[
                  styles.tabBtn,
                  activeTab === 'quiz' && { backgroundColor: '#FF6B2C', borderColor: '#FF6B2C' }
                ]}
              >
                <Text style={[styles.tabBtnText, activeTab === 'quiz' && styles.tabBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{isKm ? 'ការប្រកួត' : 'THỬ THÁCH'}</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'map' ? (
              <View
                style={styles.mapBox}
                onTouchStart={() => setScrollEnabled(false)}
                onTouchEnd={() => setScrollEnabled(true)}
                onTouchCancel={() => setScrollEnabled(true)}
              >
                <WebView
                  ref={webViewRef}
                  style={styles.mapWebView}
                  source={{ html: leafletHtml }}
                  scrollEnabled={true}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  androidLayerType="hardware"
                  originWhitelist={['*']}
                />

                {/* Map Floating Controls */}
                <View style={styles.mapControls}>
                  <TouchableOpacity style={styles.mapControlBtn} onPress={reCenterMap}>
                    <Ionicons name="locate" size={scale(20)} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.mapOpenBtn} onPress={handleOpenDirections}>
                  <Text style={styles.mapOpenText}>{t('view_directions')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.quizCard}>
                <Text style={styles.quizTitle}>{isKm ? 'សាកល្បងចំណេះដឹង' : 'Kiểm tra kiến thức'}</Text>
                <Text style={styles.quizDesc}>
                  {isKm ? (
                    <>តើអ្នកយល់ពី <Text style={{ fontWeight: 'bold', color: '#1E293B' }}>{name}</Text> យ៉ាងណា?{"\n"}ប្រកួតប្រជែងឥឡូវនេះដើម្បីទទួលបានពិន្ទុ</>
                  ) : (
                    <>Hiểu <Text style={{ fontWeight: 'bold', color: '#1E293B' }}>{name}</Text> như thế nào{"\n"}Thử thách ngay để nhận điểm thưởng</>
                  )}
                </Text>
                <TouchableOpacity
                  style={styles.quizStartBtn}
                  onPress={() => {
                    if (!user || user.isAnonymous) {
                      setShowLoginModal(true);
                      return;
                    }

                    router.push({
                      pathname: '/game-mcq',
                      params: {
                        pagodaId: id,
                        imageUrl: imageUrl,
                        pagodaLocation: location
                      }
                    });
                  }}
                >
                  <Text style={styles.quizStartBtnText}>{isKm ? 'ចាប់ផ្តើមការប្រកួត' : 'Bắt đầu thử thách'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ height: verticalScale(20) }} />
        </View>
      </ScrollView>

      {/* Custom Login Modal */}
      <Modal
        visible={showLoginModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: scale(24) }}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="person-circle-outline" size={scale(40)} color="#3B82F6" />
            </View>
            <Text style={styles.modalTitle}>{t('login_required') || 'Yêu cầu đăng nhập'}</Text>
            <Text style={styles.modalSub}>
              {t('login_to_use') || 'Bạn cần đăng nhập để tham gia thử thách này'}
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setShowLoginModal(false);
                  router.push({
                    pathname: '/login',
                    params: { returnTo: '/pagoda-detail', returnId: id }
                  });
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>{isKm ? 'ចូល' : 'Đăng nhập'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setShowLoginModal(false)}
              >
                <Text style={styles.modalSecondaryBtnText}>{isKm ? 'បោះបង់' : 'Quay lại'}</Text>
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
    backgroundColor: '#fff',
  },
  topNav: {
    position: 'absolute',
    top: verticalScale(50),
    left: scale(20),
    right: scale(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  iconBtn: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
    elevation: 4,
  },
  imageBlock: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    backgroundColor: '#fff',
  },
  fullImg: {
    width: '100%',
    height: '100%',
  },
  noImg: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentArea: {
    paddingHorizontal: scale(25),
    paddingTop: verticalScale(30),
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(36),
    borderTopRightRadius: scale(36),
    marginTop: verticalScale(-30),
    minHeight: SCREEN_HEIGHT - HERO_HEIGHT + verticalScale(30),
  },
  titleBox: {
    marginBottom: verticalScale(20),
  },
  mainTitle: {
    fontSize: moderateScale(28),
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: verticalScale(36),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(8),
    gap: scale(6),
  },
  locationLabel: {
    fontSize: moderateScale(14),
    color: '#64748B',
    fontWeight: '500',
  },
  contentPiece: {
    marginTop: verticalScale(15),
  },
  blockPic: {
    width: '100%',
    height: verticalScale(220),
    borderRadius: scale(24),
    marginBottom: verticalScale(15),
  },
  blockTextWrap: {
  },
  pieceTitle: {
    fontSize: moderateScale(20),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: verticalScale(8),
  },
  piecePara: {
    fontSize: moderateScale(16),
    lineHeight: verticalScale(26),
    color: '#475569',
    textAlign: 'left',
  },
  mapWrap: {
    marginTop: verticalScale(10),
  },
  headerLabel: {
    fontSize: moderateScale(13),
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 1.5,
    marginBottom: verticalScale(15),
  },
  mapBox: {
    height: verticalScale(350),
    borderRadius: scale(28),
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  mapWebView: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  mapOpenBtn: {
    position: 'absolute',
    bottom: verticalScale(15),
    right: scale(15),
    backgroundColor: '#3B82F6',
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(10),
    borderRadius: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  mapOpenText: {
    color: '#fff',
    fontSize: moderateScale(12),
    fontWeight: '800',
  },
  mapControls: {
    position: 'absolute',
    top: verticalScale(15),
    right: scale(15),
    gap: verticalScale(10),
  },
  mapControlBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.15,
    shadowRadius: scale(4),
    elevation: 3,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContent: {
    alignItems: 'center',
    gap: scale(15),
  },
  loaderText: {
    fontSize: moderateScale(14),
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionTabRow: {
    flexDirection: 'row',
    gap: scale(12),
    marginBottom: verticalScale(20),
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: verticalScale(12),
    backgroundColor: '#F8FAFC',
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    lineHeight: verticalScale(20),
  },
  tabBtnTextActive: {
    color: '#FFF',
  },
  quizCard: {
    height: verticalScale(350),
    backgroundColor: '#FFF7ED',
    borderRadius: scale(28),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(30),
  },
  quizIconBg: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },
  quizTitle: {
    fontSize: moderateScale(20),
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: verticalScale(8),
  },
  quizDesc: {
    fontSize: moderateScale(14),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: verticalScale(22),
    marginBottom: verticalScale(12),
  },
  quizStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    backgroundColor: '#FF6B2C',
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(14),
    borderRadius: scale(16),
    shadowColor: '#FF6B2C',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.2,
    shadowRadius: scale(8),
    elevation: 4,
  },
  quizStartBtnText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '800',
  },

  // --- Premium Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(24),
  },
  modalContent: {
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
  modalIconCircle: {
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
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  modalSub: {
    fontSize: moderateScale(15),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: verticalScale(22),
    marginBottom: verticalScale(24),
  },
  modalActionRow: {
    width: '100%',
    gap: scale(12),
  },
  modalPrimaryBtn: {
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
  modalPrimaryBtnText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
  modalSecondaryBtn: {
    backgroundColor: '#EF4444',
    height: verticalScale(56),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalSecondaryBtnText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
});

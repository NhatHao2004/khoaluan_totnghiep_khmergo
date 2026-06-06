import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { scale, verticalScale, moderateScale } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions, Image, Modal, ScrollView,
  StatusBar,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.40;

export default function CultureDetailScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isKm = language === 'km';
  const params = useLocalSearchParams();

  const id = params.id as string;
  const initialName = (params.name as string) || '';
  const initialDescription = (params.description as string) || '';
  const initialImageUrl = (params.imageUrl as string);
  const initialIsFavorite = params.favorite === 'true';

  const [cultureData, setCultureData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gallery' | 'quiz'>('gallery');
  const [mainScrollEnabled, setMainScrollEnabled] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // Dựa trên ảnh thực tế từ Firebase của người dùng: collection là 'destinations'
    const docRef = doc(db, 'destinations', id);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCultureData(data);
        // Tải trước các ảnh vào cache
        const imagesToPrefetch = [data.imageUrl1, data.imageUrl2, data.imageUrl3, data.imageUrl4, data.imageUrl5];
        imagesToPrefetch.forEach(async (url) => {
          if (url) {
            try { await Image.prefetch(url); } catch (e) { }
          }
        });
      }
      setTimeout(() => { setLoading(false); }, 600);
    }, (error) => {
      console.log('Error fetching culture detail:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  const name = isKm ? (cultureData?.name_khmer || cultureData?.name || initialName) : (cultureData?.name || initialName);
  const location = isKm ? (cultureData?.location_khmer || cultureData?.location || params.location) : (cultureData?.location || params.location);
  const description = isKm ? (cultureData?.description_khmer || cultureData?.description || initialDescription) : (cultureData?.description || initialDescription);
  const contentBlocks = cultureData?.contentBlocks || [];
  const imageUrl = cultureData?.imageUrl6 || cultureData?.imageUrl || initialImageUrl;

  const isFavorite = cultureData?.favorite ?? initialIsFavorite;

  const handleToggleFavorite = async () => {
    try {
      const { toggleFavorite } = require('@/services/firebase-service');
      await toggleFavorite(id, !isFavorite);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF0050" />
        <Text style={styles.loaderText}>{t('loading_content') || 'Đang tải...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEnabled={mainScrollEnabled}
      >
        {/* --- Hero Image --- */}
        <View style={styles.imageBlock}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.fullImg} />
          ) : (
            <View style={styles.noImg}><Ionicons name="image" size={scale(60)} color="#E2E8F0" /></View>
          )}

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
          </View>

          {/* Description */}
          {description ? (
            <Text style={[styles.piecePara, { textAlign: isKm ? 'left' : 'justify' }]}>{description}</Text>
          ) : null}

          {/* Dynamic Content Blocks */}
          {contentBlocks.map((block: any, index: number) => (
            <View key={index} style={styles.contentPiece}>
              {block.images && <Image source={{ uri: block.images }} style={styles.blockPic} />}
              <View style={styles.blockTextWrap}>
                {block.type === 'title' ? (
                  <Text style={styles.pieceTitle}>{isKm ? (block.value_khmer || block.value) : block.value}</Text>
                ) : (
                  <Text style={[styles.piecePara, { textAlign: isKm ? 'left' : 'justify' }]}>{isKm ? (block.value_khmer || block.value) : block.value}</Text>
                )}
              </View>
            </View>
          ))}

          {/* Media & Quiz Section (Tabbed) */}
          <View style={styles.mediaWrap}>
            <View style={styles.sectionTabRow}>
              <TouchableOpacity
                onPress={() => setActiveTab('gallery')}
                style={[
                  styles.tabBtn,
                  activeTab === 'gallery' && { backgroundColor: '#3B82F6', borderColor: '#3B82F6' }
                ]}
              >
                <Text style={[styles.tabBtnText, activeTab === 'gallery' && styles.tabBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{isKm ? 'រូបភាព' : 'HÌNH ẢNH'}</Text>
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

            <View style={{ minHeight: verticalScale(250) }}>
              {activeTab === 'gallery' ? (
                <View style={styles.galleryContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.galleryScroll,
                      {
                        paddingLeft: scale(25),
                        paddingRight: scale(10)
                      }
                    ]}
                    snapToInterval={SCREEN_WIDTH * 0.75 + scale(15)}
                    snapToAlignment="center"
                    decelerationRate="fast"
                    onScrollBeginDrag={() => setMainScrollEnabled(false)}
                    onScrollEndDrag={() => setMainScrollEnabled(true)}
                    onMomentumScrollEnd={() => setMainScrollEnabled(true)}
                  >
                    {[
                      cultureData?.imageUrl1 || cultureData?.imageUrl,
                      cultureData?.imageUrl2,
                      cultureData?.imageUrl3,
                      cultureData?.imageUrl4,
                      cultureData?.imageUrl5
                    ].filter(url => !!url).map((url, index) => (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.9}
                        style={styles.galleryItem}
                      >
                        <Image source={{ uri: url }} style={styles.galleryPic} />
                      </TouchableOpacity>
                    ))}
                    {/* Placeholder nếu chỉ có 1 ảnh */}
                    {(!cultureData?.imageUrl2) && (
                      <View style={[styles.galleryItem, styles.galleryPlaceholder]}>
                        <Ionicons name="images-outline" size={scale(32)} color="#CBD5E1" />
                        <Text style={styles.placeholderText}>{isKm ? 'ពង្រីកដើម្បីមើលបន្ថែម...' : 'Mở rộng xem thêm...'}</Text>
                      </View>
                    )}
                  </ScrollView>
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
          </View>


          <View style={{ height: verticalScale(10) }} />
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
                    params: { returnTo: '/culture-detail', returnId: id }
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
  container: { flex: 1, backgroundColor: '#ffffffff' },
  topNav: { position: 'absolute', top: verticalScale(50), left: scale(20), right: scale(20), zIndex: 100, flexDirection: 'row', justifyContent: 'space-between' },
  iconBtn: {
    width: scale(44), height: scale(44), borderRadius: scale(22), backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  imageBlock: { width: SCREEN_WIDTH, height: HERO_HEIGHT, backgroundColor: '#fff' },
  fullImg: { width: '100%', height: '100%' },
  noImg: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  contentArea: {
    paddingHorizontal: scale(25), paddingTop: verticalScale(30), backgroundColor: '#fff',
    borderTopLeftRadius: scale(36), borderTopRightRadius: scale(36), marginTop: verticalScale(-30),
    minHeight: SCREEN_HEIGHT - HERO_HEIGHT + verticalScale(30),
  },
  titleBox: { marginBottom: verticalScale(20) },
  mainTitle: { fontSize: moderateScale(22), fontWeight: '900', color: '#0F172A', lineHeight: verticalScale(36) },
  locationTitle: { fontSize: moderateScale(16), color: '#64748B', fontWeight: '500', marginTop: verticalScale(5) },
  contentPiece: { marginTop: verticalScale(15) },
  blockPic: { width: '100%', height: verticalScale(220), borderRadius: scale(24), marginBottom: verticalScale(15) },
  blockTextWrap: {},
  pieceTitle: { fontSize: moderateScale(20), fontWeight: '900', color: '#0F172A', marginBottom: verticalScale(8) },
  piecePara: { fontSize: moderateScale(16), lineHeight: verticalScale(26), color: '#475569' },
  mediaWrap: {
    marginTop: verticalScale(25),
  },
  sectionTabRow: {
    flexDirection: 'row',
    gap: scale(12),
    marginBottom: verticalScale(20)
  },
  tabBtn: {
    flex: 1,
    paddingVertical: verticalScale(12),
    backgroundColor: '#F8FAFC',
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#64748B',
    lineHeight: verticalScale(20),
  },
  tabBtnTextActive: {
    color: '#FFF'
  },
  galleryContainer: {
    marginHorizontal: scale(-25),
    width: SCREEN_WIDTH,
    marginBottom: verticalScale(10),
  },
  quizCard: {
    height: verticalScale(220), backgroundColor: '#FFF7ED', borderRadius: scale(28),
    borderWidth: 1, borderColor: '#FFEDD5', alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: scale(30),
    marginHorizontal: 0,
  },
  quizIconBg: {
    width: scale(64), height: scale(64), borderRadius: scale(32), backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: verticalScale(16),
  },
  quizTitle: { fontSize: moderateScale(20), fontWeight: '900', color: '#1E293B', marginBottom: verticalScale(8) },
  quizDesc: { fontSize: moderateScale(13), color: '#64748B', textAlign: 'center', lineHeight: verticalScale(22), marginBottom: verticalScale(12) },
  quizStartBtn: {
    backgroundColor: '#FF6B2C', paddingHorizontal: scale(24), paddingVertical: verticalScale(14),
    borderRadius: scale(16), elevation: 4,
    shadowColor: '#FF6B2C',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.2,
    shadowRadius: scale(8),
  },
  quizStartBtnText: { color: '#FFF', fontSize: moderateScale(16), fontWeight: '800' },
  sectionLabel: {
    fontSize: moderateScale(13),
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1.5,
    marginBottom: verticalScale(20),
    textTransform: 'uppercase',
  },
  galleryScroll: {
  },
  galleryItem: {
    width: SCREEN_WIDTH * 0.75,
    height: verticalScale(200),
    marginRight: scale(15),
    borderRadius: scale(24),
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  galleryPic: {
    width: '100%',
    height: '100%',
  },
  galleryPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(12),
    color: '#94A3B8',
    fontWeight: '600',
  },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loaderText: { marginTop: verticalScale(10), fontSize: moderateScale(14), color: '#64748B' },

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

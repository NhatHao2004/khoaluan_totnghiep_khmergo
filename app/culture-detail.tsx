import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
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
            <View style={styles.noImg}><Ionicons name="image" size={60} color="#E2E8F0" /></View>
          )}

          <View style={styles.topNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {user?.role !== 'Quản trị viên' && (
                <TouchableOpacity onPress={handleToggleFavorite} style={styles.iconBtn}>
                  <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#FF4B4B" : "#000"} />
                </TouchableOpacity>
              )}
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

              {user?.role !== 'Quản trị viên' && (
                <TouchableOpacity
                  onPress={() => setActiveTab('quiz')}
                  style={[
                    styles.tabBtn,
                    activeTab === 'quiz' && { backgroundColor: '#FF6B2C', borderColor: '#FF6B2C' }
                  ]}
                >
                  <Text style={[styles.tabBtnText, activeTab === 'quiz' && styles.tabBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{isKm ? 'ការប្រកួត' : 'THỬ THÁCH'}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ minHeight: 250 }}>
              {activeTab === 'gallery' ? (
                <View style={styles.galleryContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.galleryScroll,
                      {
                        paddingLeft: 25,
                        paddingRight: 10
                      }
                    ]}
                    snapToInterval={width * 0.75 + 15}
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
                        <Ionicons name="images-outline" size={32} color="#CBD5E1" />
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
                      // Nếu là Admin thì cho phép vào thử thách luôn không cần check login thường
                      const isAdmin = user?.role === 'Quản trị viên';
                      
                      if (!isAdmin && (!user || user.isAnonymous)) {
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


          <View style={{ height: 10 }} />
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="person-circle-outline" size={40} color="#3B82F6" />
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
  topNav: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 100, flexDirection: 'row', justifyContent: 'space-between' },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  imageBlock: { width: width, height: HERO_HEIGHT, backgroundColor: '#fff' },
  fullImg: { width: '100%', height: '100%' },
  noImg: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  contentArea: {
    paddingHorizontal: 25, paddingTop: 30, backgroundColor: '#fff',
    borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -30,
    minHeight: height - HERO_HEIGHT + 30,
  },
  titleBox: { marginBottom: 20 },
  mainTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', lineHeight: 36 },
  locationTitle: { fontSize: 16, color: '#64748B', fontWeight: '500', marginTop: 5 },
  contentPiece: { marginTop: 15 },
  blockPic: { width: '100%', height: 220, borderRadius: 24, marginBottom: 15 },
  blockTextWrap: {},
  pieceTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  piecePara: { fontSize: 16, lineHeight: 26, color: '#475569' },
  mediaWrap: {
    marginTop: 25,
  },
  sectionTabRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    lineHeight: 20,
  },
  tabBtnTextActive: {
    color: '#FFF'
  },
  galleryContainer: {
    marginHorizontal: -25,
    width: width,
    marginBottom: 10,
  },
  quizCard: {
    height: 220, backgroundColor: '#FFF7ED', borderRadius: 28,
    borderWidth: 1, borderColor: '#FFEDD5', alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 30,
    marginHorizontal: 0,
  },
  quizIconBg: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  quizTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
  quizDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  quizStartBtn: {
    backgroundColor: '#FF6B2C', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 16, elevation: 4,
    shadowColor: '#FF6B2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  quizStartBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1.5,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  galleryScroll: {
  },
  galleryItem: {
    width: width * 0.75,
    height: 200,
    marginRight: 15,
    borderRadius: 24,
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
    marginTop: 10,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loaderText: { marginTop: 10, fontSize: 14, color: '#64748B' },

  // --- Premium Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActionRow: {
    width: '100%',
    gap: 12,
  },
  modalPrimaryBtn: {
    backgroundColor: '#3B82F6',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalPrimaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalSecondaryBtn: {
    backgroundColor: '#EF4444',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalSecondaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

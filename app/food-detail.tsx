import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions, Image, ScrollView,
  StatusBar,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';

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
  const initialImageUrl = (params.imageUrl as string) || (params.imageUrl1 as string);
  const initialIsFavorite = params.favorite === 'true';

  const [foodData, setFoodData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mainScrollEnabled, setMainScrollEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'gallery' | 'quiz'>('gallery');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const docRef = doc(db, 'destinations', id);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFoodData(data);

        const imagesToPrefetch = [data.imageUrl1, data.imageUrl2, data.imageUrl3, data.imageUrl4, data.imageUrl5, initialImageUrl];
        imagesToPrefetch.forEach(async (url) => {
          if (url) {
            try { await Image.prefetch(url); } catch (e) { }
          }
        });
      }

      setTimeout(() => {
        setLoading(false);
      }, 600);
    }, (error) => {
      console.error('Error fetching food detail:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  const name = isKm ? (foodData?.name_khmer || foodData?.name || initialName) : (foodData?.name || initialName);
  const location = isKm ? (foodData?.location_khmer || foodData?.location || params.location) : (foodData?.location || params.location);
  const description = isKm ? (foodData?.description_khmer || foodData?.description || initialDescription) : (foodData?.description || initialDescription);
  const contentBlocks = foodData?.contentBlocks || [];
  const imageUrl = foodData?.imageUrl1 || initialImageUrl;

  const imageSource = React.useMemo(() => {
    return imageUrl && typeof imageUrl === 'string' && imageUrl !== ''
      ? { uri: imageUrl }
      : null;
  }, [imageUrl]);

  const isFavorite = foodData?.favorite ?? initialIsFavorite;

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
        scrollEnabled={mainScrollEnabled}
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
              <Ionicons name="restaurant-outline" size={60} color="#E2E8F0" />
            </View>
          )}

          {/* --- Navigation inside Image --- */}
          <View style={styles.topNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={handleToggleFavorite} style={styles.iconBtn}>
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#FF4B4B" : "#000"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* --- Content Area --- */}
        <View style={styles.contentArea}>
          <View style={styles.titleBox}>
            <Text style={styles.mainTitle}>{name}</Text>
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
                <Text style={[styles.tabBtnText, activeTab === 'gallery' && styles.tabBtnTextActive]}>{isKm ? 'រូបភាព' : 'HÌNH ẢNH'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('quiz')}
                style={[
                  styles.tabBtn,
                  activeTab === 'quiz' && { backgroundColor: '#FF6B2C', borderColor: '#FF6B2C' }
                ]}
              >
                <Text style={[styles.tabBtnText, activeTab === 'quiz' && styles.tabBtnTextActive]}>{isKm ? 'ការប្រកួត' : 'THỬ THÁCH'}</Text>
              </TouchableOpacity>
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
                      foodData?.imageUrl2 || initialImageUrl,
                      foodData?.imageUrl3,
                      foodData?.imageUrl4,
                      foodData?.imageUrl5,
                      foodData?.imageUrl6
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
                    {(!foodData?.imageUrl2) && (
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
                      <>Hiểu về <Text style={{ fontWeight: 'bold', color: '#1E293B' }}>{name}</Text> như thế nào{"\n"}Thử thách ngay để nhận điểm thưởng</>
                    )}
                  </Text>
                  <TouchableOpacity
                    style={styles.quizStartBtn}
                    onPress={() => {
                      if (!user) {
                        Alert.alert(
                          t('login_required') || 'Yêu cầu đăng nhập',
                          t('login_to_use') || 'Bạn cần đăng nhập để tham gia thử thách này',
                          [
                            { text: isKm ? 'បោះបង់' : 'Hủy', style: 'cancel' },
                            {
                              text: isKm ? 'ចូល' : 'Đăng nhập',
                              onPress: () => router.push({
                                pathname: '/login',
                                params: { returnTo: '/food-detail', returnId: id }
                              })
                            }
                          ]
                        );
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

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
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
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  imageBlock: {
    width: width,
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
    paddingHorizontal: 25,
    paddingTop: 30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -30,
    minHeight: height - HERO_HEIGHT + 30,
  },
  titleBox: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 36,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  locationLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  contentPiece: {
    marginTop: 15,
  },
  blockPic: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    marginBottom: 15,
  },
  blockTextWrap: {
  },
  pieceTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  piecePara: {
    fontSize: 16,
    lineHeight: 26,
    color: '#475569',
    textAlign: 'left',
  },
  mediaWrap: {
    marginTop: 10,
  },
  sectionTabRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tabBtnTextActive: {
    color: '#FFF',
  },
  galleryContainer: {
    marginHorizontal: -25,
    width: width,
    marginBottom: 10,
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
  quizCard: {
    height: 220,
    backgroundColor: '#FFF7ED',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    marginHorizontal: 0,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
  },
  quizDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  quizStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FF6B2C',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#FF6B2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  quizStartBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContent: {
    alignItems: 'center',
    gap: 15,
  },
  loaderText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

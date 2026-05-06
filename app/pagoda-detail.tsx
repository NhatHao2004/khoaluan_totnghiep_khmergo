import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions, Image, ScrollView,
  Share,
  StatusBar,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.40;

export default function PagodaDetailScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isKm = language === 'km';
  const params = useLocalSearchParams();

  const id = params.id as string;
  const initialName = (params.name as string) || '';
  const initialLocation = (params.location as string) || '';
  const initialDescription = (params.description as string) || '';
  const initialImageUrl = (params.imageUrl1 as string) || (params.imageUrl as string);
  const initialIsFavorite = params.isFavorite === 'true';

  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [templeData, setTempleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loaderContent}>
          <ActivityIndicator size="large" color="#FF0050" />
          <Text style={styles.loaderText}>{t('loading_content') || 'Đang tải nội dung...'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
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
              <Ionicons name="image" size={60} color="#E2E8F0" />
            </View>
          )}

          {/* --- Navigation inside Image --- */}
          <View style={styles.topNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} style={styles.iconBtn}>
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#FF4B4B" : "#000"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* --- Content Area --- */}
        <View style={styles.contentArea}>
          <View style={styles.titleBox}>
            <Text style={styles.mainTitle}>{name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={18} color="#FF6B6B" />
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

          {/* Map Section */}
          <View style={styles.mapWrap}>
            <Text style={styles.headerLabel}>VỊ TRÍ TRÊN BẢN ĐỒ</Text>
            <View style={styles.mapBox}>
              <Image
                style={styles.mapPreview}
                source={{ uri: 'https://maps.googleapis.com/maps/api/staticmap?center=' + (params.latitude || '9.9231') + ',' + (params.longitude || '106.3406') + '&zoom=15&size=800x400&scale=2&maptype=roadmap&key=API' }}
              />
              <TouchableOpacity style={styles.mapOpenBtn}>
                <Text style={styles.mapOpenText}>Xem lộ trình</Text>
                <Ionicons name="open-outline" size={16} color="#fff" />
              </TouchableOpacity>
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
    marginTop: 25,
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
  mapWrap: {
    marginTop: 10,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  mapBox: {
    height: 220,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  mapOpenBtn: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#0F172A',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapOpenText: {
    color: '#fff',
    fontSize: 12,
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

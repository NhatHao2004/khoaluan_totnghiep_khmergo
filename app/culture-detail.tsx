import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const CULTURE_IMAGES: { [key: string]: any } = {
  default: require('@/assets/images/lehoi.jpg'),
  'le-hoi-oc-om-boc': require('@/assets/images/lehoi.jpg'),
  'oc-om-boc': require('@/assets/images/lehoi.jpg'),
  'ghe-ngo': require('@/assets/images/festival.jpg'),
};

const getCultureImage = (id: string, name: string) => {
  if (CULTURE_IMAGES[id as keyof typeof CULTURE_IMAGES]) {
    return CULTURE_IMAGES[id as keyof typeof CULTURE_IMAGES];
  }
  
  const nameKey = name?.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd');

  if (nameKey && CULTURE_IMAGES[nameKey as keyof typeof CULTURE_IMAGES]) {
    return CULTURE_IMAGES[nameKey as keyof typeof CULTURE_IMAGES];
  }

  return CULTURE_IMAGES.default;
};

export default function CultureDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isFavorite, setIsFavorite] = useState(params.isFavorite === 'true');
  const { language, t } = useLanguage();

  const [contentBlocks, setContentBlocks] = useState<any[] | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [heroSource, setHeroSource] = useState<any>(
    getCultureImage(params.id as string || '', params.name as string || '')
  );

  useEffect(() => {
    const fetchCultureDetails = async () => {
      if (!params.id) {
        setLoadingContent(false);
        return;
      }
      try {
        const docRef = doc(db, 'destinations', params.id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const blocks = language === 'km' && data.contentBlocks_km
            ? data.contentBlocks_km
            : data.contentBlocks;

          setContentBlocks(blocks || null);
          
          if (data.imageKey) {
            const key = data.imageKey as string;
            if (key.startsWith('http')) {
              setHeroSource({ uri: key });
            } else {
              setHeroSource(getCultureImage(key, key));
            }
          }
        }
      } catch (error) {
        console.error("Error fetching culture details: ", error);
      } finally {
        setTimeout(() => setLoadingContent(false), 1000);
      }
    };
    fetchCultureDetails();
  }, [params.id, language]);

  const imageUrl = params.imageUrl;
  let source = heroSource;
  if (!source && imageUrl) {
    source = typeof imageUrl === 'string' && imageUrl.startsWith('http') ? { uri: imageUrl } : imageUrl;
  }
  if (!source) {
    source = getCultureImage(params.id as string || '', params.name as string || '');
  }

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={source} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} style={styles.heartBtn}>
              <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#ff0000" : "#000"} />
            </TouchableOpacity>
          </View>
        </View>

        {!loadingContent && (
          <View style={styles.contentContainer}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>{params.name || 'Chi tiết văn hóa'}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={18} color="#A000FF" />
                <Text style={styles.locationText}>{params.location || t('address_not_updated')}</Text>
              </View>
            </View>

            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>{t('intro')}</Text>
              {contentBlocks && contentBlocks.length > 0 ? (
                contentBlocks.map((block, index) => (
                  block.type === 'text' ? (
                    <Text key={index} style={[styles.descriptionText, language === 'km' && styles.khmerText]}>
                      {block.value}
                    </Text>
                  ) : (
                    <Image key={index} source={typeof block.value === 'string' && block.value.startsWith('http') ? { uri: block.value } : getCultureImage(block.value, block.value)} style={styles.inlineImage} />
                  )
                ))
              ) : (
                <Text style={[styles.descriptionText, language === 'km' && styles.khmerText]}>
                  {params.description || 'Chưa có thông tin chi tiết.'}
                </Text>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]}>
                  <Ionicons name="share-social" size={22} color="#fff" />
                  <Text style={styles.primaryBtnText}>Chia sẻ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/quiz')}>
                  <Ionicons name="game-controller" size={22} color="#1E293B" />
                  <Text style={styles.actionBtnText}>{t('quiz_title')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {loadingContent && (
        <View style={styles.fullScreenLoader}>
          <ActivityIndicator size="large" color="#A000FF" />
          <Text style={styles.loadingText}>{t('loading_content')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flex: 1 },
  heroContainer: { width: '100%', height: 350, position: 'relative' },
  heroImage: { width: '100%', height: '100%', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerBar: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  heartBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  contentContainer: { padding: 25 },
  titleSection: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 15, color: '#666', marginLeft: 5 },
  descSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 15 },
  descriptionText: { fontSize: 16, color: '#4A4A4A', lineHeight: 26, textAlign: 'justify' },
  khmerText: { fontSize: 18, lineHeight: 30 },
  inlineImage: { width: '100%', height: 200, borderRadius: 16, marginVertical: 15 },
  actionRow: { flexDirection: 'row', gap: 15, marginTop: 25 },
  actionBtn: { flex: 1, height: 50, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#eee' },
  primaryBtn: { backgroundColor: '#1E293B', borderColor: '#1E293B' },
  actionBtnText: { color: '#1E293B', fontWeight: '700' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  fullScreenLoader: { ...StyleSheet.absoluteFillObject, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  loadingText: { marginTop: 10, color: '#888' },
});

import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const FOOD_IMAGES: { [key: string]: any } = {
  default: require('@/assets/images/amthuc.jpg'),
  'bun-nuoc-leo': require('@/assets/images/cuisine.jpg'),
};

const getFoodImage = (id: string, name: string) => {
  if (FOOD_IMAGES[id as keyof typeof FOOD_IMAGES]) {
    return FOOD_IMAGES[id as keyof typeof FOOD_IMAGES];
  }
  const nameKey = name?.toLowerCase().replace(/\s+/g, '-').replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a').replace(/[èéẹẻẽêềếệểễ]/g, 'e').replace(/[ìíịỉĩ]/g, 'i').replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o').replace(/[ùúụủũưừứựửữ]/g, 'u').replace(/[ỳýỵỷỹ]/g, 'y').replace(/đ/g, 'd');
  if (nameKey && FOOD_IMAGES[nameKey as keyof typeof FOOD_IMAGES]) return FOOD_IMAGES[nameKey as keyof typeof FOOD_IMAGES];
  return FOOD_IMAGES.default;
};

export default function FoodDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isFavorite, setIsFavorite] = useState(params.isFavorite === 'true');
  const { language, t } = useLanguage();
  const [contentBlocks, setContentBlocks] = useState<any[] | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [heroSource, setHeroSource] = useState<any>(getFoodImage(params.id as string || '', params.name as string || ''));

  useEffect(() => {
    const fetchFoodDetails = async () => {
      if (!params.id) { setLoadingContent(false); return; }
      try {
        const docRef = doc(db, 'destinations', params.id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const blocks = language === 'km' && data.contentBlocks_km ? data.contentBlocks_km : data.contentBlocks;
          setContentBlocks(blocks || null);
          if (data.imageKey) {
            if (data.imageKey.startsWith('http')) setHeroSource({ uri: data.imageKey });
            else setHeroSource(getFoodImage(data.imageKey, data.imageKey));
          }
        }
      } catch (e) { console.error(e); }
      finally { setTimeout(() => setLoadingContent(false), 1000); }
    };
    fetchFoodDetails();
  }, [params.id, language]);

  const source = heroSource || (params.imageUrl?.startsWith('http') ? { uri: params.imageUrl } : getFoodImage(params.id as string, params.name as string));

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image source={source} style={styles.heroImage} />
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#000" /></TouchableOpacity>
            <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} style={styles.heartBtn}><Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#ff0000" : "#000"} /></TouchableOpacity>
          </View>
        </View>

        {!loadingContent && (
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{params.name || 'Chi tiết ẩm thực'}</Text>
            <View style={styles.tagRow}>
              <View style={styles.tag}><Text style={styles.tagText}>Đặc sản</Text></View>
              <View style={[styles.tag, {backgroundColor: '#FFF0F0'}]}><Text style={[styles.tagText, {color: '#FF4D4D'}]}>Truyền thống</Text></View>
            </View>

            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>Giới thiệu món ăn</Text>
              {contentBlocks ? contentBlocks.map((block, i) => block.type === 'text' ? (
                <Text key={i} style={[styles.descriptionText, language === 'km' && styles.khmerText]}>{block.value}</Text>
              ) : (
                <Image key={i} source={typeof block.value === 'string' && block.value.startsWith('http') ? { uri: block.value } : getFoodImage(block.value, block.value)} style={styles.inlineImage} />
              )) : <Text style={styles.descriptionText}>{params.description || 'Đang cập nhật nội dung...'}</Text>}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]}><Ionicons name="cart" size={22} color="#fff" /><Text style={styles.primaryBtnText}>Tìm quán ăn</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}><Ionicons name="share-social" size={22} color="#1E293B" /><Text style={styles.actionBtnText}>Chia sẻ</Text></TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      {loadingContent && <View style={styles.loader}><ActivityIndicator size="large" color="#FF0050" /><Text style={{marginTop: 10, color: '#888'}}>{t('loading_content')}</Text></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  heroContainer: { width: '100%', height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%', borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  headerBar: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  heartBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  contentContainer: { padding: 25 },
  title: { fontSize: 28, fontWeight: '900', color: '#1A1A1A', marginBottom: 15 },
  tagRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F0F7FF' },
  tagText: { fontSize: 12, fontWeight: '700', color: '#007AFF' },
  descSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 15 },
  descriptionText: { fontSize: 16, color: '#444', lineHeight: 26, textAlign: 'justify' },
  khmerText: { fontSize: 19, lineHeight: 32 },
  inlineImage: { width: '100%', height: 220, borderRadius: 20, marginVertical: 15 },
  actionRow: { flexDirection: 'row', gap: 15 },
  actionBtn: { flex: 1, height: 55, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#EEE' },
  primaryBtn: { backgroundColor: '#FF0050', borderColor: '#FF0050' },
  actionBtnText: { color: '#1E293B', fontWeight: '800' },
  primaryBtnText: { color: '#fff', fontWeight: '800', marginLeft: 8 },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
});

import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const PAGODA_IMAGES: { [key: string]: any } = {
  default: require('@/assets/images/pagoda.jpg'),
  // by ID
  'pagoda_1': require('@/assets/images/chuaang.jpg'),
  'pagoda_2': require('@/assets/images/chuahang.jpg'),
  'pagoda_3': require('@/assets/images/kampong.jpg'),
  'pagoda_4': require('@/assets/images/salengcu.jpg'),
  'pagoda_5': require('@/assets/images/veluvana.jpg'),
  // by imageKey (lưu trên Firebase)
  'chua-ang': require('@/assets/images/chuaang.jpg'),
  'chua-hang': require('@/assets/images/chuahang.jpg'),
  'chua-kampong': require('@/assets/images/kampong.jpg'),
  'chua-sleng-cu': require('@/assets/images/salengcu.jpg'),
  'chua-veluvana': require('@/assets/images/veluvana.jpg'),
  // by short name
  'chuahang': require('@/assets/images/chuahang.jpg'),
  'kampong': require('@/assets/images/kampong.jpg'),
  'salengcu': require('@/assets/images/salengcu.jpg'),
  'veluvana': require('@/assets/images/veluvana.jpg'),
};

const DEFAULT_CONTENT_BLOCKS = [
  {
    type: 'text',
    value: 'Chùa là một trong những ngôi chùa cổ kính và có kiến trúc độc đáo bậc nhất, mang đậm dấu ấn văn hóa của đồng bào Khmer Nam Bộ. Không gian chùa được bao bọc bởi những hàng cây cổ thụ xanh mát, mang lại sự thanh tịnh tuyệt đối.'
  },
  {
    type: 'image',
    value: require('@/assets/images/chuahang.jpg')
  },
  {
    type: 'text',
    value: 'Chánh điện của chùa được xây dựng vô cùng tinh xảo với các bức phù điêu chạm khắc cầu kỳ. Mái chùa lợp ngói đa sắc, vuốt cong vút vươn lên bầu trời tượng trưng cho sự tự do và tâm linh siêu thoát.'
  },
  {
    type: 'image',
    value: require('@/assets/images/kampong.jpg')
  },
  {
    type: 'text',
    value: 'Hàng năm, chùa thu hút đông đảo du khách thập phương và Phật tử đến chiêm bái, đặc biệt là vào các dịp lễ hội truyền thống như Chôl Chnăm Thmây hay Ok Om Bok. Nơi đây không chỉ là điểm sinh hoạt tôn giáo mà còn là bảo tàng văn hóa sống động.'
  }
];

const getPagodaImage = (templeId: string, templeName: string) => {
  if (PAGODA_IMAGES[templeId as keyof typeof PAGODA_IMAGES]) {
    return PAGODA_IMAGES[templeId as keyof typeof PAGODA_IMAGES];
  }

  const nameKey = templeName?.toLowerCase()
    .replace(/chùa\s*/g, 'chua-')
    .replace(/\s+/g, '-')
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd');

  if (nameKey && PAGODA_IMAGES[nameKey as keyof typeof PAGODA_IMAGES]) {
    return PAGODA_IMAGES[nameKey as keyof typeof PAGODA_IMAGES];
  }

  return PAGODA_IMAGES.default;
};

export default function PagodaDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isFavorite, setIsFavorite] = useState(params.isFavorite === 'true');
  const { language, t } = useLanguage();

  const [contentBlocks, setContentBlocks] = useState<any[] | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  // Khởi tạo ngay với ảnh local để không giật khi chờ Firebase
  const [heroSource, setHeroSource] = useState<any>(
    getPagodaImage(params.id as string || '', params.name as string || '')
  );

  useEffect(() => {
    const fetchPagodaDetails = async () => {
      if (!params.id) {
        setLoadingContent(false);
        return;
      }
      try {
        const docRef = doc(db, 'destinations', params.id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Nếu là tiếng Khmer, ưu tiên lấy contentBlocks_km
          const blocks = language === 'km' && data.contentBlocks_km
            ? data.contentBlocks_km
            : data.contentBlocks;

          if (blocks) {
            setContentBlocks(blocks);
          } else {
            setContentBlocks(DEFAULT_CONTENT_BLOCKS);
          }
          // Resolve hero image từ imageKey trên Firebase
          if (data.imageKey) {
            const key = data.imageKey as string;
            if (key.startsWith('http') || key.startsWith('https')) {
              // URL thẳng từ internet
              setHeroSource({ uri: key });
            } else {
              // Tên key ngắn → tra trong bảng ảnh nội bộ
              setHeroSource(getPagodaImage(key, key));
            }
          }
        } else {
          setContentBlocks(DEFAULT_CONTENT_BLOCKS);
        }
      } catch (error) {
        console.error("Error fetching pagoda details from Firebase: ", error);
        setContentBlocks(DEFAULT_CONTENT_BLOCKS);
      } finally {
        // Delay tối thiểu để vòng xoay hiển thị đủ lâu
        setTimeout(() => setLoadingContent(false), 1200);
      }
    };
    fetchPagodaDetails();
  }, [params.id, language]);

  // Resolve hero image: ưu tiên Firebase imageKey, sau đó params, cuối cùng dùng ID/name
  const imageUrl = params.imageUrl;
  let source = heroSource;
  if (!source) {
    if (typeof imageUrl === 'string') {
      if (imageUrl.startsWith('http') || imageUrl.startsWith('file://')) {
        source = { uri: imageUrl };
      } else if (/^\d+$/.test(imageUrl)) {
        source = Number(imageUrl);
      }
    } else if (typeof imageUrl === 'number') {
      source = imageUrl;
    }
  }
  if (!source) {
    source = getPagodaImage(params.id as string || '', params.name as string || '');
  }

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={source}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} style={styles.heartBtn}>
              <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#ff0000" : "#000"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Section - chỉ hiện khi đã load xong */}
        {!loadingContent && (
          <View style={styles.contentContainer}>
            {/* Title & Location */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>{params.name || t('pagoda_detail_title')}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={18} color="#FF7000" />
                <Text style={styles.locationText}>{params.location || t('address_not_updated')}</Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>{t('intro')}</Text>

              {contentBlocks && contentBlocks.length > 0 ? (
                contentBlocks.map((block, index) => {
                  if (block.type === 'text') {
                    return (
                      <Text
                        key={index}
                        style={[
                          styles.descriptionText,
                          language === 'km' && { fontSize: 18, lineHeight: 30, textAlign: 'left' }
                        ]}
                      >
                        {block.value}
                      </Text>
                    );
                  } else if (block.type === 'image') {
                    let imgSrc = block.value;
                    if (typeof imgSrc === 'string') {
                      if (imgSrc.startsWith('http') || imgSrc.startsWith('file://')) {
                        imgSrc = { uri: imgSrc };
                      } else {
                        imgSrc = getPagodaImage(imgSrc, imgSrc);
                      }
                    }
                    return (
                      <Image
                        key={index}
                        source={imgSrc}
                        style={styles.inlineImage}
                        resizeMode="cover"
                      />
                    );
                  }
                  return null;
                })
              ) : (
                <Text style={[styles.descriptionText, language === 'km' && { fontSize: 20, lineHeight: 30, textAlign: 'left' }]}>
                  {params.description || t('no_temple_data')}
                </Text>
              )}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]}>
                  <Ionicons name="navigate-circle" size={22} color="#fff" />
                  <Text style={styles.primaryBtnText}>{t('navigate_btn')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="game-controller" size={22} color="#1E293B" />
                  <Text style={styles.actionBtnText}>{t('quiz_title')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {loadingContent && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#FF0050" />
          <Text style={{ marginTop: 10, color: '#888' }}>{t('loading_content')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  heroContainer: {
    width: '100%',
    height: 380,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  heartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  contentContainer: {
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 20,
  },
  titleSection: {
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    marginLeft: 6,
    flexShrink: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 25,
    marginBottom: 15,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#F8F9FA',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  descSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 26,
    fontWeight: '500',
    textAlign: 'justify',
  },
  inlineImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginVertical: 18,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

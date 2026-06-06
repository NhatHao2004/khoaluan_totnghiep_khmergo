import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTemples } from '@/hooks/use-temples';
import { useThemeColor } from '@/hooks/use-theme-color';
import { toggleFavorite } from '@/services/firebase-service';
import { scale, verticalScale, moderateScale } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

// Placeholder for images - User will add later
const PAGODA_IMAGES: { [key: string]: any } = {
  default: require('@/assets/images/pagoda.jpg'),
  // by ID
  'pagoda_1': require('@/assets/images/chuaang.jpg'),
  'pagoda_2': require('@/assets/images/chuahang.jpg'),
  'pagoda_3': require('@/assets/images/kampong.jpg'),
  'pagoda_4': require('@/assets/images/salengcu.jpg'),
  'pagoda_5': require('@/assets/images/veluvana.jpg'),
  // by name key (fallback)
  'chua-ang': require('@/assets/images/chuaang.jpg'),
  'chua-hang': require('@/assets/images/chuahang.jpg'),
  'chua-kampong': require('@/assets/images/kampong.jpg'),
  'chua-sleng-cu': require('@/assets/images/salengcu.jpg'),
  'chua-veluvana': require('@/assets/images/veluvana.jpg'),
};

// Function to get pagoda image
const getPagodaImage = (templeId: string, templeName: string) => {
  // Try to match by ID first
  if (PAGODA_IMAGES[templeId as keyof typeof PAGODA_IMAGES]) {
    return PAGODA_IMAGES[templeId as keyof typeof PAGODA_IMAGES];
  }

  // Try to match by name
  const nameKey = templeName.toLowerCase()
    .replace(/chùa\s*/g, 'chua-')
    .replace(/\s+/g, '-')
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd');

  if (PAGODA_IMAGES[nameKey as keyof typeof PAGODA_IMAGES]) {
    return PAGODA_IMAGES[nameKey as keyof typeof PAGODA_IMAGES];
  }

  return PAGODA_IMAGES.default;
};

export default function PagodaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isKm = language === 'km';
  const tintColor = useThemeColor({}, 'tint');
  const { temples, loading, error, refresh } = useTemples();

  // Navigation helper
  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const normalizeText = (text: string) => {
    return text.toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd');
  };

  const handleToggleFavorite = async (id: string, currentStatus: boolean) => {
    if (!user) {
      Alert.alert(
        t('login_required'),
        t('login_to_use'),
        [
          { text: t('back'), style: 'cancel' },
          { text: t('login'), onPress: () => router.push('/login') }
        ]
      );
      return;
    }

    try {
      await toggleFavorite(id, !currentStatus);
      refresh();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };


  // Sắp xếp theo ID (pagoda_1 → pagoda_2 → ... → pagoda_5)
  const filteredPagodas = [...temples]
    .sort((a, b) => (a.id || '').localeCompare(b.id || ''));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={scale(28)} color="#000000" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>{t('temple').replace('\n', '')}</ThemedText>
        </View>

        {/* Empty view to balance the header (matching backBtn width) */}
        <View style={{ width: scale(40) }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <ThemedText style={styles.errorText}>
            {t('error_loading_temples') || 'Không thể tải dữ liệu chùa Khmer'}
          </ThemedText>
        ) : filteredPagodas.length === 0 && !loading ? (
          <ThemedText style={styles.emptyText}>
            {t('no_temple_data') || 'Chưa có dữ liệu chùa Khmer'}
          </ThemedText>
        ) : (
          <View style={styles.pagodaList}>
            {filteredPagodas.map((pagoda) => (
              <TouchableOpacity
                key={pagoda.id}
                style={styles.pagodaCard}
                onPress={() => router.push({
                  pathname: '/pagoda-detail',
                  params: {
                    id: pagoda.id,
                    name: isKm ? (pagoda.name_khmer || pagoda.name) : pagoda.name,
                    location: isKm ? (pagoda.location_khmer || pagoda.location) : pagoda.location,
                    rental: pagoda.rental,
                    description: pagoda.description,
                    imageUrl: pagoda.imageUrl,
                    imageUrl1: pagoda.imageUrl1,
                    category: pagoda.category,
                    favorite: pagoda.favorite?.toString(),
                    latitude: pagoda.latitude?.toString(),
                    longitude: pagoda.longitude?.toString(),
                    source: 'pagoda',
                  }
                })}
              >
                <View style={styles.pagodaImageContainer}>
                  <Image
                    source={
                      typeof pagoda.imageUrl === 'string' && pagoda.imageUrl !== ''
                        ? { uri: pagoda.imageUrl }
                        : pagoda.imageUrl
                          ? pagoda.imageUrl
                          : getPagodaImage(pagoda.id || '', pagoda.name)
                    }
                    style={styles.pagodaImage}
                    resizeMode="cover"
                    fadeDuration={0}
                  />
                </View>

                <View style={styles.pagodaContent}>
                  <ThemedText style={styles.pagodaName}>{isKm ? (pagoda.name_khmer || pagoda.name) : pagoda.name}</ThemedText>
                  <ThemedText style={styles.pagodaLocation}>
                    {isKm ? (pagoda.location_khmer || pagoda.location) : pagoda.location}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#FF0050" />
          <ThemedText style={{ marginTop: verticalScale(10), color: '#888' }}>{t('loading_content')}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: verticalScale(45),
    paddingBottom: verticalScale(15),
    paddingHorizontal: scale(15),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(10),
    elevation: 5,
    zIndex: 100
  },
  backBtn: { width: scale(40), height: scale(40), justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#000000', fontSize: moderateScale(20), fontWeight: '800', lineHeight: verticalScale(28) },
  content: { flex: 1 },
  scrollContent: { paddingBottom: verticalScale(20), flexGrow: 1 },
  pagodaList: { padding: scale(15), gap: verticalScale(15) },
  pagodaCard: { backgroundColor: '#ffffff', borderRadius: scale(20), overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', elevation: 2 },
  pagodaImageContainer: { width: '100%', aspectRatio: 16 / 10 },
  pagodaImage: { width: '100%', height: '100%' },
  pagodaContent: { padding: scale(15) },
  pagodaName: { fontSize: moderateScale(18), fontWeight: '800', color: '#1A1A1A', marginBottom: verticalScale(5) },
  pagodaLocation: { fontSize: moderateScale(13), color: '#666' },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  errorText: { textAlign: 'center', marginTop: verticalScale(50), color: 'red' },
  emptyText: { textAlign: 'center', marginTop: verticalScale(50), color: '#999' },
});

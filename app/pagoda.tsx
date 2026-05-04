import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTemples } from '@/hooks/use-temples';
import { useThemeColor } from '@/hooks/use-theme-color';
import { toggleFavorite } from '@/services/firebase-service';
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
  const { t } = useLanguage();
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


  // Sort alphabetically
  const filteredPagodas = [...temples]
    .sort((a, b) => {
      // Sort by temple name alphabetically (A-Z)
      const nameA = normalizeText(a.name);
      const nameB = normalizeText(b.name);
      return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
    });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>{t('temple').replace('\n', '')}</ThemedText>
        </View>

        {/* Empty view to balance the header (matching backBtn width) */}
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FF0050" style={styles.loader} />
        ) : error ? (
          <ThemedText style={styles.errorText}>
            {t('error_loading_temples') || 'Không thể tải dữ liệu chùa Khmer'}
          </ThemedText>
        ) : filteredPagodas.length === 0 ? (
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
                    name: pagoda.name,
                    location: pagoda.location,
                    rental: pagoda.rental,
                    description: pagoda.description,
                    imageUrl: pagoda.imageUrl,
                    category: pagoda.category,
                    isFavorite: pagoda.isFavorite?.toString(),
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
                  <ThemedText style={styles.pagodaName}>{pagoda.name}</ThemedText>
                  <ThemedText style={styles.pagodaLocation}>
                    {pagoda.location}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#ffffff', paddingTop: 45, paddingBottom: 15, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', elevation: 5, zIndex: 100 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#000000', fontSize: 20, fontWeight: '800' },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 20, flexGrow: 1 },
  pagodaList: { padding: 15, gap: 15 },
  pagodaCard: { backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', elevation: 2 },
  pagodaImageContainer: { width: '100%', aspectRatio: 16 / 10 },
  pagodaImage: { width: '100%', height: '100%' },
  pagodaContent: { padding: 15 },
  pagodaName: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 5 },
  pagodaLocation: { fontSize: 13, color: '#666' },
  loader: { marginTop: 50 },
  errorText: { textAlign: 'center', marginTop: 50, color: 'red' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
});

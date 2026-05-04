import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCultures } from '@/hooks/use-cultures';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

// Placeholder for images
const CULTURE_IMAGES: { [key: string]: any } = {
  default: require('@/assets/images/lehoi.jpg'),
  'oc-om-boc': require('@/assets/images/lehoi.jpg'),
  'ghe-ngo': require('@/assets/images/festival.jpg'),
};

const getCultureImage = (id: string, name: string) => {
  if (CULTURE_IMAGES[id as keyof typeof CULTURE_IMAGES]) {
    return CULTURE_IMAGES[id as keyof typeof CULTURE_IMAGES];
  }

  const nameKey = name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd');

  if (CULTURE_IMAGES[nameKey as keyof typeof CULTURE_IMAGES]) {
    return CULTURE_IMAGES[nameKey as keyof typeof CULTURE_IMAGES];
  }

  return CULTURE_IMAGES.default;
};

export default function CultureScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const tintColor = useThemeColor({}, 'tint');
  const { cultures, loading, error, refresh } = useCultures();

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

  const sortedCultures = [...cultures].sort((a, b) => {
    const nameA = normalizeText(a.name || '');
    const nameB = normalizeText(b.name || '');
    return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
            {t('culture')}
          </ThemedText>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={tintColor} style={styles.loader} />
        ) : error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : sortedCultures.length === 0 ? (
          <ThemedText style={styles.emptyText}>Chưa có dữ liệu văn hóa Khmer</ThemedText>
        ) : (
          <View style={styles.cultureList}>
            {sortedCultures.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.cultureCard}
                onPress={() => router.push({
                  pathname: '/culture-detail',
                  params: {
                    id: item.id,
                    name: item.name,
                    location: item.location,
                    description: item.description,
                    imageUrl: item.imageUrl,
                    category: item.category,
                    isFavorite: item.isFavorite?.toString(),
                    source: 'culture',
                  }
                })}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={
                      item.imageUrl && item.imageUrl !== ''
                        ? { uri: item.imageUrl }
                        : getCultureImage(item.id, item.name)
                    }
                    style={styles.cultureImage}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.cultureContent}>
                  <ThemedText style={styles.cultureName}>{item.name}</ThemedText>
                  <ThemedText style={styles.cultureLocation} numberOfLines={1}>
                    {item.location || t('address_not_updated')}
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 100,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  cultureList: {
    padding: 15,
    gap: 15,
  },
  cultureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  cultureImage: {
    width: '100%',
    height: '100%',
  },
  cultureContent: {
    padding: 15,
  },
  cultureName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  cultureLocation: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  loader: {
    marginTop: 50,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    color: 'red',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
  },
});

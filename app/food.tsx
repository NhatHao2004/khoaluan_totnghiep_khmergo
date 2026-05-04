import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFoods } from '@/hooks/use-foods';
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

const FOOD_IMAGES: { [key: string]: any } = {
  default: require('@/assets/images/amthuc.jpg'),
  'bun-nuoc-leo': require('@/assets/images/cuisine.jpg'),
};

const getFoodImage = (id: string, name: string) => {
  if (FOOD_IMAGES[id as keyof typeof FOOD_IMAGES]) {
    return FOOD_IMAGES[id as keyof typeof FOOD_IMAGES];
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

  if (FOOD_IMAGES[nameKey as keyof typeof FOOD_IMAGES]) {
    return FOOD_IMAGES[nameKey as keyof typeof FOOD_IMAGES];
  }

  return FOOD_IMAGES.default;
};

export default function FoodScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const tintColor = useThemeColor({}, 'tint');
  const { foods, loading, error, refresh } = useFoods();

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

  const sortedFoods = [...foods].sort((a, b) => {
    const nameA = normalizeText(a.name || '');
    const nameB = normalizeText(b.name || '');
    return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
            {t('food')}
          </ThemedText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={tintColor} style={styles.loader} />
        ) : error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : sortedFoods.length === 0 ? (
          <ThemedText style={styles.emptyText}>Chưa có dữ liệu ẩm thực Khmer</ThemedText>
        ) : (
          <View style={styles.foodList}>
            {sortedFoods.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.foodCard}
                onPress={() => router.push({
                  pathname: '/food-detail',
                  params: {
                    id: item.id,
                    name: item.name,
                    location: item.location,
                    description: item.description,
                    imageUrl: item.imageUrl,
                    category: item.category,
                    source: 'food',
                  }
                })}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={
                      item.imageUrl && item.imageUrl !== ''
                        ? { uri: item.imageUrl }
                        : getFoodImage(item.id, item.name)
                    }
                    style={styles.foodImage}
                  />
                </View>
                <View style={styles.foodContent}>
                  <ThemedText style={styles.foodName}>{item.name}</ThemedText>
                  <ThemedText style={styles.foodLocation} numberOfLines={1}>
                    {item.location || 'Đặc sản Khmer'}
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
  foodList: { padding: 15, gap: 15 },
  foodCard: { backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', elevation: 2 },
  imageContainer: { width: '100%', aspectRatio: 16 / 10 },
  foodImage: { width: '100%', height: '100%' },
  foodContent: { padding: 15 },
  foodName: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 5 },
  foodLocation: { fontSize: 13, color: '#666' },
  loader: { marginTop: 50 },
  errorText: { textAlign: 'center', marginTop: 50, color: 'red' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
});

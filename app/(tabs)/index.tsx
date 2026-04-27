import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const categories = [
  { id: 1, icon: require('@/assets/images/pagoda.jpg'), label: 'Chùa Khmer' },
  { id: 2, icon: require('@/assets/images/festival.jpg'), label: 'Văn hóa' },
  { id: 3, icon: require('@/assets/images/amthuc.jpg'), label: 'Ẩm thực' },
  { id: 6, icon: require('@/assets/images/hoctap.jpg'), label: 'Học tiếng Khmer' },
  { id: 4, icon: require('@/assets/images/tovisit.jpg'), label: 'Khám phá' },
  { id: 7, icon: require('@/assets/images/quiz.jpg'), label: 'Thử thách' },
];



export default function HomeScreen() {
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  // Animation cho logo
  const [logoAnim] = useState(new Animated.Value(0));

  const [searchQuery, setSearchQuery] = useState('');



  const handleCategoryPress = (categoryId: number) => {
    switch (categoryId) {
      case 1: // Chùa Khmer
        router.push('/pagoda' as any);
        break;
      case 2: // Văn hóa
        // TODO: Navigate to culture page
        break;
      case 3: // Ẩm thực
        // TODO: Navigate to food page
        break;
      case 4: // Điểm đến
        router.push('/explore' as any);
        break;
      default:
        console.log('Category not implemented yet:', categoryId);
    }
  };



  return (
    <View style={styles.container}>
      {/* Header with background image */}
      <ImageBackground
        source={require('@/assets/images/backgroud.jpg')}
        style={styles.header}
        imageStyle={styles.headerImage}
      >
        <View style={styles.headerOverlay}>
          <View style={styles.headerTop}>
            <View style={styles.greeting}>
              <ThemedText style={styles.appName}>KhmerGo</ThemedText>
              <ThemedText style={styles.tagline}>Khám phá nền văn hóa Khmer</ThemedText>
            </View>
          </View>


          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <ThemedText style={styles.searchIcon}>🔍</ThemedText>
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Tìm kiếm..."
                placeholderTextColor="#717171ff"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        </View>
      </ImageBackground>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Services Grid */}
        <View style={styles.servicesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.serviceItem}
                onPress={() => handleCategoryPress(category.id)}
              >
                <View style={styles.serviceIcon}>
                  <Image source={category.icon} style={styles.serviceIconImage} />
                </View>
                <ThemedText style={styles.serviceText} numberOfLines={2}>{category.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 220,
    position: 'relative',
  },
  headerImage: {
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerOverlay: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(196, 196, 196, 0.3)',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  greeting: {
    flex: 1,
  },
  appName: {
    fontSize: 38,
    fontWeight: '900',
    color: '#2C1810',
    marginBottom: 2,
    lineHeight: 40,
    includeFontPadding: true,
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(0, 0, 0, 0.9)',
    lineHeight: 28,
    includeFontPadding: true,
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerLogo: {
    width: 55,
    height: 55,
    borderRadius: 10,
    marginBottom: 10,
  },
  searchContainer: {
    marginTop: 'auto',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#666666',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333333',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  servicesSection: {
    backgroundColor: '#ffffff',
    padding: 18,
    paddingBottom: 10,
    marginHorizontal: 10,
    marginTop: -8,
    marginBottom: 0,
    borderRadius: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  serviceItem: {
    width: (Dimensions.get('window').width - 56) / 4,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  serviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  serviceIconImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  serviceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b6b6b',
    textAlign: 'center',
    lineHeight: 14,
  },


});

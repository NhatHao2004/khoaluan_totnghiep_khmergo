import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const textColor = useThemeColor({}, 'text');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);

  const categories = [
    { id: 0, label: t('temple'), key: 'temple' },
    { id: 1, label: t('culture'), key: 'culture' },
    { id: 2, label: t('food'), key: 'food' },
    { id: 3, label: t('language_study'), key: 'language_study' }
  ];

  const getActiveData = () => {
    switch (activeCategory) {
      case 0: // Temple
        return [
          { id: 101, name: t('som_rong_temple'), location: t('soc_trang_vn'), rating: '4.8', image: require('@/assets/images/pagoda.jpg') },
          { id: 102, name: 'Chùa Hang', location: t('tra_vinh_vn'), rating: '4.7', image: require('@/assets/images/backgroud.jpg') },
          { id: 103, name: 'Chùa Dơi', location: t('soc_trang_vn'), rating: '4.9', image: require('@/assets/images/pagoda.jpg') },
        ];
      case 1: // Culture
        return [
          { id: 201, name: t('oc_om_boc_festival'), location: t('tra_vinh_vn'), rating: '4.9', image: require('@/assets/images/festival.jpg') },
          { id: 202, name: 'Lễ hội Đua Ghe Ngo', location: t('soc_trang_vn'), rating: '4.8', image: require('@/assets/images/backgroud.jpg') },
          { id: 203, name: 'Múa Robam', location: t('tra_vinh_vn'), rating: '4.7', image: require('@/assets/images/festival.jpg') },
        ];
      case 2: // Food
        return [
          { id: 301, name: 'Bún Nước Lèo', location: t('tra_vinh_vn'), rating: '4.9', image: require('@/assets/images/amthuc.jpg') },
          { id: 302, name: 'Bánh Cống', location: t('soc_trang_vn'), rating: '4.8', image: require('@/assets/images/amthuc.jpg') },
          { id: 303, name: 'Cốm Dẹp', location: t('tra_vinh_vn'), rating: '4.7', image: require('@/assets/images/amthuc.jpg') },
        ];
      case 3: // Language Study
        return [
          { id: 401, name: 'Giao tiếp cơ bản', location: 'Trực tuyến', rating: '4.9', image: require('@/assets/images/hoctap.jpg') },
          { id: 402, name: 'Ngữ pháp Khmer', location: 'Trực tuyến', rating: '4.8', image: require('@/assets/images/hoctap.jpg') },
          { id: 403, name: 'Từ vựng hằng ngày', location: 'Trực tuyến', rating: '4.7', image: require('@/assets/images/hoctap.jpg') },
        ];
      default:
        return [];
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
              <ThemedText style={styles.tagline}>{t('tagline') || 'Khám phá nền văn hóa Khmer'}</ThemedText>
            </View>
          </View>


          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <ThemedText style={styles.searchIcon}>🔍</ThemedText>
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder={t('search_placeholder') || 'Tìm kiếm...'}
                placeholderTextColor="#717171ff"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        </View>
      </ImageBackground>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Promotions Section */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{t('promotions')}</ThemedText>
          <TouchableOpacity>
            <ThemedText style={styles.seeAllText}>{t('see_all')}</ThemedText>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promoScroll}
        >
          <ImageBackground
            source={require('@/assets/images/backgroud.jpg')}
            style={styles.promoCardLarge}
            imageStyle={{ borderRadius: 20 }}
          >
            <View style={styles.promoOverlay}>
              <ThemedText style={styles.promoText}>{t('promo_pagoda_title')}</ThemedText>
              <TouchableOpacity style={styles.promoBtn}>
                <ThemedText style={styles.promoBtnText}>{t('get_coupon')}</ThemedText>
              </TouchableOpacity>
            </View>
          </ImageBackground>

          <ImageBackground
            source={require('@/assets/images/backgroud.jpg')}
            style={styles.promoCardLarge}
            imageStyle={{ borderRadius: 20 }}
          >
            <View style={styles.promoOverlay}>
              <ThemedText style={styles.promoText}>{t('promo_pagoda_title')}</ThemedText>
              <TouchableOpacity style={styles.promoBtn}>
                <ThemedText style={styles.promoBtnText}>{t('get_coupon')}</ThemedText>
              </TouchableOpacity>
            </View>
          </ImageBackground>

          <ImageBackground
            source={require('@/assets/images/backgroud.jpg')}
            style={styles.promoCardLarge}
            imageStyle={{ borderRadius: 20 }}
          >
            <View style={styles.promoOverlay}>
              <ThemedText style={styles.promoText}>{t('promo_pagoda_title')}</ThemedText>
              <TouchableOpacity style={styles.promoBtn}>
                <ThemedText style={styles.promoBtnText}>{t('get_coupon')}</ThemedText>
              </TouchableOpacity>
            </View>
          </ImageBackground>

          <ImageBackground
            source={require('@/assets/images/backgroud.jpg')}
            style={styles.promoCardLarge}
            imageStyle={{ borderRadius: 20 }}
          >
            <View style={styles.promoOverlay}>
              <ThemedText style={styles.promoText}>{t('promo_pagoda_title')}</ThemedText>
              <TouchableOpacity style={styles.promoBtn}>
                <ThemedText style={styles.promoBtnText}>{t('get_coupon')}</ThemedText>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </ScrollView>

        {/* Category Pills */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{t('category')}</ThemedText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, activeCategory === cat.id && styles.categoryPillActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <ThemedText style={[styles.categoryPillText, activeCategory === cat.id && styles.categoryPillTextActive]}>
                {cat.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Dynamic Section Title */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>
            {categories.find(c => c.id === activeCategory)?.label}
          </ThemedText>
        </View>

        {/* Dynamic Content Grid */}
        <View style={styles.destinationContainer}>
          {getActiveData().map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.destCard}
              onPress={() => {
                if (activeCategory === 0) {
                  router.push('/pagoda' as any);
                }
              }}
            >
              <ImageBackground source={item.image} style={styles.destImage} imageStyle={{ borderRadius: 25 }}>
                <View style={styles.destOverlay}>
                  <View style={styles.destInfo}>
                    <ThemedText style={styles.destName}>{item.name}</ThemedText>
                    <View style={styles.destLocation}>
                      <ThemedText style={styles.pinIcon}>📍</ThemedText>
                      <ThemedText style={styles.locationText}>{item.location}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.destRating}>
                    <ThemedText style={styles.starIconSmall}>⭐</ThemedText>
                    <ThemedText style={styles.ratingTextSmall}>{item.rating}</ThemedText>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 80 }} />
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
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceIconImage: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  serviceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b6b6b',
    textAlign: 'center',
    lineHeight: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginTop: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6347',
    fontWeight: '600',
  },
  promoScroll: {
    paddingLeft: 25,
    paddingRight: 10,
  },
  promoCardLarge: {
    width: Dimensions.get('window').width * 0.7,
    height: 160,
    marginRight: 15,
    justifyContent: 'flex-end',
  },
  promoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 20,
    borderRadius: 20,
    justifyContent: 'center',
  },
  promoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 15,
    lineHeight: 24,
  },
  promoBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  promoCardSmall: {
    width: Dimensions.get('window').width * 0.45,
    height: 160,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
  },
  promoTextSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
    lineHeight: 20,
  },
  promoBtnSmall: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  promoBtnTextSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  categoryScroll: {
    paddingLeft: 25,
    paddingRight: 10,
    marginBottom: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  categoryPillActive: {
    backgroundColor: '#FF6347', // Orange/Salmon
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    lineHeight: 20,
  },
  categoryPillTextActive: {
    color: '#FFF',
  },
  destinationContainer: {
    paddingHorizontal: 25,
    marginTop: 20,
    gap: 20,
  },
  destCard: {
    width: '100%',
    height: 220,
    borderRadius: 25,
    overflow: 'hidden',
  },
  destImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  destOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  destInfo: {
    flex: 1,
  },
  destName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  destLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pinIcon: {
    fontSize: 12,
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  destRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  starIconSmall: {
    fontSize: 12,
  },
  ratingTextSmall: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
});

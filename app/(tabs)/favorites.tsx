import { useLanguage } from '@/contexts/LanguageContext';
import { toggleFavorite } from '@/services/firebase-service';
import { db } from '@/utils/firebaseConfig';
import { scale, verticalScale, moderateScale } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';


export default function FavoritesScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();

  // Tích hợp dữ liệu realtime từ Firebase Firebase
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'destinations'),
      where('favorite', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dbFavs: any[] = [];
        snapshot.forEach((doc) => {
          dbFavs.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setFavorites(dbFavs);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching favorites:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const removeFavorite = async (id: string) => {
    try {
      await toggleFavorite(id, false);
      // Dữ liệu sẽ tự động được xoá khỏi UI do onSnapshot
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handlePressItem = (item: any) => {
    let detailRoute = '/(tabs)/index';
    if (item.category === 'Chùa') detailRoute = '/pagoda-detail';
    else if (item.category === 'Văn hóa') detailRoute = '/culture-detail';
    else if (item.category === 'Ẩm thực') detailRoute = '/food-detail';

    router.push({
      pathname: detailRoute as any,
      params: {
        id: item.id,
        name: item.name,
        location: item.location,
        description: item.description,
        imageUrl: item.imageUrl,
        latitude: item.latitude,
        longitude: item.longitude,
        favorite: 'true',
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scale(26)} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('favorites')}</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="heart-dislike-outline" size={scale(50)} color="#FF4D4D" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có mục yêu thích nào</Text>
            <Text style={styles.emptySub}>Hãy khám phá và lưu lại những điều{'\n'}bạn yêu thích nhé</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {favorites.map((item, index) => (
              <View key={item.id}>
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() => handlePressItem(item)}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />

                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {language === 'km' ? (item.name_khmer || item.name) : item.name}
                    </Text>
                    <View style={styles.cardLocationBox}>
                      <Text style={styles.cardLocation} numberOfLines={3}>
                        {language === 'km' ? (item.location_khmer || item.location) : item.location}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#FAFAFA',
    paddingTop: verticalScale(33),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(15),
    backgroundColor: '#FAFAFA',
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: verticalScale(20),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: verticalScale(240),
    paddingHorizontal: scale(30),
  },
  emptyIconCircle: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(20),
  },
  emptyTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: verticalScale(10),
    textAlign: 'center',
  },
  emptySub: {
    fontSize: moderateScale(14),
    color: '#666',
    textAlign: 'center',
    lineHeight: verticalScale(22),
    marginBottom: verticalScale(30),
  },
  exploreButton: {
    backgroundColor: '#FF0050',
    paddingHorizontal: scale(30),
    paddingVertical: verticalScale(15),
    borderRadius: scale(25),
    elevation: 3,
    shadowColor: '#FF0050',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(5),
  },
  exploreText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
  listContainer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: verticalScale(15),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    marginBottom: verticalScale(15),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.05,
    shadowRadius: scale(5),
  },
  cardImage: {
    width: scale(65),
    height: scale(65),
    borderRadius: scale(15),
    marginRight: scale(15),
    resizeMode: 'contain',
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: verticalScale(6),
  },
  cardLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLocation: {
    fontSize: moderateScale(10),
    color: '#666',
    marginLeft: scale(4),
    flexShrink: 1,
  },
  heartButton: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(18),
    borderWidth: 1.5,
    borderColor: '#f6f1f1ff',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

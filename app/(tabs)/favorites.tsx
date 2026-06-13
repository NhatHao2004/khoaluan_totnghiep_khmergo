import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function FavoritesScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    // Query User's specific favorites sub-collection
    const q = query(
      collection(db, 'users', user.uid, 'favorites'),
      orderBy('favoriteAt', 'desc')
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
  }, [user?.uid]);



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

  if (!user || user.isAnonymous) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('favorites')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="lock-closed-outline" size={50} color="#3B82F6" />
          </View>
          <Text style={styles.emptyTitle}>Yêu cầu đăng nhập</Text>
          <Text style={styles.emptySub}>Vui lòng đăng nhập để lưu và xem{'\n'}danh sách yêu thích của bạn</Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.exploreText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('favorites')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#FF0050" style={{ marginTop: 50 }} />
        ) : favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="heart-dislike-outline" size={50} color="#FF4D4D" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có mục yêu thích nào</Text>
            <Text style={styles.emptySub}>Hãy khám phá và lưu lại những điều{'\n'}bạn yêu thích nhé</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {favorites.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => handlePressItem(item)}
              >
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardRental} numberOfLines={1}>{item.rental}</Text>
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
    backgroundColor: '#FAFAFA',
    paddingTop: 33,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#FAFAFA',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 250,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  exploreButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
  },
  exploreText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,

    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    gap: 12,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: -15,
  },
  cardRental: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

});

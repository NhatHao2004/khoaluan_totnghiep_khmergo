import { useLanguage } from '@/contexts/LanguageContext';
import { toggleFavorite } from '@/services/firebase-service';
import { db } from '@/utils/firebaseConfig';
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={25} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('favorites')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="heart-dislike-outline" size={50} color="#FF4D4D" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có mục yêu thích nào</Text>
            <Text style={styles.emptySub}>Hãy khám phá và lưu lại những địa điểm{'\n'}bạn yêu thích nhé.</Text>
            <TouchableOpacity
              style={styles.exploreButton}
            >
              <Text style={styles.exploreText}>Khám phá ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {favorites.map((item, index) => (
              <View key={item.id}>
                <TouchableOpacity style={styles.card} activeOpacity={0.8}>
                  <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />

                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {language === 'km' ? (item.name_khmer || item.name) : item.name}
                    </Text>
                    <View style={styles.cardLocationBox}>
                      <Ionicons name="location" size={14} color="#FF6B6B" />
                      <Text style={styles.cardLocation} numberOfLines={1}>
                        {language === 'km' ? (item.location_khmer || item.location) : item.location}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.heartButton}
                    onPress={() => removeFavorite(item.id)}
                  >
                    <Ionicons name="heart" size={24} color="#FF4D4D" />
                  </TouchableOpacity>
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
    fontWeight: '400',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 190,
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
    fontWeight: '400',
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
    backgroundColor: '#FF0050',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#FF0050',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  exploreText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '400',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardImage: {
    width: 65,
    height: 65,
    borderRadius: 15,
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  cardLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLocation: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
    flexShrink: 1,
  },
  heartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#f6f1f1ff',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

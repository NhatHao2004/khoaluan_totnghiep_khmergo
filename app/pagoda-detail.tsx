import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Dimensions, Image, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.40;

type TabKey = 'details' | 'location';

export default function PagodaDetailScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useLocalSearchParams();

  const id = params.id as string;
  const initialName = (params.name as string) || '';
  const initialLocation = (params.location as string) || '';
  const initialRental = params.rental === 'true';
  const initialDescription = (params.description as string) || '';
  const initialImageUrl = params.imageUrl as string;
  const initialIsFavorite = params.isFavorite === 'true';

  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [templeData, setTempleData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('details');

  useEffect(() => {
    if (!id) return;
    const docRef = doc(db, 'destinations', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) setTempleData(docSnap.data());
    }, (error) => console.error('Error fetching temple detail:', error));
    return () => unsubscribe();
  }, [id]);

  const name = templeData?.name || initialName;
  const location = templeData?.location || initialLocation;
  const rental = templeData?.rental !== undefined ? !!templeData.rental : initialRental;
  const description = templeData?.description || templeData?.detailedDescription || initialDescription;
  const contentBlocks = templeData?.contentBlocks || [];
  const imageUrl = templeData?.imageUrl || initialImageUrl;

  const imageSource = imageUrl && typeof imageUrl === 'string' && imageUrl !== ''
    ? { uri: imageUrl }
    : null;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'details', label: t('description') || 'Chi tiết' },
    { key: 'location', label: t('location') || 'Vị trí' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Hero image (fixed, behind everything) ── */}
      <View style={styles.heroContainer}>
        {imageSource ? (
          <Image source={imageSource} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Ionicons name="image-outline" size={72} color="rgba(255,255,255,0.3)" />
          </View>
        )}
        {/* top nav bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} style={styles.navBtn}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#ff0000ff' : '#000'}
            />
          </TouchableOpacity>
        </View>

      </View>

      {/* ── Scrollable content card ── */}
      <View style={styles.card}>
        {/* tab bar */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {activeTab === 'details' && (
            <View>
              <Text style={styles.sectionTitle}>{name}</Text>
              {description ? (
                <Text style={styles.bodyText}>{description}</Text>
              ) : null}

              {/* Dynamic Content Blocks */}
              {contentBlocks.map((block: any, index: number) => (
                <View key={index} style={styles.blockContainer}>
                  {/* Hiển thị ảnh nếu có trong block */}
                  {block.images ? (
                    <Image
                      source={{ uri: block.images }}
                      style={styles.blockImage}
                      resizeMode="cover"
                    />
                  ) : null}

                  {/* Nếu type là title thì hiển thị như tiêu đề, còn lại hiển thị như nội dung */}
                  {block.type === 'title' ? (
                    <Text style={styles.blockTitle}>{block.value}</Text>
                  ) : (
                    <Text style={styles.bodyText}>{block.value}</Text>
                  )}
                </View>
              ))}

              {!description && contentBlocks.length === 0 && (
                <Text style={styles.emptyText}>
                  {t('no_description') || 'Chưa có mô tả cho ngôi chùa này.'}
                </Text>
              )}
            </View>
          )}

          {activeTab === 'location' && (
            <View>
              <Text style={styles.sectionTitle}>{t('location') || 'Vị trí'}</Text>
              {location ? (
                <View style={styles.locationCard}>
                  <Ionicons name="location" size={20} color="#FF0050" />
                  <Text style={styles.locationCardText}>{location}</Text>
                </View>
              ) : null}
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={44} color="#c5cfe0" />
                <Text style={styles.mapPlaceholderText}>
                  {t('view_map') || 'Xem bản đồ'}
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },

  /* ── hero ── */
  heroContainer: {
    width,
    height: HERO_HEIGHT,
    position: 'absolute',
    top: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    backgroundColor: '#ffffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* nav bar */
  navBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  /* ── content card ── */
  card: {
    flex: 1,
    marginTop: HERO_HEIGHT - 28,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  /* tab bar */
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 30,
    paddingTop: 18,
    paddingBottom: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 22,
  },
  tabActive: {
    backgroundColor: '#0d0d1a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#fff',
  },

  /* scroll content */
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 26,
    textAlign: 'justify',
  },
  blockContainer: {
    marginTop: 25,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  blockImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    lineHeight: 22,
  },

  /* location tab */
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff5f7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  locationCardText: {
    fontSize: 15,
    color: '#334155',
    flex: 1,
    lineHeight: 22,
  },
  mapPlaceholder: {
    height: 150,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    gap: 10,
  },
  mapPlaceholderText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },

  /* challenge tab */
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: '#fffbeb',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  challengeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  challengeCardDesc: {
    fontSize: 13,
    color: '#b45309',
    lineHeight: 18,
  },
  challengeBtn: {
    backgroundColor: '#0d0d1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  challengeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});

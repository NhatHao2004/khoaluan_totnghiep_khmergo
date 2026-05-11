import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuizSkeleton } from '@/components/quiz-skeleton';
import { getLeaderboardUsers } from '@/services/firebase-service';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function QuizScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [userRank, setUserRank] = useState<string | number>('---');
  const [quizLoading, setQuizLoading] = useState(true);
  const lastFetchTime = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuizLoading(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const fetchRank = async (force = false) => {
    // Only fetch if forced or it's been more than 30 seconds
    const now = Date.now();
    if (!force && lastFetchTime.current && now - lastFetchTime.current < 30000) {
      return;
    }

    if (!user) {
      if (userRank !== '---') setUserRank('---');
      return;
    }
    try {
      const users = await getLeaderboardUsers(100);
      const index = users.findIndex(u => u.uid === user.uid);
      const newRank = index !== -1 ? index + 1 : '>100';
      if (newRank !== userRank) {
        setUserRank(newRank);
      }
      lastFetchTime.current = Date.now();
    } catch (error) {
      console.log('Error fetching rank:', error);
      if (userRank !== '---') setUserRank('---');
    }
  };

  useEffect(() => {
    fetchRank();
  }, [user?.uid]);

  useFocusEffect(
    React.useCallback(() => {
      fetchRank();
    }, [user?.uid])
  );

  if (quizLoading) {
    return <QuizSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('quiz_title')}</Text>
      </View>

      <View
        style={styles.scrollContent}
      >
        {/* Profile Card - Floating */}
        <View style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarWrapper}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.cardAvatar} />
              ) : (
                <Ionicons name="person-circle-outline" size={70} color="#000000ff" />
              )}
            </View>

            <View style={styles.nameContainer}>
              <Text style={styles.cardName} numberOfLines={1}>{user?.name || t('guest')}</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.cardRankText}>
                  {`${t('current_rank')}: ${userRank}`}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.points || 0}</Text>
              <Text style={styles.statLabel}>{t('points')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>{t('completed')}</Text>
            </View>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t('categories')}</Text>
            <Text style={styles.sectionSubtitle}>{t('choose_topic')}</Text>
          </View>
        </View>

        <View style={styles.bentoContainer}>
          <View style={styles.bentoRow}>
            {/* Pagoda Quiz - Featured & ACTIVE */}
            <View style={{ flex: 1.2 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.bentoCard, { height: 220 }]}
                onPress={() => {
                  if (!user) {
                    Alert.alert(
                      t('login_required'),
                      t('login_to_use'),
                      [
                        { text: 'Huỷ', style: 'cancel' },
                        { text: 'Đăng nhập', onPress: () => router.push('/login') },
                      ]
                    );
                    return;
                  }
                  router.push('/quiz-pagoda');
                }}
              >
                <Text style={styles.bentoTitle} numberOfLines={2}>{t('pagoda_quiz')}</Text>
                <View style={styles.bentoImageContainer}>
                  <Image source={require('@/assets/images/pagoda.jpg')} style={styles.bentoImage} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Right Column – Coming soon items */}
            <View style={{ flex: 1, gap: 15 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.bentoCard, { height: 102.5 }]}
                onPress={() => Alert.alert('Sắp ra mắt')}
              >
                <Text style={styles.bentoTitleSmall} numberOfLines={1}>{t('culture_quiz')}</Text>
                <View style={styles.bentoImageContainerSmall}>
                  <Image source={require('@/assets/images/festival.jpg')} style={styles.bentoImage} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.bentoCard, { height: 102.5 }]}
                onPress={() => Alert.alert('Sắp ra mắt')}
              >
                <Text style={styles.bentoTitleSmall} numberOfLines={1}>{t('food_quiz')}</Text>
                <View style={styles.bentoImageContainerSmall}>
                  <Image source={require('@/assets/images/amthuc.jpg')} style={styles.bentoImage} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Full Width Card - Vocab Quiz */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.bentoCardFull, { marginTop: 15 }]}
            onPress={() => {
              if (!user) {
                Alert.alert(
                  t('login_required'),
                  t('login_to_use'),
                  [
                    { text: 'Huỷ', style: 'cancel' },
                    { text: 'Đăng nhập', onPress: () => router.push('/login') },
                  ]
                );
                return;
              }
              router.push('/vocab_quiz');
            }}
          >
            <View style={styles.bentoFullContent}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bentoTitle, { textAlign: 'left' }]}>{t('vocab_quiz')}</Text>
                <Text style={[styles.bentoSubtitle, { textAlign: 'left' }]}>Học từ vựng qua hình ảnh</Text>
              </View>
              <View style={styles.bentoImageContainerFull}>
                <Image source={require('@/assets/images/hoctap.jpg')} style={styles.bentoImage} />
              </View>
            </View>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minHeight: 50,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000ff',
    lineHeight: 32,
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 25,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  avatarWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffffff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardAvatar: {
    width: '100%',
    height: '100%',
  },
  nameContainer: {
    flex: 1,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000ff',
    marginBottom: 4,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
    paddingHorizontal: 0,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  cardRankText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000ff',
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffffff',
    borderRadius: 16,
    paddingVertical: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'left',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
    textAlign: 'left',
  },
  bentoContainer: {
    width: '100%',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 15,
  },
  bentoCard: {
    borderRadius: 24,
    padding: 16,
    overflow: 'visible',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2, // Reduced elevation to avoid gray artifacts
  },
  bentoCardFull: {
    width: '100%',
    height: 180,
    borderRadius: 24,
    padding: 20,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2, // Reduced elevation to avoid gray artifacts
  },

  bentoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 26, // Tăng lên để không cắt dấu
    textAlign: 'center',
  },
  bentoTitleSmall: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 20, // Thêm lineHeight
    textAlign: 'center',
  },
  bentoSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  bentoImageContainer: {
    width: 110,
    height: 110,
    opacity: 1,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bentoImageContainerSmall: {
    width: 50,
    height: 50,
    opacity: 1,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  bentoImageContainerFull: {
    width: 110,
    height: 110,
    opacity: 1,
    backgroundColor: 'transparent', // Ensure transparency
    borderRadius: 20,
    overflow: 'hidden',
  },
  bentoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Changed back to show the full image
  },
  bentoFullContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  activeBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#FF6B2C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  comingSoonTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  comingSoonTagText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
  },
  comingSoonText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
  },
  bentoDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'left',
  },
});

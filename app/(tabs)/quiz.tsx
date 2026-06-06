import { QuizSkeleton } from '@/components/quiz-skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLeaderboardUsers } from '@/services/firebase-service';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from '@/utils/responsive';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function QuizScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [userRank, setUserRank] = useState<string | number>('');
  const [quizLoading, setQuizLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const lastFetchTime = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuizLoading(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const fetchRank = async (force = false) => {
    if (!user || user.isAnonymous) {
      if (userRank !== 0) setUserRank(0);
      return;
    }

    const now = Date.now();
    if (!force && lastFetchTime.current && now - lastFetchTime.current < 30000) {
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
      setUserRank('---');
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

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: verticalScale(25) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card - Floating */}
        <View style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarWrapper}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.cardAvatar} />
              ) : (
                <Ionicons name="person-circle-outline" size={scale(70)} color="#000000ff" />
              )}
            </View>

            <View style={styles.nameContainer}>
              <Text style={styles.cardName} numberOfLines={1} adjustsFontSizeToFit>{user?.name || t('guest')}</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.cardRankText} numberOfLines={1} adjustsFontSizeToFit>
                  {`${t('current_rank')}: ${userRank}`}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(user && !user.isAnonymous) ? (user.points || 0) : 0}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>{t('points')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(user && !user.isAnonymous) ? (user.completedQuizzes || 0) : 0}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>{t('completed')}</Text>
            </View>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle} numberOfLines={1} adjustsFontSizeToFit>{t('categories')}</Text>
            <Text style={styles.sectionSubtitle} numberOfLines={1} adjustsFontSizeToFit>{t('choose_topic')}</Text>
          </View>
        </View>

        <View style={styles.bentoContainer}>
          <View style={styles.bentoRow}>
            {/* Pagoda Quiz - Featured & ACTIVE */}
            <View style={{ flex: 1.2 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.bentoCard, { height: verticalScale(295) }]}
                onPress={() => {
                  if (!user || user.isAnonymous) {
                    setShowLoginModal(true);
                    return;
                  }
                  router.push('/quiz-pagoda');
                }}
              >
                <View style={styles.bentoTitleContainer}>
                  <Text style={styles.bentoTitle} numberOfLines={2}>{t('pagoda_quiz')}</Text>
                </View>
                <View style={[styles.bentoImageContainer, { flex: 1, marginTop: verticalScale(10) }]}>
                  <Image source={require('@/assets/images/pagoda.jpg')} style={styles.bentoImage} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Right Column – Coming soon items */}
            <View style={{ flex: 1, gap: scale(15) }}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.bentoCard, { height: verticalScale(140) }]}
                onPress={() => {
                  if (!user || user.isAnonymous) {
                    setShowLoginModal(true);
                    return;
                  }
                  router.push('/quiz-culture');
                }}
              >
                <View style={[styles.bentoTitleContainer, { height: verticalScale(25) }]}>
                  <Text style={[styles.bentoTitleSmall, { lineHeight: verticalScale(34) }]} numberOfLines={1}>{t('culture_quiz')}</Text>
                </View>
                <View style={[styles.bentoImageContainerSmall, { flex: 1 }]}>
                  <Image source={require('@/assets/images/festival.jpg')} style={styles.bentoImage} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.bentoCard, { height: verticalScale(140) }]}
                onPress={() => {
                  if (!user || user.isAnonymous) {
                    setShowLoginModal(true);
                    return;
                  }
                  router.push('/quiz-food');
                }}
              >
                <View style={[styles.bentoTitleContainer, { height: verticalScale(25) }]}>
                  <Text style={[styles.bentoTitleSmall, { lineHeight: verticalScale(34) }]} numberOfLines={1}>{t('food_quiz')}</Text>
                </View>
                <View style={[styles.bentoImageContainerSmall, { flex: 1 }]}>
                  <Image source={require('@/assets/images/amthuc.jpg')} style={styles.bentoImage} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Full Width Card - Vocab Quiz */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.bentoCardFull, { marginTop: verticalScale(10) }]}
            onPress={() => {
              if (!user || user.isAnonymous) {
                setShowLoginModal(true);
                return;
              }
              router.push('/vocab_quiz');
            }}
          >
            <View style={styles.bentoFullContent}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bentoTitle, { textAlign: 'left' }]} numberOfLines={1}>{t('vocab_quiz')}</Text>
                <Text style={[styles.bentoSubtitle, { textAlign: 'left' }]} numberOfLines={1}>{t('vocab_quiz_subtitle')}</Text>
              </View>
              <View style={styles.bentoImageContainerFull}>
                <Image source={require('@/assets/images/hoctap.jpg')} style={styles.bentoImage} />
              </View>
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Custom Login Modal */}
      <Modal
        visible={showLoginModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: scale(24) }}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="person-circle-outline" size={scale(40)} color="#3B82F6" />
            </View>
            <Text style={styles.modalTitle}>{t('login_required')}</Text>
            <Text style={styles.modalSub}>{t('login_to_use')}</Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setShowLoginModal(false);
                  router.push('/login');
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>Đăng nhập</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setShowLoginModal(false)}
              >
                <Text style={styles.modalSecondaryBtnText}>Quay lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: verticalScale(40),
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(20),
    minHeight: verticalScale(50),
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: '900',
    color: '#000000ff',
    lineHeight: verticalScale(32),
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(24),
    padding: scale(25),
    marginBottom: verticalScale(15),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    height: verticalScale(200),
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(15),
    marginBottom: verticalScale(20),
  },
  avatarWrapper: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
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
    fontSize: moderateScale(22),
    fontWeight: '900',
    color: '#000000ff',
    marginBottom: verticalScale(4),
    lineHeight: verticalScale(30),
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
    paddingHorizontal: 0,
    paddingVertical: verticalScale(2),
    borderRadius: scale(10),
    alignSelf: 'flex-start',
    gap: scale(6),
    height: verticalScale(25),
  },
  cardRankText: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#000000ff',
    lineHeight: verticalScale(20),
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffffff',
    borderRadius: scale(16),
    paddingVertical: verticalScale(15),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(5),
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  statValue: {
    fontSize: moderateScale(18),
    fontWeight: '900',
    color: '#1E293B',
    lineHeight: verticalScale(24),
  },
  statLabel: {
    fontSize: moderateScale(12),
    color: '#64748B',
    fontWeight: '600',
    marginTop: verticalScale(2),
    textAlign: 'center',
    height: verticalScale(18),
  },
  sectionHeader: {
    marginBottom: verticalScale(20),
    alignItems: 'flex-start',
    height: verticalScale(60),
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: moderateScale(22),
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'left',
    lineHeight: verticalScale(30),
  },
  sectionSubtitle: {
    fontSize: moderateScale(14),
    color: '#64748B',
    marginTop: verticalScale(2),
    textAlign: 'left',
    lineHeight: verticalScale(20),
  },
  bentoContainer: {
    width: '100%',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: scale(15),
  },
  bentoCard: {
    borderRadius: scale(24),
    padding: scale(16),
    overflow: 'visible',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.05,
    shadowRadius: scale(5),
    elevation: 2,
  },
  bentoTitleContainer: {
    width: '100%',
    height: '25%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(5),
  },
  bentoCardFull: {
    width: '100%',
    height: verticalScale(180),
    borderRadius: scale(24),
    padding: scale(20),
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.05,
    shadowRadius: scale(5),
    elevation: 2,
  },

  bentoTitle: {
    fontSize: moderateScale(20),
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: verticalScale(28),
    textAlign: 'center',
  },
  bentoTitleSmall: {
    fontSize: moderateScale(14),
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: verticalScale(24),
    textAlign: 'center',
  },
  bentoSubtitle: {
    fontSize: moderateScale(12),
    color: '#64748B',
    fontWeight: '600',
    marginTop: verticalScale(2),
    textAlign: 'center',
    lineHeight: verticalScale(18),
  },
  bentoImageContainer: {
    width: scale(110),
    height: scale(110),
    opacity: 1,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    borderRadius: scale(25),
    overflow: 'hidden',
  },
  bentoImageContainerSmall: {
    width: scale(70),
    height: scale(70),
    opacity: 1,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(5),
    borderRadius: scale(15),
    overflow: 'hidden',
  },
  bentoImageContainerFull: {
    width: scale(110),
    height: scale(110),
    opacity: 1,
    backgroundColor: 'transparent',
    borderRadius: scale(20),
    overflow: 'hidden',
  },
  bentoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  bentoFullContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  activeBadge: {
    position: 'absolute',
    bottom: verticalScale(12),
    right: scale(12),
    backgroundColor: '#FF6B2C',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(8),
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: moderateScale(10),
    fontWeight: '800',
  },
  comingSoonTag: {
    position: 'absolute',
    bottom: verticalScale(8),
    right: scale(8),
    backgroundColor: '#F1F5F9',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(3),
    borderRadius: scale(6),
  },
  comingSoonTagText: {
    color: '#94A3B8',
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
  comingSoonText: {
    color: '#94A3B8',
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
  bentoDesc: {
    fontSize: moderateScale(12),
    color: '#64748B',
    marginTop: verticalScale(4),
    textAlign: 'left',
  },
  // Pilgrimage Card Styles
  pilgrimageCard: {
    marginBottom: verticalScale(20),
    borderRadius: scale(24),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.2,
    shadowRadius: scale(20),
  },
  pilgrimageGradient: {
    padding: scale(24),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pilgrimageInfo: {
    flex: 1,
  },
  pLabel: {
    color: '#3B82F6',
    fontSize: moderateScale(10),
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: verticalScale(4),
  },
  pTitle: {
    color: '#FFF',
    fontSize: moderateScale(24),
    fontWeight: '900',
    marginBottom: verticalScale(4),
  },
  pDesc: {
    color: '#94A3B8',
    fontSize: moderateScale(13),
    fontWeight: '500',
    marginBottom: verticalScale(15),
  },
  pBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFCC00',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(12),
    gap: scale(6),
  },
  pBadgeText: {
    color: '#000',
    fontSize: moderateScale(11),
    fontWeight: '800',
  },
  pIconBox: {
    marginLeft: scale(15),
  },

  // --- Premium Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(24),
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: scale(32),
    padding: scale(30),
    width: '100%',
    maxWidth: scale(340),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.1,
    shadowRadius: scale(20),
    elevation: 10,
  },
  modalIconCircle: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  modalSub: {
    fontSize: moderateScale(15),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: verticalScale(22),
    marginBottom: verticalScale(24),
  },
  modalActionRow: {
    width: '100%',
    gap: scale(12),
  },
  modalPrimaryBtn: {
    backgroundColor: '#3B82F6',
    height: verticalScale(56),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.2,
    shadowRadius: scale(8),
    elevation: 4,
  },
  modalPrimaryBtnText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
  modalSecondaryBtn: {
    backgroundColor: '#EF4444',
    height: verticalScale(56),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalSecondaryBtnText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
});
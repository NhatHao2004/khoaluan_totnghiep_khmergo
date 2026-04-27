import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLeaderboardUsers } from '@/services/firebase-service';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function QuizScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [userRank, setUserRank] = useState<string | number>('---');

  const fetchRank = async () => {
    if (!user) return;
    const users = await getLeaderboardUsers(100);
    const index = users.findIndex(u => u.uid === user.uid);
    if (index !== -1) {
      setUserRank(index + 1);
    } else {
      setUserRank('>100');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchRank();
    }, [user])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('quiz_title')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.profileCard}>
          <View style={{ zIndex: 10 }}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarWrapper}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.cardAvatar} />
                ) : (
                  <Ionicons name="person-circle-outline" size={70} color="#000000ff" />

                )}

              </View>

              <View style={styles.nameContainer}>
                <Text style={styles.cardName}>{user?.name || t('guest')}</Text>
                <View style={styles.rankBadge}>
                  <Text style={styles.cardSubtitle}>{t('current_rank')}: {userRank}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.points || 0}</Text>
                <Text style={styles.statLabel}>{t('total_score')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0/0</Text>
                <Text style={styles.statLabel}>{t('completed')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.accuracy || 0}%</Text>
                <Text style={styles.statLabel}>{t('accuracy')}</Text>
              </View>
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
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.bentoCardTall, { backgroundColor: '#FFD18B', flex: 0.8 }]}
            >
              <Text style={styles.bentoTitle} numberOfLines={1}>{t('pagoda_quiz')}</Text>
              <Text style={styles.bentoSubtitle}>10 {t('questions')}</Text>
              <View style={styles.bentoSpacer} />
              <View style={styles.bentoImageContainerLarge}>
                <Image
                  source={require('@/assets/images/pagoda.jpg')}
                  style={styles.bentoImageInside}
                />
              </View>
            </TouchableOpacity>

            {/* Right Column - Stacked Cards */}
            <View style={styles.bentoRightCol}>
              <TouchableOpacity
                activeOpacity={1}
                style={[styles.bentoCardSquare, { backgroundColor: '#B8E1FF' }]}
              >
                <View style={styles.bentoImageContainerSmall}>
                  <Image
                    source={require('@/assets/images/festival.jpg')}
                    style={styles.bentoImageInside}
                  />
                </View>
                <Text style={styles.bentoTitleSmall} numberOfLines={1}>{t('culture_quiz')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={1}
                style={[styles.bentoCardWide, { backgroundColor: '#FFB8EF' }]}
              >
                <View style={styles.bentoSocialIcons}>
                  <View style={styles.bentoImageContainerSmallInline}>
                    <Image
                      source={require('@/assets/images/amthuc.jpg')}
                      style={styles.bentoImageInside}
                    />
                  </View>
                </View>
                <Text style={styles.bentoTitleSmall} numberOfLines={1}>{t('food_quiz')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Wide Card */}
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.bentoCardFull, { backgroundColor: '#E3D7FF', marginTop: 15 }]}
          >
            <View style={styles.bentoFullContent}>
              <View>
                <Text style={styles.bentoTitle} numberOfLines={1}>{t('vocab_quiz')}</Text>
              </View>
              <View style={styles.bentoImageContainerFull}>
                <Image
                  source={require('@/assets/images/hoctap.jpg')}
                  style={styles.bentoImageInside}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>



        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 15,
    minHeight: 60,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 48,
    paddingVertical: 5,
  },
  headerBtn: {
    position: 'absolute',
    right: 25,
  },

  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: 25,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 25,
    marginTop: 0,
    marginBottom: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 35,
  },
  avatarWrapper: {
    position: 'relative',
  },
  cardAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  nameContainer: {
    flex: 1,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 15,
    alignSelf: 'flex-start',
    gap: 0,
  },

  cardSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000ff',
  },

  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffffff',
    borderRadius: 10,
    paddingVertical: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#EEE',
    alignSelf: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    marginTop: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },

  ornament: {
    position: 'absolute',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000ff',
  },
  horizontalScroll: {
    paddingBottom: 25,
    gap: 15,
  },
  skillCard: {
    width: 160,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  skillIconCover: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  skillTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  skillSubtitle: {
    fontSize: 11,
    color: '#999',
    marginBottom: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  bentoContainer: {
    width: '100%',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 15,
  },

  bentoCardTall: {
    height: 220,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 15,
    position: 'relative',
  },



  bentoRightCol: {
    flex: 1,
    gap: 15,
  },
  bentoCardSquare: {
    height: 102.5,
    borderRadius: 24,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  bentoCardWide: {
    height: 102.5,
    borderRadius: 24,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  bentoCardFull: {
    width: '100%',
    height: 140,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'flex-end',
  },
  bentoTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  bentoTitleSmall: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  bentoSubtitle: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 4,
  },
  bentoSpacer: {
    flex: 1,
  },
  bentoImageContainerLarge: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    width: 65,
    height: 65,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bentoImageContainerSmall: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bentoImageContainerSmallInline: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bentoImageContainerFull: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bentoImageInside: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'contain',
  },
  bentoSocialIcons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    width: '100%',
    justifyContent: 'center',
  },
  bentoFullContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

});



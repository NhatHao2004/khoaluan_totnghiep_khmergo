import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';

import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { getLeaderboardUsers, UserProfile } from '@/services/firebase-service';
import { scale, verticalScale, moderateScale } from '@/utils/responsive';
import { useFocusEffect } from '@react-navigation/native';

export default function MedalScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'weekly' | 'all'>('weekly');
  const scrollRef = useRef<ScrollView>(null);


  const [leaderboardData, setLeaderboardData] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastFetchTime = useRef<number>(0);

  const fetchLeaderboard = async (force = false) => {
    // Only fetch if forced or it's been more than 30 seconds
    const now = Date.now();
    if (!force && lastFetchTime.current && now - lastFetchTime.current < 30000) {
      setIsLoading(false);
      return;
    }

    if (!user) {
      if (leaderboardData.length > 0) setLeaderboardData([]);
      setIsLoading(false);
      return;
    }

    try {
      const users = await getLeaderboardUsers(50);
      // Simple shallow comparison or just check length for now
      if (JSON.stringify(users) !== JSON.stringify(leaderboardData)) {
        setLeaderboardData(users);
      }
      lastFetchTime.current = Date.now();
    } catch (error) {
      console.log('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('weekly');
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      fetchLeaderboard();
    }, [user?.uid])
  );



  const targetCount = activeTab === 'weekly' ? 10 : 20;

  const getLeaderboardList = () => {
    const list = [...leaderboardData.slice(0, targetCount)];
    while (list.length < targetCount) {
      list.push({ uid: `dummy-${list.length}-${activeTab}`, name: '---', points: 0, avatar: null });
    }
    return list;
  };

  const displayedData = getLeaderboardList();

  const topThree = [displayedData[1], displayedData[0], displayedData[2]]; // 2nd, 1st, 3rd for podium order
  const restOfPlayers = displayedData.slice(3);

  return (
    <View style={styles.container}>
      {/* Background Cement Gray */}
      <View style={styles.headerBackground} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scale(26)} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('leaderboard')}</Text>
        <View style={{ width: scale(26) }} />
      </View>

      <View style={styles.tabContainer}>
        <View style={styles.tabBackground}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'weekly' && styles.activeTab]}
            onPress={() => setActiveTab('weekly')}
          >
            <Text style={[styles.tabText, activeTab === 'weekly' && styles.activeTabText]}>{t('weekly')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>{t('all_time')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flex: 0 }}>
          {/* Podium Section */}
          <View style={styles.podiumWrapper}>
            <View style={styles.podiumContainer}>

              {/* 1st Place */}
              <View style={[styles.podiumItem, { marginTop: verticalScale(-45) }]}>
                <View style={styles.crownContainer}>
                </View>
                <View style={[styles.avatarContainer, { width: scale(80), height: scale(80), borderRadius: scale(40), borderWidth: 1, borderColor: '#000000ff' }]}>
                  {topThree[1].avatar ? (
                    <Image source={{ uri: topThree[1].avatar }} style={styles.avatar} />
                  ) : (
                    <Ionicons name="person-circle-outline" size={scale(70)} color="#CCC" />
                  )}

                </View>


                <Text style={styles.podiumName}>{topThree[1].name}</Text>
                <View style={styles.podiumPoints}>
                  <Text style={styles.podiumPointsText} numberOfLines={1} adjustsFontSizeToFit>
                    {`${topThree[1].points} ${t('points')}`}
                  </Text>
                </View>
                <View style={[styles.podiumBase, { height: verticalScale(135), backgroundColor: '#ff0000ff' }]}>
                  <Text style={styles.podiumRank}>1</Text>
                </View>
              </View>

              {/* 2nd Place */}
              <View style={styles.podiumItem}>
                <View style={[styles.avatarContainer, { width: scale(80), height: scale(80), borderRadius: scale(40), borderWidth: 1, borderColor: '#000000ff' }]}>
                  {topThree[0].avatar ? (
                    <Image source={{ uri: topThree[0].avatar }} style={styles.avatar} />
                  ) : (
                    <Ionicons name="person-circle-outline" size={scale(70)} color="#CCC" />
                  )}

                </View>


                <Text style={styles.podiumName} numberOfLines={1}>{topThree[0].name}</Text>
                <View style={styles.podiumPoints}>
                  <Text style={styles.podiumPointsText} numberOfLines={1} adjustsFontSizeToFit>
                    {`${topThree[0].points} ${t('points')}`}
                  </Text>
                </View>
                <View style={[styles.podiumBase, { height: verticalScale(100), backgroundColor: '#f8d330ff' }]}>
                  <Text style={styles.podiumRank}>2</Text>
                </View>
              </View>

              {/* 3rd Place */}
              <View style={styles.podiumItem}>
                <View style={[styles.avatarContainer, { width: scale(80), height: scale(80), borderRadius: scale(40), borderWidth: 1, borderColor: '#000000ff' }]}>
                  {topThree[2].avatar ? (
                    <Image source={{ uri: topThree[2].avatar }} style={styles.avatar} />
                  ) : (
                    <Ionicons name="person-circle-outline" size={scale(70)} color="#CCC" />
                  )}

                </View>


                <Text style={styles.podiumName} numberOfLines={1}>{topThree[2].name}</Text>
                <View style={styles.podiumPoints}>
                  <Text style={styles.podiumPointsText} numberOfLines={1} adjustsFontSizeToFit>
                    {`${topThree[2].points} ${t('points')}`}
                  </Text>
                </View>
                <View style={[styles.podiumBase, { height: verticalScale(65), backgroundColor: '#1ca900ff' }]}>
                  <Text style={styles.podiumRank}>3</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Other Players List - Only this part is scrollable */}
        <ScrollView
          ref={scrollRef}
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: scale(35), paddingBottom: 0 }}
        >

          {restOfPlayers.map((item) => {
            const playerRank = displayedData.findIndex(u => u.uid === item.uid) + 1;
            const isMe = user && item.uid === user.uid;

            return (
              <View
                key={item.uid}
                style={[
                  styles.listItem,
                  isMe && styles.myListItem
                ]}
              >
                <View style={styles.listItemRankContainer}>
                  <Text style={styles.listItemRank}>{playerRank}</Text>
                </View>
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.listItemAvatar} />
                ) : (
                  <Ionicons name="person-circle-outline" size={scale(50)} color="#CCC" style={styles.listItemAvatar} />
                )}
                <View style={styles.listItemInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                    <Text style={[styles.listItemName, isMe && styles.myListItemName]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {isMe && <View style={styles.meTag}><Text style={styles.meTagText}>{t('you')}</Text></View>}
                  </View>
                  <Text style={styles.listItemPoints}>
                    {`${item.points} ${t('points')}`}
                  </Text>
                </View>
              </View>
            );
          })}

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
    paddingTop: verticalScale(40),
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(478), // Covers header and podium
    backgroundColor: '#ffffffff', // Cement Gray
    borderBottomLeftRadius: scale(40),
    borderBottomRightRadius: scale(40),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(15),
  },

  backBtn: {
    width: scale(24),
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: moderateScale(22),
    fontWeight: '900',
    color: '#1A1A1A', // Black text
    lineHeight: verticalScale(32),
  },


  tabContainer: {
    alignItems: 'center',
    marginTop: verticalScale(15),
    marginBottom: 0,
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: scale(15),
    padding: scale(4),
    width: SCREEN_WIDTH * 0.8,
  },

  tab: {
    flex: 1,
    paddingVertical: verticalScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(12),
    minHeight: verticalScale(44),
  },

  activeTab: {
    backgroundColor: '#008cffff',
    shadowColor: 'rgba(16, 185, 129, 0.2)',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 1,
    shadowRadius: scale(10),
    elevation: 3,
  },
  tabText: {
    color: '#000000ff',
    fontWeight: '600',
    fontSize: moderateScale(14),
    lineHeight: verticalScale(20),
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '800',
    lineHeight: verticalScale(20),
  },


  podiumWrapper: {
    marginTop: verticalScale(70),
    paddingBottom: 0,
  },


  timerContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
    marginRight: scale(25),
    marginBottom: verticalScale(10),
    gap: scale(5),
  },
  timerText: {
    color: '#FFF',
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: scale(15),
  },
  podiumItem: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - scale(60)) / 3,
  },
  avatarContainer: {
    width: scale(65),
    height: scale(65),
    borderRadius: scale(32.5),
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    position: 'relative',
    marginBottom: verticalScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },

  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: scale(40),
  },

  crownContainer: {
    position: 'absolute',
    top: verticalScale(-20),
    zIndex: 10,
  },
  crownHexagon: {
    width: scale(30),
    height: scale(30),
    backgroundColor: '#FDD835',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scale(8),
    transform: [{ rotate: '45deg' }],
  },
  podiumName: {
    color: '#1A1A1A',
    fontSize: moderateScale(12),
    fontWeight: '700',
    marginBottom: verticalScale(5),
    textAlign: 'center',
    lineHeight: verticalScale(18),
  },
  podiumPoints: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: scale(4),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
    marginBottom: verticalScale(10),
    minWidth: scale(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumPointsText: {
    color: '#000000',
    fontSize: moderateScale(12),
    fontWeight: '700',
    lineHeight: verticalScale(16),
    textAlign: 'center',
  },


  podiumBase: {
    width: '100%',
    borderTopLeftRadius: scale(15),
    borderTopRightRadius: scale(15),
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: verticalScale(10),
  },
  podiumRank: {
    color: '#FFF',
    fontSize: moderateScale(36),
    fontWeight: '800',
    opacity: 0.9,
    lineHeight: verticalScale(44),
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  listContainer: {
    flex: 1,
    marginTop: verticalScale(10),
  },
  listHandle: {
    display: 'none',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(13),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  listItemRankContainer: {
    width: scale(35), // Đảm bảo hiển thị tốt các số 2 chữ số (ví dụ: 10, 20)
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  listItemRank: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: verticalScale(22), // Optimized for VN/Numbers
  },

  listItemAvatar: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    marginRight: scale(15),
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: verticalScale(2),
  },
  listItemPoints: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  myListItem: {
    backgroundColor: '#ffffffff',
    paddingVertical: verticalScale(13),
    marginHorizontal: 0,
    marginVertical: 0,
  },
  myListItemName: {
    color: '#000000ff',
  },
  meTag: {
    backgroundColor: '#764eb4ff',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: scale(6),
  },
  meTagText: {
    color: '#FFF',
    fontSize: moderateScale(10),
    fontWeight: '900',
  },
  myRankIndicator: {
    position: 'absolute',
    bottom: verticalScale(80),
    right: scale(30),
    backgroundColor: '#9368d2ff',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    borderRadius: scale(20),
    shadowColor: '#9C77D5',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 6,
  },
  myRankIndicatorText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: '#FFF',
  },
});
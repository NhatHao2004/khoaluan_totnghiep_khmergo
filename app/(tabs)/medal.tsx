import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';

import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

import { getLeaderboardUsers, UserProfile } from '@/services/firebase-service';
import { useFocusEffect } from '@react-navigation/native';

export default function MedalScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'weekly' | 'all'>('weekly');
  const scrollRef = useRef<ScrollView>(null);


  const [leaderboardData, setLeaderboardData] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    const users = await getLeaderboardUsers(50);
    setLeaderboardData(users);
    setIsLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('weekly');
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      fetchLeaderboard();
    }, [])
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('leaderboard')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ flex: 0 }}>
        {/* Tab Switcher */}
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

        {/* Podium Section */}
        <View style={styles.podiumWrapper}>
          <View style={styles.podiumContainer}>

            {/* 1st Place */}
            <View style={[styles.podiumItem, { marginTop: -45 }]}>
              <View style={styles.crownContainer}>
              </View>
              <View style={[styles.avatarContainer, { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#FFD700' }]}>
                {topThree[1].avatar ? (
                  <Image source={{ uri: topThree[1].avatar }} style={styles.avatar} />
                ) : (
                  <Ionicons name="person-circle-outline" size={70} color="#CCC" />
                )}

              </View>


              <Text style={styles.podiumName}>{topThree[1].name}</Text>
              <View style={styles.podiumPoints}>
                <Text style={styles.podiumPointsText}>{topThree[1].points} {t('points')}</Text>
              </View>
              <View style={[styles.podiumBase, { height: 150, backgroundColor: '#FFD700' }]}>
                <Text style={styles.podiumRank}>1</Text>
              </View>
            </View>

            {/* 2nd Place */}
            <View style={styles.podiumItem}>
              <View style={[styles.avatarContainer, { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#C0C0C0' }]}>
                {topThree[0].avatar ? (
                  <Image source={{ uri: topThree[0].avatar }} style={styles.avatar} />
                ) : (
                  <Ionicons name="person-circle-outline" size={70} color="#CCC" />
                )}

              </View>


              <Text style={styles.podiumName}>{topThree[0].name}</Text>
              <View style={styles.podiumPoints}>
                <Text style={styles.podiumPointsText}>{topThree[0].points} {t('points')}</Text>
              </View>
              <View style={[styles.podiumBase, { height: 100, backgroundColor: '#C0C0C0' }]}>
                <Text style={styles.podiumRank}>2</Text>
              </View>
            </View>

            {/* 3rd Place */}
            <View style={styles.podiumItem}>
              <View style={[styles.avatarContainer, { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#CD7F32' }]}>
                {topThree[2].avatar ? (
                  <Image source={{ uri: topThree[2].avatar }} style={styles.avatar} />
                ) : (
                  <Ionicons name="person-circle-outline" size={70} color="#CCC" />
                )}

              </View>


              <Text style={styles.podiumName}>{topThree[2].name}</Text>
              <View style={styles.podiumPoints}>
                <Text style={styles.podiumPointsText}>{topThree[2].points} {t('points')}</Text>
              </View>
              <View style={[styles.podiumBase, { height: 50, backgroundColor: '#CD7F32' }]}>
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
        contentContainerStyle={{ paddingHorizontal: 30, paddingBottom: 68 }}
      >

        {restOfPlayers.map((item) => {
          const playerRank = displayedData.findIndex(u => u.uid === item.uid) + 1;
          const isMe = user && item.uid === user.uid;

          return (
            <View key={item.uid} style={[styles.listItem, isMe && styles.myListItem]}>
              <View style={styles.listItemRankContainer}>
                <Text style={styles.listItemRank}>{playerRank}</Text>
              </View>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.listItemAvatar} />
              ) : (
                <Ionicons name="person-circle-outline" size={50} color="#CCC" style={styles.listItemAvatar} />
              )}
              <View style={styles.listItemInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.listItemName, isMe && styles.myListItemName]}>{item.name}</Text>
                  {isMe && <View style={styles.meTag}><Text style={styles.meTagText}>YOU</Text></View>}
                </View>
                <Text style={styles.listItemPoints}>{item.points} {t('points')}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {user && (leaderboardData.findIndex(u => u.uid === user.uid) + 1) >= 4 && (
        <TouchableOpacity 
          style={styles.myRankIndicator} 
          onPress={() => {
            // Optional: Scroll to the user's rank in the list
          }}
        >
          <Text style={styles.myRankIndicatorText}>Bạn</Text>
        </TouchableOpacity>
      )}

    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff', // White background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },

  backBtn: {
    width: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A', // Black text
    lineHeight: 32,
  },


  tabContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 0,
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 4,
    width: width * 0.8,
  },

  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    minHeight: 44,
  },

  activeTab: {
    backgroundColor: '#FFF',
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    elevation: 2,
  },
  tabText: {
    color: '#000000ff',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },
  activeTabText: {
    color: '#1A1A1A',
    lineHeight: 20,
  },


  podiumWrapper: {
    marginTop: 80,
    paddingBottom: 0,
  },


  timerContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 25,
    marginBottom: 10,
    gap: 5,
  },
  timerText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  podiumItem: {
    alignItems: 'center',
    width: (width - 60) / 3,
  },
  avatarContainer: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    position: 'relative',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },

  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },

  crownContainer: {
    position: 'absolute',
    top: -25,
    zIndex: 10,
  },
  crownHexagon: {
    width: 30,
    height: 30,
    backgroundColor: '#FDD835',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
  },
  podiumName: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
    textAlign: 'center',
  },
  podiumPoints: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 10,
  },
  podiumPointsText: {
    color: '#000000ff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },


  podiumBase: {
    width: '100%',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
  },
  podiumRank: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '800',
    opacity: 0.9,
  },
  listContainer: {
    flex: 1,
    marginTop: 10,
  },
  listHandle: {
    display: 'none',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  listItemRankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listItemRank: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000ff',
  },

  listItemAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  listItemPoints: {
    fontSize: 14,
    color: '#666',
  },
  myListItem: {
    backgroundColor: '#F8F5FF',
    borderColor: '#9C77D5',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    marginHorizontal: -10,
  },
  myListItemName: {
    color: '#9C77D5',
  },
  meTag: {
    backgroundColor: '#9C77D5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  meTagText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
  myRankIndicator: {
    position: 'absolute',
    bottom: 80,
    right: 30,
    backgroundColor: '#9C77D5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#9C77D5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  myRankIndicatorText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
});



import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { scale, verticalScale, moderateScale } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LanguageDetailScreen() {
  const router = useRouter();
  const { categoryId, title } = useLocalSearchParams();
  const { t } = useLanguage();

  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;
    const unsubscribe = onSnapshot(doc(db, 'vocab_categories', categoryId as string), (doc) => {
      if (doc.exists()) {
        setCategory({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [categoryId]);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return sound
      ? () => {
        sound.unloadAsync();
      }
      : undefined;
  }, [sound]);

  const playSound = async (text: string, langCode: string, id: string) => {
    if (!text || playingId === id) return;

    try {
      setPlayingId(id);
      if (sound) {
        await sound.unloadAsync();
      }

      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${langCode}&client=tw-ob`;

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (error) {
      console.error('Lỗi khi phát âm thanh:', error);
      setPlayingId(null);
    }
  };

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/language_study' as any);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={scale(28)} color="#000000" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={scale(28)} color="#000000" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{t('no_vocab_data')}</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={scale(28)} color="#000000" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {title ? t(title as string) : t(category.title)}
          </ThemedText>
        </View>

        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listContainer}>
          {(category.words || []).map((word: any, index: number) => (
            <View key={word.id} style={styles.flashcard}>
              <View style={styles.cardHeader}>
                <View style={[styles.indexBadge, { backgroundColor: (category.color || '#3B82F6') + '20' }]}>
                  <ThemedText style={[styles.indexText, { color: category.color || '#3B82F6' }]}>{index + 1}</ThemedText>
                </View>
                <TouchableOpacity onPress={() => playSound(word.khm, 'km', word.id)}>
                  <Ionicons
                    name={playingId === word.id ? "volume-high" : "volume-medium-outline"}
                    size={scale(28)}
                    color={playingId === word.id ? (category.color || '#3B82F6') : "#0060d6ff"}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.wordContent}>
                <ThemedText style={styles.khmerText} selectable={true}>{word.khm}</ThemedText>
                <ThemedText style={styles.pronunciationText}>"{word.pronunciation}" </ThemedText>

                <View style={styles.divider} />

                <ThemedText style={styles.vieText}>{word.life || word.vie}</ThemedText>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: verticalScale(45),
    paddingBottom: verticalScale(15),
    paddingHorizontal: scale(15),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(10),
    elevation: 5,
    zIndex: 100,
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#000000',
    fontSize: moderateScale(20),
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: verticalScale(32),
    paddingTop: verticalScale(5),
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(20),
  },
  listContainer: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(20),
    gap: verticalScale(16),
  },
  flashcard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(24),
    padding: scale(24),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: verticalScale(6) },
    shadowOpacity: 0.08,
    shadowRadius: scale(12),
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  indexBadge: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: {
    fontSize: moderateScale(14),
    fontWeight: '900',
  },
  wordContent: {
    alignItems: 'center',
  },
  khmerText: {
    fontSize: moderateScale(36),
    lineHeight: verticalScale(56),
    paddingBottom: verticalScale(10),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: verticalScale(2),
    textAlign: 'center',
  },
  pronunciationText: {
    fontSize: moderateScale(16),
    lineHeight: verticalScale(24),
    color: '#3B82F6',
    fontWeight: '500',
    fontStyle: 'italic',
    marginBottom: verticalScale(20),
    textAlign: 'center',
    paddingHorizontal: scale(20),
    width: '100%',
  },
  divider: {
    width: '50%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: verticalScale(20),
  },
  vieText: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#475569',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: moderateScale(16),
  }
});

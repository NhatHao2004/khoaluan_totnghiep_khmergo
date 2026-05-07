import { ThemedText } from '@/components/themed-text';
import { VOCABULARY_CATEGORIES } from '@/utils/vocabularyData';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LanguageStudyScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleCategoryPress = (categoryId: string, title: string) => {
    // Navigate to the detail screen, passing category ID
    router.push({
      pathname: '/language-detail' as any,
      params: {
        categoryId: categoryId,
        title: title
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
            {t('language_study')}
          </ThemedText>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.content, styles.scrollContent]}>
        <View style={styles.introduction}>
          <ThemedText style={styles.introTitle}>{t('let_learn_khmer')}</ThemedText>
          <ThemedText style={styles.introDesc}>
            {t('let_learn_khmer_desc')}
          </ThemedText>
        </View>

        {/* Thẻ Dịch AI Mới */}
        <View style={styles.translateActionContainer}>
          <TouchableOpacity
            style={styles.translateActionCard}
            activeOpacity={0.8}
            onPress={() => router.push('/translator' as any)}
          >
            <View style={styles.translateIconBox}>
              <Ionicons name="language" size={36} color="#FFF" />
            </View>
            <View style={styles.translateActionContent}>
              <ThemedText style={styles.translateActionTitle}>{t('vocab_translation')}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ffffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionDivider}>
          <ThemedText style={styles.sectionTitle}>{t('learn_by_topic')}</ThemedText>
        </View>

        <View style={styles.gridContainer}>
          {VOCABULARY_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { borderColor: category.color + '40' }]} // Thêm 40 để làm mờ viền
              activeOpacity={0.7}
              onPress={() => handleCategoryPress(category.id, category.title)}
            >
              <View style={[styles.iconContainer, { backgroundColor: category.color + '15' }]}>
                <Ionicons name={category.iconName as any} size={32} color={category.color} />
              </View>

              <View style={styles.cardContent}>
                <ThemedText style={styles.categoryTitle}>{t(category.title)}</ThemedText>
                <ThemedText style={styles.categoryCount}>{category.words.length} {t('vocab_words')}</ThemedText>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate 50
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 100,
  },
  backBtn: {
    width: 40,
    height: 40,
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
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    paddingTop: 5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  introduction: {
    padding: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
  },
  introDesc: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    textAlign: 'justify',
  },
  translateActionContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  translateActionCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  translateIconBox: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  translateActionContent: {
    flex: 1,
    marginRight: 5,
  },
  translateActionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  translateActionSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'justify',
    width: '100%',
  },
  sectionDivider: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  gridContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    lineHeight: 32,
    paddingTop: 10,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 0,
  },
  categoryCount: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});

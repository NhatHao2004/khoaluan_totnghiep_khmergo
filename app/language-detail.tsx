import { ThemedText } from '@/components/themed-text';
import { VOCABULARY_CATEGORIES } from '@/utils/vocabularyData';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function LanguageDetailScreen() {
  const router = useRouter();
  const { categoryId, title } = useLocalSearchParams();

  const category = useMemo(() => {
    return VOCABULARY_CATEGORIES.find(c => c.id === categoryId);
  }, [categoryId]);

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/language_study' as any);
    }
  };

  if (!category) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Không tìm thấy dữ liệu từ vựng chủ đề này.</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {title || category.title}
          </ThemedText>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.banner, { backgroundColor: category.color }]}>
          <Ionicons name={category.iconName as any} size={48} color="#FFFFFF" style={styles.bannerIcon} />
          <ThemedText style={styles.bannerTitle}>{category.title}</ThemedText>
          <ThemedText style={styles.bannerSubtitle}>{category.words.length} thẻ từ vựng</ThemedText>
        </View>

        <View style={styles.listContainer}>
          {category.words.map((word, index) => (
            <View key={word.id} style={styles.flashcard}>
              <View style={styles.cardHeader}>
                <View style={[styles.indexBadge, { backgroundColor: category.color + '20' }]}>
                  <ThemedText style={[styles.indexText, { color: category.color }]}>{index + 1}</ThemedText>
                </View>
                <Ionicons name="volume-medium-outline" size={24} color="#CBD5E1" />
              </View>
              
              <View style={styles.wordContent}>
                <ThemedText style={styles.khmerText} selectable={true}>{word.khm}</ThemedText>
                <ThemedText style={styles.pronunciationText}>"{word.pronunciation}"</ThemedText>
                
                <View style={styles.divider} />
                
                <ThemedText style={styles.vieText}>{word.vie}</ThemedText>
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
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  banner: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  bannerIcon: {
    marginBottom: 10,
  },
  bannerTitle: {
    fontSize: 24,
    lineHeight: 36, // Tăng không gian dòng để tránh mất dấu ? trên chữ Ẩ
    paddingTop: 5, // Cấp thêm không gian chết ở phía trên đỉnh để đẩy dấu xuống
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  flashcard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: {
    fontSize: 14,
    fontWeight: '900',
  },
  wordContent: {
    alignItems: 'center',
  },
  khmerText: {
    fontSize: 36,
    lineHeight: 56, // Tăng lineHeight để tránh cắt nét dưới của chữ Khmer
    paddingBottom: 10, // Có thêm khoảng trống cho các nét đuôi (subscripts)
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
    textAlign: 'center',
  },
  pronunciationText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  divider: {
    width: '50%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 20,
  },
  vieText: {
    fontSize: 18,
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
    fontSize: 16,
  }
});

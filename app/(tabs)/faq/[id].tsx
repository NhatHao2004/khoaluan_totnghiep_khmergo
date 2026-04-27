import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FAQDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();

  const getFAQContent = () => {
    switch (id) {
      case 'use':
        return {
          title: t('faq_how_to_use'),
          content: t('faq_use_content'),
          icon: 'apps-outline'
        };
      case 'quiz':
        return {
          title: t('faq_how_to_quiz'),
          content: t('faq_quiz_content'),
          icon: 'help-circle-outline'
        };
      case 'learn':
        return {
          title: t('faq_how_to_learn'),
          content: t('faq_learn_content'),
          icon: 'book-outline'
        };
      default:
        return {
          title: 'FAQ',
          content: '',
          icon: 'help-outline'
        };
    }
  };

  const { title, content, icon } = getFAQContent();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/support')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={25} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={60} color="#00CFA3" />
        </View>
        <Text style={styles.description}>{content}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    padding: 25,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FFF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: '#444',
    textAlign: 'center',
  },
});

import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SupportScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('support_feedback')}</Text>
        <View style={{ width: 25 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('faq')}</Text>
          <TouchableOpacity style={styles.faqItem} onPress={() => router.push('/faq/use' as any)}>
            <Text style={styles.faqText}>{t('faq_how_to_use')}</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.faqItem} onPress={() => router.push('/faq/quiz' as any)}>
            <Text style={styles.faqText}>{t('faq_how_to_quiz')}</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.faqItem} onPress={() => router.push('/faq/learn' as any)}>
            <Text style={styles.faqText}>{t('faq_how_to_learn')}</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  backBtn: {
    width: 25,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  section: {
    marginBottom: 23,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 15,
    lineHeight: 26,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  faqText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
});

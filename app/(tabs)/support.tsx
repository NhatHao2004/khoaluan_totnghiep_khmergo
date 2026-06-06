import { useLanguage } from '@/contexts/LanguageContext';
import { scale, verticalScale, moderateScale } from '@/utils/responsive';
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
          <Ionicons name="arrow-back" size={scale(28)} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('support_feedback')}</Text>
        <View style={{ width: scale(25) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('faq')}</Text>
          <TouchableOpacity style={styles.faqItem} onPress={() => router.push('/faq/learn' as any)}>
            <View style={[styles.faqIconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="person-circle-outline" size={scale(24)} color="#22C55E" />
            </View>
            <View style={styles.faqInfo}>
              <Text style={styles.faqText}>{t('faq_how_to_learn')}</Text>
              <Text style={styles.faqSub}>{t('tap_to_see_guide')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={scale(18)} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem} onPress={() => router.push('/faq/use' as any)}>
            <View style={[styles.faqIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="help-circle-outline" size={scale(22)} color="#3B82F6" />
            </View>
            <View style={styles.faqInfo}>
              <Text style={styles.faqText}>{t('faq_how_to_use')}</Text>
              <Text style={styles.faqSub}>{t('tap_to_see_guide')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={scale(18)} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem} onPress={() => router.push('/faq/quiz' as any)}>
            <View style={[styles.faqIconCircle, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="trophy-outline" size={scale(22)} color="#F59E0B" />
            </View>
            <View style={styles.faqInfo}>
              <Text style={styles.faqText}>{t('faq_how_to_quiz')}</Text>
              <Text style={styles.faqSub}>{t('tap_to_see_guide')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={scale(18)} color="#CBD5E1" />
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
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(50),
    paddingBottom: verticalScale(10),
    backgroundColor: '#ffffff',
  },
  backBtn: {
    width: scale(25),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: scale(25),
    paddingTop: verticalScale(10),
  },
  section: {
    marginBottom: verticalScale(23),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 0,
    lineHeight: verticalScale(26),
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(18),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  faqIconCircle: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },
  faqInfo: {
    flex: 1,
  },
  faqText: {
    fontSize: moderateScale(15),
    color: '#1E293B',
    fontWeight: '700',
    marginBottom: verticalScale(2),
  },
  faqSub: {
    fontSize: moderateScale(13),
    color: '#94A3B8',
    fontWeight: '500',
  },
});

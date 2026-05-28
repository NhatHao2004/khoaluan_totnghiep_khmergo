import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
          icon: 'apps-outline',
          steps: [
            {
              title: '1. Khám phá',
              desc: 'Bắt đầu hành trình tại Trang chủ. Bạn có thể tìm thấy các ngôi chùa cổ kính, danh lam thắng cảnh và lễ hội đặc sắc của người Khmer Nam Bộ.',
              image: require('@/assets/images/guide/guide_1.png')
            },
            {
              title: '2. Tìm hiểu',
              desc: 'Mỗi địa điểm đều có thông tin chi tiết về lịch sử, kiến trúc và các món ăn đặc sản. Hãy đọc kỹ để hiểu sâu hơn về nét đẹp truyền thống.',
              image: require('@/assets/images/guide/guide_2.png')
            },
            {
              title: '3. Chinh phục',
              desc: 'Tham gia các bài trắc nghiệm vui tại mục Thử thách. Trả lời đúng để tích lũy điểm thưởng và thăng hạng trên bảng xếp hạng cộng đồng.',
              image: require('@/assets/images/guide/guide_3.png')
            },
            {
              title: '4. Tương tác',
              desc: 'Nếu có bất kỳ thắc mắc nào, hãy nhấn vào biểu tượng Chat để trò chuyện với Trợ lý AI thông minh của KhmerGo.',
              image: require('@/assets/images/guide/guide_4.png')
            }
          ]
        };
      case 'quiz':
        return {
          title: t('faq_how_to_quiz'),
          content: t('faq_quiz_content'),
          icon: 'trophy-outline'
        };
      case 'learn':
        return {
          title: t('faq_how_to_learn'),
          content: t('faq_learn_content'),
          icon: 'person-add-outline'
        };
      default:
        return {
          title: 'FAQ',
          content: '',
          icon: 'help-outline'
        };
    }
  };

  const { title, content, icon, steps } = getFAQContent() as any;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/support')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!steps ? (
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: id === 'use' ? '#EFF6FF' : id === 'quiz' ? '#FFF7ED' : '#F0FDF4' }]}>
              <Ionicons name={icon as any} size={48} color={id === 'use' ? '#3B82F6' : id === 'quiz' ? '#F59E0B' : '#22C55E'} />
            </View>
            <Text style={styles.contentTitle}>{title}</Text>
            <View style={styles.divider} />
            <Text style={styles.description}>{content}</Text>
          </View>
        ) : (
          <View>
            <View style={[styles.card, { marginBottom: 25 }]}>
              <Text style={[styles.description, { textAlign: 'center' }]}>{content}</Text>
            </View>

            {steps.map((step: any, index: number) => {
              const isEven = index % 2 === 0;
              return (
                <View key={index} style={[styles.stepCard, { flexDirection: isEven ? 'row' : 'row-reverse' }]}>
                  <Image source={step.image} style={styles.stepImage} />
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 0 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  contentTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 15,
  },
  divider: {
    width: 40,
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    lineHeight: 28,
    color: '#475569',
    textAlign: 'justify',
  },
  backActionBtn: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
    minHeight: 120,
  },
  stepImage: {
    width: '40%',
    height: '100%',
    backgroundColor: '#F1F5F9',
  },
  stepContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 5,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    textAlign: 'justify',
  },
});

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
          icon: 'apps-outline',
          steps: [
            {
              title: '1. Khám phá ngay',
              desc: 'Bắt đầu hành trình tại Trang chủ. Bạn có thể tìm thấy các ngôi chùa cổ kính, danh lam thắng cảnh và lễ hội đặc sắc của người Khmer Nam Bộ.',
              image: require('@/assets/images/guide/guide_1.png')
            },
            {
              title: '2. Tìm hiểu thêm',
              desc: 'Mỗi địa điểm đều có thông tin chi tiết về lịch sử, kiến trúc và các món ăn đặc sản. Hãy đọc kỹ để hiểu sâu hơn về nét đẹp truyền thống.',
              image: require('@/assets/images/guide/guide_2.png')
            },
            {
              title: '3. Vượt thử thách',
              desc: 'Tham gia các bài trắc nghiệm vui tại mục Thử thách. Trả lời đúng để tích lũy điểm thưởng và thăng hạng trên bảng xếp hạng cộng đồng.',
              image: require('@/assets/images/guide/guide_3.png')
            },
            {
              title: '4. Trò chuyện AI',
              desc: 'Nếu có bất kỳ thắc mắc nào, hãy nhấn vào biểu tượng Chat để trò chuyện với Trợ lý AI thông minh của KhmerGo.',
              image: require('@/assets/images/guide/guide_4.png')
            }
          ]
        };
      case 'quiz':
        return {
          title: t('faq_how_to_quiz'),
          icon: 'trophy-outline',
          steps: [
            {
              title: '1. Chọn chủ đề',
              desc: 'Bạn có thể chọn các chủ đề như: Chùa Khmer, Văn hóa, Ẩm thực hoặc Học tiếng Khmer để bắt đầu thử thách kiến thức.',
              image: require('@/assets/images/guide/guide_3.png')
            },
            {
              title: '2. Chơi thử thách',
              desc: 'Mỗi câu hỏi sẽ có 4 lựa chọn. Hãy suy nghĩ kỹ và chọn đáp án chính xác nhất trong thời gian quy định.',
              image: require('@/assets/images/guide/guide_2.png')
            },
            {
              title: '3. Nhận quà tặng',
              desc: 'Sau khi hoàn thành, bạn sẽ nhận được điểm thưởng dựa trên số câu trả lời đúng. Điểm này dùng để thăng hạng thành viên.',
              image: require('@/assets/images/guide/guide_1.png')
            },
            {
              title: '4. Xem xếp hạng',
              desc: 'Xem thứ hạng của mình so với các người dùng khác tại bảng xếp hạng chung để nỗ lực đạt vị trí cao hơn mỗi ngày.',
              image: require('@/assets/images/guide/guide_4.png')
            }
          ]
        };
      case 'learn':
        return {
          title: t('faq_how_to_learn'),
          icon: 'person-circle-outline',
          steps: [
            {
              title: '1. Vào hồ sơ',
              desc: 'Nhấn vào biểu tượng Hồ sơ ở thanh điều hướng phía dưới, sau đó chọn Đăng nhập hoặc Đăng ký tài khoản.',
              image: require('@/assets/images/guide/guide_4.png')
            },
            {
              title: '2. Đăng ký ngay',
              desc: 'Nếu bạn chưa có tài khoản, hãy nhập Email và Mật khẩu để tạo mới. Sau đó bạn có thể chọn các chủ đề mình quan tâm.',
              image: require('@/assets/images/guide/guide_1.png')
            },
            {
              title: '3. Cộng đồng Khmer',
              desc: 'Khi đã đăng nhập, bạn có thể tham gia bình luận, chia sẻ ảnh và lưu lại các địa điểm yêu thích của mình.',
              image: require('@/assets/images/guide/guide_2.png')
            },
            {
              title: '4. Đổi mật khẩu',
              desc: 'Bạn có thể thay đổi mật khẩu, cập nhật thông tin cá nhân hoặc quản lý quyền riêng tư trong mục Cài đặt tài khoản.',
              image: require('@/assets/images/guide/guide_3.png')
            }
          ]
        };
      default:
        return {
          title: 'FAQ',
          icon: 'help-outline'
        };
    }
  };

  const { title, icon, steps } = getFAQContent() as any;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/support')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#1E293B" />
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
          </View>
        ) : (
          <View>
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
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 1,
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

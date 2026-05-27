import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCultures } from '@/hooks/use-culture';
import { PAGODA_QUIZZES } from '@/utils/quizData';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function QuizCultureSelectScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { cultures, loading } = useCultures();
  const isKm = language === 'km';
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Sắp xếp theo thứ tự yêu cầu: culture_2, culture_3, culture_4, culture_1, culture_5
  const order = ['culture_2', 'culture_3', 'culture_4', 'culture_1', 'culture_5'];
  
  const items = cultures
    .filter(c => PAGODA_QUIZZES.some(q => q.pagodaId === c.id))
    .map(culture => {
      const quiz = PAGODA_QUIZZES.find(q => q.pagodaId === culture.id)!;
      const imageSource = typeof culture.imageUrl === 'string' && culture.imageUrl
        ? { uri: culture.imageUrl }
        : quiz.image;
      
      // Đổi tên culture_1 nếu cần theo yêu cầu
      let displayName = isKm ? (culture.name_khmer || quiz.pagodaNameKm) : (culture.name || quiz.pagodaName);
      if (culture.id === 'culture_1') {
        displayName = isKm ? 'សាសនា និងជីវិត' : 'Tôn giáo và đời sống';
      }
      if (culture.id === 'culture_2') {
        displayName = isKm ? 'ពិធីបុណ្យប្រពៃណី' : 'Lễ hội truyền thống';
      }
      if (culture.id === 'culture_3') {
        displayName = isKm ? 'សិល្បៈ ចម្រៀង និងរបាំ' : 'Nghệ thuật ca và múa';
      }
      if (culture.id === 'culture_4') {
        displayName = isKm ? 'ភាសា និងអក្សរសាស្ត្រ' : 'Ngôn ngữ và chữ viết';
      }
      if (culture.id === 'culture_5') {
        displayName = isKm ? 'សម្លៀកបំពាក់ប្រពៃណី' : 'Trang phục truyền thống';
      }

      return {
        id: culture.id,
        name: displayName,
        location: isKm ? (culture.location_khmer || culture.location || quiz.location) : (culture.location || quiz.location),
        imageSource,
        imageUrl: culture.imageUrl || '',
        color: quiz.color,
      };
    })
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  const handleSelect = (pagodaId: string, imageUrl: string, pagodaLocation: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    router.push({ pathname: '/game-mcq' as any, params: { pagodaId, imageUrl, pagodaLocation } });
  };

  return (
    <View style={styles.container}>
      {/* Header – giống pagoda.tsx */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
            {isKm ? 'វប្បធម៌ខ្មែរ' : 'Văn hóa Khmer'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#FF0050" />
          <Text style={{ marginTop: 10, color: '#888' }}>
            {isKm ? 'កំពុងផ្ទុកទិន្នន័យ...' : 'Đang tải dữ liệu...'}
          </Text>
        </View>
      )}

      {/* Danh sách – giống pagoda.tsx */}
      {!loading && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.list}>
            {items.map(item => (
              <View key={item.id} style={styles.card}>
                {/* Ảnh */}
                <View style={styles.imageContainer}>
                  <Image
                    source={item.imageSource}
                    style={styles.image}
                    resizeMode="cover"
                    fadeDuration={0}
                  />
                </View>

                {/* Nội dung */}
                <View style={styles.cardContent}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.location}>{item.location}</Text>

                  {/* Quiz footer thêm */}
                  <View style={styles.footer}>
                    <View style={styles.info}>
                      <Text style={styles.infoText}>
                        {isKm ? '៥ សំណួរ - បូក ៥ ពិន្ទុសម្រាប់រាល់ចម្លើយដែលត្រឹមត្រូវ' : '5 câu hỏi - cộng 5 điểm cho mỗi câu đúng'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.startBtn}
                      activeOpacity={0.8}
                      onPress={() => handleSelect(item.id, item.imageUrl, item.location)}
                    >
                      <Text style={styles.startBtnText}>{isKm ? 'ចាប់ផ្តើម' : 'Bắt đầu'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Custom Login Modal */}
      <Modal
        visible={showLoginModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="person-circle-outline" size={40} color="#3B82F6" />
            </View>
            <Text style={styles.modalTitle}>{isKm ? 'តម្រូវឱ្យចូល' : 'Yêu cầu đăng nhập'}</Text>
            <Text style={styles.modalSub}>
              {isKm ? 'អ្នកត្រូវចូលដើម្បីចូលរួមក្នុងបញ្ហាប្រឈមនេះ' : 'Bạn cần đăng nhập để tham gia thử thách và tích luỵ điểm xếp hạng'}
            </Text>
            
            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setShowLoginModal(false);
                  router.push('/login');
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>{isKm ? 'ចូល' : 'Đăng nhập'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSecondaryBtn}
                onPress={() => setShowLoginModal(false)}
              >
                <Text style={styles.modalSecondaryBtnText}>{isKm ? 'បោះបង់' : 'Huỷ'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    zIndex: 100,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#000000', fontSize: 20, fontWeight: '800' },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 20, flexGrow: 1 },
  list: { padding: 15, gap: 15 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
  },
  imageContainer: { width: '100%', aspectRatio: 16 / 10 },
  image: { width: '100%', height: '100%' },
  cardContent: { padding: 15 },
  name: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  location: { fontSize: 13, color: '#666', marginBottom: 12 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 10,
  },
  info: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0179e9ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  // --- Premium Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActionRow: {
    width: '100%',
    gap: 12,
  },
  modalPrimaryBtn: {
    backgroundColor: '#3B82F6',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalPrimaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalSecondaryBtn: {
    backgroundColor: '#EF4444',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalSecondaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTemples } from '@/hooks/use-temples';
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

export default function QuizPagodaSelectScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { temples, loading } = useTemples();
  const isKm = language === 'km';
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Merge Firebase data với quiz metadata (màu, câu hỏi) từ quizData.ts
  const pagodas = temples
    .filter(t => PAGODA_QUIZZES.some(q => q.pagodaId === t.id))
    .map(temple => {
      const quiz = PAGODA_QUIZZES.find(q => q.pagodaId === temple.id)!;
      const imageSource = typeof temple.imageUrl === 'string' && temple.imageUrl
        ? { uri: temple.imageUrl }
        : quiz.image;
      return {
        pagodaId: temple.id,
        pagodaName: isKm ? (temple.name_khmer || quiz.pagodaNameKm) : (temple.name || quiz.pagodaName),
        pagodaLocation: isKm ? (temple.location_khmer || temple.location || quiz.location) : (temple.location || quiz.location),
        imageSource,
        imageUrl: temple.imageUrl || '',
        color: quiz.color,
      };
    })
    .sort((a, b) => a.pagodaId.localeCompare(b.pagodaId));

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
            {isKm ? 'វត្តអារាមខ្មែរ' : 'Ngôi chùa Khmer'}
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

      {/* Danh sách chùa – giống pagoda.tsx */}
      {!loading && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pagodaList}>
            {pagodas.map(pagoda => (
              <View key={pagoda.pagodaId} style={styles.pagodaCard}>
                {/* Ảnh */}
                <View style={styles.pagodaImageContainer}>
                  <Image
                    source={pagoda.imageSource}
                    style={styles.pagodaImage}
                    resizeMode="cover"
                    fadeDuration={0}
                  />
                </View>

                {/* Nội dung */}
                <View style={styles.pagodaContent}>
                  <Text style={styles.pagodaName}>{pagoda.pagodaName}</Text>
                  <Text style={styles.pagodaLocation}>{pagoda.pagodaLocation}</Text>

                  {/* Quiz footer thêm */}
                  <View style={styles.quizFooter}>
                    <View style={styles.quizInfo}>
                      <Text style={styles.quizInfoText}>
                        {isKm ? '៥ សំណួរ - បូក ៥ ពិន្ទុសម្រាប់រាល់ចម្លើយដែលត្រឹមត្រូវ' : '5 câu hỏi - cộng 5 điểm cho mỗi câu đúng'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.startBtn}
                      activeOpacity={0.8}
                      onPress={() => handleSelect(pagoda.pagodaId, pagoda.imageUrl, pagoda.pagodaLocation)}
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="person-circle-outline" size={40} color="#3B82F6" />
            </View>
            <Text style={styles.modalTitle}>{isKm ? 'តម្រូវឱ្យចូល' : 'Yêu cầu đăng nhập'}</Text>
            <Text style={styles.modalSub}>
              {isKm ? 'អ្នកត្រូវចូលដើម្បីចូលរួមក្នុងបញ្ហាប្រឈមនេះ' : 'Bạn cần đăng nhập để tham gia thử thách và tích luỷ điểm xếp hạng'}
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
  pagodaList: { padding: 15, gap: 15 },
  pagodaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
  },
  pagodaImageContainer: { width: '100%', aspectRatio: 16 / 10 },
  pagodaImage: { width: '100%', height: '100%' },
  pagodaContent: { padding: 15 },
  pagodaName: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  pagodaLocation: { fontSize: 13, color: '#666', marginBottom: 12 },
  quizFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 10,
  },
  quizInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  quizInfoText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
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

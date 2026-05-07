import { useAuth } from '@/contexts/AuthContext';
import { useTemples } from '@/hooks/use-temples';
import { PAGODA_QUIZZES } from '@/utils/quizData';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function QuizPagodaSelectScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { temples, loading } = useTemples();

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
        pagodaName: temple.name || quiz.pagodaName,
        pagodaNameKm: temple.name_khmer || quiz.pagodaNameKm,
        location: temple.location || quiz.location,
        imageSource,
        imageUrl: temple.imageUrl || '',
        color: quiz.color,
      };
    })
    .sort((a, b) => a.pagodaId.localeCompare(b.pagodaId));

  const handleSelect = (pagodaId: string, imageUrl: string, pagodaLocation: string) => {
    if (!user) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Bạn cần đăng nhập để tham gia thử thách và tích luỵ điểm xếp hạng',
        [
          { text: 'Huỷ', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => router.push('/login') },
        ]
      );
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
            Ngôi chùa Khmer
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#FF0050" />
          <Text style={{ marginTop: 10, color: '#888' }}>Đang tải dữ liệu...</Text>
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
                  <Text style={styles.pagodaLocation}>{pagoda.location}</Text>

                  {/* Quiz footer thêm */}
                  <View style={styles.quizFooter}>
                    <View style={styles.quizInfo}>
                      <Text style={styles.quizInfoText}>5 câu hỏi - cộng 5 điểm cho mỗi câu đúng</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.startBtn}
                      activeOpacity={0.8}
                      onPress={() => handleSelect(pagoda.pagodaId, pagoda.imageUrl, pagoda.location)}
                    >
                      <Text style={styles.startBtnText}>Bắt đầu</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
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
    backgroundColor: '#06B6D4',
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
});

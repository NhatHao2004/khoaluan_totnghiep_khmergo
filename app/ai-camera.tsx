import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type AnalysisStatus = 'idle' | 'selected' | 'analyzing' | 'result';

export default function AICameraScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);

  // Animation cho khung quét
  const scanPos = useSharedValue(0);
  const frameScale = useSharedValue(1);

  useEffect(() => {
    if (status === 'analyzing') {
      scanPos.value = withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      );
      frameScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000 }),
          withTiming(1, { duration: 2000 })
        ),
        -1
      );
    } else {
      scanPos.value = 0;
      frameScale.value = withSpring(1);
    }
  }, [status]);

  const animatedLineStyle = useAnimatedStyle(() => ({
    top: `${scanPos.value * 100}%`,
    opacity: status === 'analyzing' ? 1 : 0,
  }));

  const animatedFrameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: frameScale.value }],
    borderColor: status === 'analyzing' ? '#EF4444' : '#E0E0E0',
    shadowOpacity: status === 'analyzing' ? 0.5 : 0.1,
  }));

  const pickImage = async (useCamera: boolean = false) => {
    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
    }

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setStatus('selected');
      setResult(null);
    }
  };

  const handleAnalyze = () => {
    setStatus('analyzing');
    setTimeout(() => {
      setResult({
        title: "Bình Gốm Khmer Cổ",
        content: "Đây là một hiện vật gốm quý hiếm mang đậm phong cách nghệ thuật Baphuon muộn, phản ánh sự giao thoa văn hóa Khmer cổ trong khu vực Nam Bộ. Phần cổ bình được trang trí bằng họa tiết cánh sen cách điệu xếp đều tinh tế - biểu tượng của sự thanh khiết và tâm linh trong văn hóa Phật giáo Khmer. Trên thân bình nổi bật hình ảnh các vũ nữ Apsara đang uyển chuyển trong điệu múa truyền thống, thể hiện vẻ đẹp mềm mại, thiêng liêng và nghệ thuật cung đình Angkor xưa. Hiện vật được chế tác từ loại đất sét đặc biệt lấy tại vùng hạ lưu sông Mekong, nơi giàu phù sa màu mỡ, tạo nên sắc nâu đỏ đặc trưng sau quá trình nung ở nhiệt độ cao. Những dấu vết thời gian cùng lớp men mộc cổ kính cho thấy đây không chỉ là vật dụng sinh hoạt, mà còn mang giá trị văn hóa, tín ngưỡng và nghệ thuật đặc sắc của cộng đồng Khmer qua nhiều thế hệ."
      });
      setStatus('result');
    }, 7500);
  };

  const reset = () => {
    setImage(null);
    setStatus('idle');
    setResult(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>AI Camera</Text>
          </View>
          <TouchableOpacity onPress={reset} style={styles.headerActionBtn} disabled={status === 'idle'}>
            {status !== 'idle' && (
              <Ionicons name="close" size={30} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.fixedContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Main Visual Section */}
          <View style={styles.mainSection}>
            <Animated.View style={[styles.imageFrame, animatedFrameStyle]}>
              {/* Decorative Corners Outside */}
              <View style={[styles.corner, styles.topL]} />
              <View style={[styles.corner, styles.topR]} />
              <View style={[styles.corner, styles.botL]} />
              <View style={[styles.corner, styles.botR]} />

              <View style={styles.innerFrame}>
                {image ? (
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: image }} style={styles.previewImage} />
                    {status === 'analyzing' && (
                      <Animated.View style={[styles.scanLine, animatedLineStyle]}>
                        <LinearGradient
                          colors={['transparent', '#EF4444', 'transparent']}
                          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                          style={{ flex: 1 }}
                        />
                        <View style={styles.scanGlow} />
                      </Animated.View>
                    )}
                  </View>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <LinearGradient
                      colors={['#ffffffff', '#FFFFFF']}
                      style={styles.placeholderGradient}
                    >
                      <Ionicons name="scan-outline" size={80} color="#000000ff" opacity={0.5} />
                    </LinearGradient>
                  </View>
                )}
              </View>
            </Animated.View>
          </View>

          {/* AI Response Section */}
          <View style={styles.messageSection}>
            <Animated.View layout={Layout.springify()} style={styles.aiCard}>
              <View style={styles.aiHeader}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="bulb" size={18} color="#FFF" />
                </View>
                <Text style={styles.aiName}>Trợ lý KhmerGo AI</Text>
              </View>

              <View style={styles.aiDivider} />

              {status === 'idle' && (
                <Text style={styles.aiBubbleText}>
                  Tải lên hoặc chụp ảnh liên quan đến văn hóa Khmer Nam Bộ như kiến trúc, trang phục, lễ hội hay ẩm thực. KhmerGo AI sẽ hỗ trợ phân tích và giải thích chi tiết.
                </Text>
              )}

              {status === 'selected' && (
                <Text style={styles.aiBubbleText}>
                  Đã sẵn sàng nhấn “Bắt đầu phân tích” để KhmerGo AI khám phá và giải thích ý nghĩa văn hóa của hiện vật này.
                </Text>
              )}

              {status === 'analyzing' && (
                <View style={styles.analyzingBox}>
                  <ActivityIndicator color="#1877F2" />
                  <Text style={styles.analyzingText}>KhmerGo AI đang phân tích ảnh</Text>
                </View>
              )}

              {status === 'result' && result && (
                <Animated.View entering={FadeIn}>
                  <Text style={styles.resultTitle}>{result.title}</Text>
                  <Text style={styles.resultContent}>{result.content}</Text>
                </Animated.View>
              )}
            </Animated.View>
          </View>
        </ScrollView>

      </SafeAreaView>

      {/* Action Buttons - Moved outside SafeAreaView to touch the absolute bottom */}
      <View style={styles.actionContainer}>
        {status === 'idle' && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.iconButtonGroup}>
            <TouchableOpacity style={styles.rectSecondaryBtn} onPress={() => pickImage(false)}>
              <Ionicons name="images" size={26} color="#1877F2" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.rectPrimaryBtn} onPress={() => pickImage(true)}>
              <Ionicons name="camera" size={35} color="#1877F2" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {status === 'selected' && (
          <Animated.View entering={FadeInUp} style={styles.analyzeContainer}>
            <TouchableOpacity style={styles.bigAnalyzeBtn} onPress={handleAnalyze}>
              <LinearGradient
                colors={['#FFD700', '#BF953F', '#AA8231']}
                style={styles.goldGradient}
              >
                <Text style={styles.analyzeText}>BẮT ĐẦU PHÂN TÍCH</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  bgPatternContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  bgIcon: { transform: [{ rotate: '-15deg' }] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
  headerActionBtn: {
    minWidth: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 5,
  },
  headerBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  fixedContent: { flex: 1 },
  mainSection: { paddingVertical: 10, alignItems: 'center' },
  imageFrame: {
    width: SCREEN_WIDTH - 60,
    aspectRatio: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  innerFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imageWrapper: { width: '100%', height: '100%' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, zIndex: 10 },
  scanGlow: { position: 'absolute', top: -10, left: 0, right: 0, height: 20, backgroundColor: 'rgba(239, 68, 68, 0.15)' },

  placeholderContainer: { flex: 1 },
  placeholderGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { marginTop: 15, fontSize: 16, fontWeight: '700', color: '#B0BBD0' },

  corner: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderColor: '#1A1A1A',
    borderStyle: 'solid',
    zIndex: 20,
  },
  topL: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 15 },
  topR: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 15 },
  botL: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 15 },
  botR: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 15 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1877F2', position: 'absolute', top: -4.5, left: -4.5 },

  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 25,
    paddingBottom: 25,
    backgroundColor: 'transparent',
  },
  iconButtonGroup: { flexDirection: 'row', gap: 12 },
  rectSecondaryBtn: { flex: 1, height: 56, borderRadius: 18, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  rectPrimaryBtn: { flex: 1, height: 56, borderRadius: 18, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  rectGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  analyzeContainer: { alignItems: 'center' },
  bigAnalyzeBtn: { width: '70%', height: 48, borderRadius: 16, overflow: 'hidden', elevation: 6 },
  goldGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  analyzeText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  changeBtn: { marginTop: 12, paddingVertical: 8 },
  changeText: { color: '#64748B', fontWeight: '600', fontSize: 14, textDecorationLine: 'underline' },

  messageSection: { paddingHorizontal: 25, marginTop: 10 },
  aiCard: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1877F2', justifyContent: 'center', alignItems: 'center' },
  aiName: { marginLeft: 10, fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  aiDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 15 },
  aiBubbleText: { fontSize: 15, color: '#445266', lineHeight: 24, fontWeight: '500', textAlign: 'justify' },
  analyzingBox: { alignItems: 'center', paddingVertical: 10 },
  analyzingText: { marginTop: 10, color: '#1877F2', fontWeight: '600', fontSize: 13 },

  resultTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A', marginBottom: 10 },
  resultContent: { fontSize: 15, color: '#445266', lineHeight: 24, marginBottom: 20, textAlign: 'justify' },
  resultFooter: { flexDirection: 'row', gap: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerBtnText: { color: '#1877F2', fontWeight: '700', fontSize: 14 },

  suggestions: { marginTop: 15, flexDirection: 'row' },
  tagChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(24, 119, 242, 0.06)', marginRight: 10, borderWidth: 1, borderColor: 'rgba(24, 119, 242, 0.1)' },
  tagText: { fontSize: 13, color: '#1877F2', fontWeight: '700' },

  inputBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, backgroundColor: 'transparent' },
  glassContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    padding: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  inputIconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  textInput: { flex: 1, fontSize: 15, color: '#1A1A1A', paddingHorizontal: 10, fontWeight: '500' },
  sendBtn: { borderRadius: 22, overflow: 'hidden' },
  sendGradient: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }
});

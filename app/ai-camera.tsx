import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeOut, 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  withSequence,
  interpolate
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AnalysisStatus = 'idle' | 'selected' | 'analyzing' | 'result';

export default function AICameraScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);
  const [chatText, setChatText] = useState('');

  // Animation cho khung quét
  const scanPos = useSharedValue(0);
  useEffect(() => {
    if (status === 'analyzing') {
      scanPos.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1
      );
    } else {
      scanPos.value = 0;
    }
  }, [status]);

  const animatedLineStyle = useAnimatedStyle(() => ({
    top: `${scanPos.value * 100}%`,
    opacity: status === 'analyzing' ? 1 : 0,
  }));

  const pickImage = async (useCamera: boolean = false) => {
    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
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
    // Giả lập thời gian AI phân tích (3 giây)
    setTimeout(() => {
      setResult({
        title: "Đồ gốm Khmer cổ",
        content: "Đây là mẫu bình gốm đặc trưng của người Khmer Nam Bộ, thường được dùng trong các nghi lễ cúng bái hoặc trang trí trong các gia đình quý tộc xưa. Họa tiết trên bình thường mang ý nghĩa về sự phồn vinh và trường thọ."
      });
      setStatus('result');
    }, 3000);
  };

  const reset = () => {
    setImage(null);
    setStatus('idle');
    setResult(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Camera</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Khung hiển thị ảnh / Placeholder */}
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            {image ? (
              <View style={{ width: '100%', height: '100%' }}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                {status === 'analyzing' && (
                  <Animated.View style={[styles.scanLine, animatedLineStyle]}>
                    <LinearGradient
                      colors={['transparent', '#1877F2', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ flex: 1 }}
                    />
                  </Animated.View>
                )}
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
                <Ionicons name="camera-outline" size={64} color="#E0E0E0" />
                <Text style={styles.placeholderText}>Chưa có ảnh nào được chọn</Text>
              </View>
            )}
          </View>
        </View>

        {/* Nút thao tác */}
        <View style={styles.actionSection}>
          {(status === 'idle' || status === 'result') && (
            <Animated.View entering={FadeInDown} style={styles.buttonRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.cameraBtn]} onPress={() => pickImage(true)}>
                <Ionicons name="camera" size={20} color="#FFF" />
                <Text style={styles.btnText}>Chụp ảnh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.uploadBtn]} onPress={() => pickImage(false)}>
                <Ionicons name="cloud-upload" size={20} color="#FFF" />
                <Text style={styles.btnText}>Tải ảnh lên</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {status === 'selected' && (
            <Animated.View entering={FadeInDown} style={styles.singleButtonRow}>
              <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze}>
                <LinearGradient
                  colors={['#1877F2', '#005AC1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnTextLarge}>Phân tích ngay</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={reset}>
                <Text style={styles.cancelBtnText}>Chọn ảnh khác</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Thông tin từ AI */}
        <View style={styles.aiMessageSection}>
          {status === 'idle' && (
            <Animated.View entering={FadeInDown} style={styles.aiBubble}>
              <Text style={styles.aiText}>AI: Bạn hãy chụp hoặc tải ảnh hiện vật văn hóa lên nhé ...</Text>
            </Animated.View>
          )}

          {status === 'selected' && (
            <Animated.View entering={FadeInDown} style={styles.aiBubble}>
              <Text style={styles.aiText}>AI: Bấm vào phân tích ngay, thấu kính văn hóa sẽ phân tích ảnh của bạn ...</Text>
            </Animated.View>
          )}

          {status === 'analyzing' && (
            <Animated.View entering={FadeIn} style={[styles.aiBubble, styles.analyzingBubble]}>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={[styles.aiText, { color: '#FFF', marginLeft: 10 }]}>Đang phân tích ...</Text>
            </Animated.View>
          )}

          {status === 'result' && result && (
            <Animated.View entering={FadeInDown} style={[styles.aiBubble, styles.resultBubble]}>
              <Text style={[styles.aiText, { color: '#FFF', fontWeight: 'bold', fontSize: 16 }]}>AI Kết quả:</Text>
              <Text style={[styles.aiText, { color: '#FFF', marginTop: 4, fontWeight: '700' }]}>Tiêu đề: {result.title}</Text>
              <Text style={[styles.aiText, { color: '#FFF', marginTop: 8, lineHeight: 22 }]}>Nội dung: {result.content}</Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Thanh chat dưới cùng */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="mic-outline" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="images-outline" size={24} color="#666" />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Nhập tin nhắn của bạn ..."
            style={styles.input}
            value={chatText}
            onChangeText={setChatText}
          />
        </View>
        <TouchableOpacity style={[styles.sendBtn, !chatText.trim() && { opacity: 0.5 }]}>
          <LinearGradient
             colors={['#1877F2', '#005AC1']}
             style={styles.sendBtnGradient}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  imageSection: { padding: 30, alignItems: 'center' },
  imageContainer: { 
    width: SCREEN_WIDTH - 60, 
    aspectRatio: 1, 
    backgroundColor: '#FFF',
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  scanLine: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    height: 4, 
    zIndex: 10 
  },
  placeholderContainer: { alignItems: 'center', padding: 20 },
  placeholderText: { marginTop: 15, color: '#CCC', fontSize: 14, fontWeight: '500' },
  
  // Corners cho placeholder
  cornerTL: { position: 'absolute', top: 20, left: 20, width: 30, height: 30, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#1A1A1A', borderTopLeftRadius: 10 },
  cornerTR: { position: 'absolute', top: 20, right: 20, width: 30, height: 30, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#1A1A1A', borderTopRightRadius: 10 },
  cornerBL: { position: 'absolute', bottom: 20, left: 20, width: 30, height: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#1A1A1A', borderBottomLeftRadius: 10 },
  cornerBR: { position: 'absolute', bottom: 20, right: 20, width: 30, height: 30, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#1A1A1A', borderBottomRightRadius: 10 },

  actionSection: { paddingHorizontal: 30, marginBottom: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 12,
    width: '48%',
    elevation: 2
  },
  cameraBtn: { backgroundColor: '#1877F2' },
  uploadBtn: { backgroundColor: '#34A853' },
  btnText: { color: '#FFF', fontWeight: '700', marginLeft: 8, fontSize: 13 },
  
  singleButtonRow: { alignItems: 'center' },
  analyzeBtn: { width: '100%', height: 54, borderRadius: 15, overflow: 'hidden', elevation: 4 },
  gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnTextLarge: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  cancelBtn: { marginTop: 15, paddingVertical: 10 },
  cancelBtnText: { color: '#666', fontWeight: '600' },

  aiMessageSection: { paddingHorizontal: 25 },
  aiBubble: { 
    backgroundColor: '#1877F2', 
    padding: 20, 
    borderRadius: 20, 
    borderTopLeftRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aiText: { color: '#FFF', fontSize: 15, fontWeight: '500', lineHeight: 22 },
  analyzingBubble: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#1877F2'
  },
  resultBubble: { 
    backgroundColor: '#1877F2',
  },

  bottomBar: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#FFF', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE'
  },
  inputWrapper: { flex: 1, marginHorizontal: 10, backgroundColor: '#F0F2F5', borderRadius: 25, paddingHorizontal: 15, height: 45, justifyContent: 'center' },
  input: { fontSize: 15, color: '#1A1A1A' },
  iconBtn: { padding: 5 },
  sendBtn: { width: 45, height: 45, borderRadius: 23, overflow: 'hidden' },
  sendBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

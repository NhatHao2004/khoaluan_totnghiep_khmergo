import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { analyzeImage } from '../services/ai-service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

type Mode = 'chat' | 'camera';
type AnalysisStatus = 'idle' | 'selected' | 'analyzing' | 'result';

export default function AIAssistantScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();

  // Tabs State
  const [activeTab, setActiveTab] = useState<Mode>('chat');

  // Chat State
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Chào bạn! Tôi là trợ lý AI của KhmerGo. Tôi có thể giúp gì cho bạn về văn hóa, địa điểm hoặc ngôn ngữ Khmer?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Camera State
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);
  const scanPos = useSharedValue(0);

  // Camera Animations
  useEffect(() => {
    if (status === 'analyzing') {
      scanPos.value = withSequence(
        withTiming(1, { duration: 2000 }), // Lần 1: Quét xuống
        withTiming(0, { duration: 2000 }), // Lần 2: Quét lên
        withTiming(1, { duration: 2000 })  // Lần 3: Quét xuống
      );
    } else {
      scanPos.value = 0;
    }
  }, [status]);

  const animatedLineStyle = useAnimatedStyle(() => ({
    top: `${scanPos.value * 100}%`,
    opacity: status === 'analyzing' ? 1 : 0,
  }));

  // Chat Logic
  const sendMessage = () => {
    if (inputText.trim() === '') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: Message = { id: Date.now().toString(), text: inputText.trim(), sender: 'user', timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setTimeout(() => {
      const aiResponse: Message = { id: (Date.now() + 1).toString(), text: 'Đang kết nối với trí tuệ nhân tạo để trả lời câu hỏi của bạn...', sender: 'ai', timestamp: new Date() };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      setTimeout(() => { scrollViewRef.current?.scrollToEnd({ animated: true }); }, 100);
    }
  }, [messages, activeTab]);

  // Camera Logic
  const pickImage = async (useCamera: boolean = false) => {
    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 1 });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 1 });
    }
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setStatus('selected');
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setStatus('analyzing');
    try {
      const minAnalysisTime = new Promise(resolve => setTimeout(resolve, 6000));
      const manipulatedImage = await ImageManipulator.manipulateAsync(image, [{ resize: { width: 800 } }], { base64: true, format: ImageManipulator.SaveFormat.JPEG, compress: 0.7 });
      if (!manipulatedImage.base64) throw new Error("Base64 error");
      const responsePromise = analyzeImage(manipulatedImage.base64);
      const [response] = await Promise.all([responsePromise, minAnalysisTime]);

      if (response.artifact) {
        setResult({ title: response.artifact.name, content: "Đặc điểm nhận diện: " + response.artifact.features });
      } else if (response.isRecognized && response.rawResponse) {
        setResult({ title: "Phân tích từ AI", content: response.rawResponse });
      } else {
        setResult({ title: "Vật thể không xác định", content: "AI chưa thể nhận diện được các đặc điểm của hiện vật này." });
      }
    } catch (error) {
      setResult({ title: "Lỗi kết nối", content: "Vui lòng thử lại sau giây lát." });
    } finally {
      setStatus('result');
    }
  };

  const resetCamera = () => { setImage(null); setStatus('idle'); setResult(null); };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>KhmerGo AI</Text>
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={resetCamera}>
          <Ionicons name={activeTab === 'camera' ? 'trash-outline' : 'ellipsis-vertical'} size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('chat'); }}
          >
            <Ionicons name="chatbubbles" size={18} color={activeTab === 'chat' ? '#FFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>AI Chatbot</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'camera' && styles.activeTab]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('camera'); }}
          >
            <Ionicons name="camera" size={18} color={activeTab === 'camera' ? '#FFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'camera' && styles.activeTabText]}>AI Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        {activeTab === 'chat' ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView ref={scrollViewRef} style={styles.messageList} contentContainerStyle={styles.messageListContent} showsVerticalScrollIndicator={false}>
              {messages.map((msg) => (
                <View key={msg.id} style={[styles.messageWrapper, msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}>
                  {msg.sender === 'ai' && <View style={styles.aiAvatar}><Ionicons name="sparkles" size={16} color="#0066ffff" /></View>}
                  <View style={[styles.bubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                    <Text style={[styles.messageText, msg.sender === 'user' ? styles.userText : styles.aiText]}>{msg.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} placeholder="Hỏi bất cứ điều gì..." placeholderTextColor="#9CA3AF" value={inputText} onChangeText={setInputText} multiline />
              </View>
              <TouchableOpacity style={styles.sendfab} onPress={sendMessage}><Ionicons name="send" size={24} color="#FFF" style={{ marginLeft: 4 }} /></TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.cameraSection}>
                <View style={styles.imageFrame}>
                  <View style={[styles.corner, styles.topL]} /><View style={[styles.corner, styles.topR]} />
                  <View style={[styles.corner, styles.botL]} /><View style={[styles.corner, styles.botR]} />
                  <View style={styles.innerFrame}>
                    {image ? (
                      <View style={styles.imageWrapper}>
                        <Image source={{ uri: image }} style={styles.previewImage} />
                        {status === 'analyzing' && (
                          <Animated.View style={[styles.scanLine, animatedLineStyle]}>
                            <LinearGradient
                              colors={['transparent', '#FF3131', 'transparent']}
                              start={{ x: 0, y: 0.5 }}
                              end={{ x: 1, y: 0.5 }}
                              style={{ flex: 1 }}
                            />
                          </Animated.View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.placeholderContainer}>
                        <View style={styles.focusBracketContainer}>
                          <View style={[styles.focusBracket, styles.fb_tl]} />
                          <View style={[styles.focusBracket, styles.fb_tr]} />
                          <View style={[styles.focusBracket, styles.fb_bl]} />
                          <View style={[styles.focusBracket, styles.fb_br]} />
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {/* AI Card */}
                <View style={[styles.aiCard, { marginBottom: 20 }]}>
                  <View style={styles.aiHeader}>
                    <View style={styles.aiAvatarSmall}><Ionicons name="bulb" size={20} color="#FFF" /></View>
                    <Text style={styles.aiNameSmall}>Trợ lý KhmerGo</Text>
                  </View>
                  {status === 'idle' && <Text style={styles.aiBubbleTextSmall}>Tải lên hoặc chụp ảnh liên quan đến văn hóa Khmer Nam Bộ. KhmerGo AI sẽ hỗ trợ phân tích và giải thích chi tiết.</Text>}
                  {status === 'selected' && <Text style={styles.aiBubbleTextSmall}>Đã sẵn sàng nhấn “Bắt đầu phân tích” để KhmerGo AI khám phá và giải thích ý nghĩa văn hóa của hiện vật này.</Text>}
                  {status === 'analyzing' && <View style={styles.analyzingBox}><ActivityIndicator color="#0066ffff" /><Text style={styles.analyzingText}>Đang phân tích ...</Text></View>}
                  {status === 'result' && result && (
                    <View>
                      <Text style={styles.resultTitleSmall}>{result.title}</Text>
                      <Text style={styles.aiBubbleTextSmall}>{result.content}</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons - only inside ScrollView when showing results */}
                {status === 'result' && (
                  <View style={[styles.camBtnRow, { marginTop: 20 }]}>
                    <TouchableOpacity style={styles.rectBtn} onPress={() => pickImage(false)}>
                      <Ionicons name="images" size={32} color="#0066ffff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rectBtn} onPress={() => pickImage(true)}>
                      <Ionicons name="camera" size={32} color="#0066ffff" />
                    </TouchableOpacity>
                  </View>
                )}

              </View>
            </ScrollView>

            {/* Fixed Buttons at bottom for Idle and Selected states */}
            {activeTab === 'camera' && (status === 'idle' || status === 'selected') && (
              <View style={styles.fixedCameraActions}>
                {status === 'idle' ? (
                  <View style={styles.camBtnRow}>
                    <TouchableOpacity style={styles.rectBtn} onPress={() => pickImage(false)}>
                      <Ionicons name="images" size={32} color="#0066ffff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rectBtn} onPress={() => pickImage(true)}>
                      <Ionicons name="camera" size={32} color="#0066ffff" />
                    </TouchableOpacity>
                  </View>
                ) : status === 'selected' ? (
                  <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze}>
                    <LinearGradient colors={['#0066ffff', '#0052cc']} style={styles.analyzeGradient}>
                      <Text style={styles.analyzeBtnText}>BẮT ĐẦU PHÂN TÍCH</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: 40, paddingBottom: 10, paddingHorizontal: 20, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 15 },
  headerInfo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', textAlign: 'center' },
  menuBtn: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },

  tabContainer: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#FFF' },
  tabWrapper: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 25, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 6 },
  activeTab: { backgroundColor: '#0066ffff', shadowColor: '#0066ffff', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  activeTabText: { color: '#FFF' },

  contentArea: { flex: 1 },
  messageList: { flex: 1 },
  messageListContent: { padding: 20, paddingBottom: 30 },
  messageWrapper: { flexDirection: 'row', marginBottom: 20, maxWidth: '85%' },
  aiWrapper: { alignSelf: 'flex-start' },
  userWrapper: { alignSelf: 'flex-end' },
  aiAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#e6f0ff', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  aiBubble: { backgroundColor: '#FFF', borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: '#0066ffff', borderBottomRightRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22, textAlign: 'justify' },
  aiText: { color: '#1E293B' },
  userText: { color: '#FFF' },

  inputContainer: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputWrapper: { flex: 1, height: 50, backgroundColor: '#FFF', borderRadius: 25, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  input: { flex: 1, fontSize: 14, color: '#1E293B' },
  attachBtn: { marginRight: 8 },
  micBtn: { marginLeft: 8 },
  sendfab: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#0066ffff', justifyContent: 'center', alignItems: 'center', elevation: 5 },

  cameraSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, alignItems: 'center' },
  imageFrame: { width: SCREEN_WIDTH - 80, aspectRatio: 1, padding: 15, position: 'relative', marginBottom: 20 },
  innerFrame: { width: '100%', height: '100%', borderRadius: 25, overflow: 'hidden', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  imageWrapper: { width: '100%', height: '100%' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 4, zIndex: 10 },
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  corner: { position: 'absolute', width: 45, height: 45, borderColor: '#1F2937', borderStyle: 'solid', zIndex: 20 },
  topL: { top: 0, left: 0, borderTopWidth: 6, borderLeftWidth: 6, borderTopLeftRadius: 15 },
  topR: { top: 0, right: 0, borderTopWidth: 6, borderRightWidth: 6, borderTopRightRadius: 15 },
  botL: { bottom: 0, left: 0, borderBottomWidth: 6, borderLeftWidth: 6, borderBottomLeftRadius: 15 },
  botR: { bottom: 0, right: 0, borderBottomWidth: 6, borderRightWidth: 6, borderBottomRightRadius: 15 },

  focusBracketContainer: { width: 80, height: 80, position: 'relative' },
  focusBracket: { position: 'absolute', width: 25, height: 25, borderColor: '#94A3B8', borderStyle: 'solid' },
  fb_tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
  fb_tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
  fb_bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
  fb_br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },

  aiCard: {
    backgroundColor: '#FFF',
    borderRadius: 35,
    padding: 24,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#1F2937',
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiAvatarSmall: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0066ffff', justifyContent: 'center', alignItems: 'center' },
  aiNameSmall: { marginLeft: 12, fontSize: 18, fontWeight: '900', color: '#1E293B' },
  aiBubbleTextSmall: { fontSize: 16, color: '#475569', lineHeight: 26, textAlign: 'justify' },
  analyzingBox: { alignItems: 'center', paddingVertical: 10 },
  analyzingText: { marginTop: 5, color: '#0066ffff', fontWeight: '600' },
  resultTitleSmall: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginBottom: 5 },

  camBtnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
  rectBtn: {
    flex: 1,
    height: 70,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeBtn: { width: '100%', height: 60, borderRadius: 20, overflow: 'hidden' },
  analyzeGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  analyzeBtnText: { color: '#FFF', fontWeight: '800', letterSpacing: 0.5, fontSize: 16 },

  fixedCameraActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 25,
    paddingBottom: 35,
    paddingTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

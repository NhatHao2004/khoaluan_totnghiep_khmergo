import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ms, s, vs } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { analyzeImage, chatWithAI } from '../services/ai-service';

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
      id: 'default',
      text: t('ai_intro'),
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const toastY = useSharedValue(-120);

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    toastY.value = withTiming(Platform.OS === 'ios' ? 50 : 40, { duration: 400 });

    setTimeout(() => {
      toastY.value = withTiming(-120, { duration: 400 });
      setTimeout(() => setShowToast(false), 400);
    }, 4000);
  };

  // Persistence Key - Tied to User ID for Privacy
  const CHAT_HISTORY_KEY = user?.uid ? `KHMERGO_CHAT_HISTORY_${user.uid}` : 'KHMERGO_CHAT_HISTORY_GUEST';

  // Load History
  useEffect(() => {
    const loadChat = async () => {
      try {
        const storedChat = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
        if (storedChat) {
          const parsed = JSON.parse(storedChat);
          const formatted = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
          setMessages(formatted);
        } else {
          // Reset to default welcome message if no history for this specific user/guest
          setMessages([{
            id: 'default',
            text: t('ai_intro'),
            sender: 'ai',
            timestamp: new Date(),
          }]);
        }
      } catch (e) { 
        console.error("Load error", e); 
      }
    };
    loadChat();
  }, [user?.uid, CHAT_HISTORY_KEY]); // Reload when user changes

  // Save History
  useEffect(() => {
    const saveChat = async () => {
      try { await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages)); }
      catch (e) { console.error("Save error", e); }
    };
    if (messages.length > 0) saveChat();
  }, [messages]);

  const clearChat = async () => {
    // Chỉ xóa nếu có nhiều hơn 1 tin nhắn (không tính tin chào mặc định)
    if (messages.length <= 1) return;

    try {
      await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
      setMessages([{
        id: 'default',
        text: t('ai_intro'),
        sender: 'ai',
        timestamp: new Date(),
      }]);
      triggerToast(t('clear_chat_history'));
    } catch (e) { console.error(e); }
  };
  const scrollViewRef = useRef<ScrollView>(null);

  // Camera State
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scanPos = useSharedValue(0);

  // Keyboard Handling (Mirroring Community style)
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e: any) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  const animatedToastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
    opacity: interpolate(toastY.value, [-100, 40], [0, 1], 'clamp'),
  }));

  // Chat Logic
  const sendMessage = async () => {
    if (inputText.trim() === '') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputText.trim();
    setInputText('');

    // Tạo ID giả cho tin nhắn đang chờ của AI
    const aiWaitingId = (Date.now() + 1).toString();
    const aiWaitingMsg: Message = {
      id: aiWaitingId,
      text: t('thinking'),
      sender: 'ai',
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, aiWaitingMsg]);

    try {
      const response = await chatWithAI(currentInput);
      setMessages((prev) =>
        prev.map(m => m.id === aiWaitingId ? { ...m, text: response } : m)
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map(m => m.id === aiWaitingId ? { ...m, text: t('ai_error_connection') } : m)
      );
    }
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
      result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 1 });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 1 });
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
        setResult({ title: response.artifact.name, content: t('features_label') + ": " + response.artifact.features });
      } else if (response.isRecognized && response.rawResponse) {
        setResult({ title: t('ai_result_title'), content: response.rawResponse });
      } else {
        setResult({ title: t('ai_unknown_object'), content: t('ai_unknown_desc') });
      }
    } catch (error) {
      setResult({ title: t('connection_error_title'), content: t('connection_error_desc') });
    } finally {
      setStatus('result');
    }
  };

  const resetCamera = () => {
    // Chỉ hoạt động khi có ảnh hoặc kết quả
    if (!image && !result) return;

    setImage(null);
    setStatus('idle');
    setResult(null);
    triggerToast(t('clear_analysis_success'));
  };


  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{activeTab === 'chat' ? 'KhmerGo AI' : 'KhmerGo AI'}</Text>
        </View>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => activeTab === 'camera' ? resetCamera() : clearChat()}
        >
          <Ionicons name="refresh-outline" size={26} color="rgba(255, 0, 0, 1)ff" />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('chat'); }}
          >
            <Ionicons name="chatbubbles" size={20} color={activeTab === 'chat' ? '#FFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]} numberOfLines={1}>AI Chatbot</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'camera' && styles.activeTab]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('camera'); }}
          >
            <Ionicons name="camera" size={20} color={activeTab === 'camera' ? '#FFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'camera' && styles.activeTabText]} numberOfLines={1}>AI Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        {activeTab === 'chat' ? (
          <View style={{ flex: 1 }}>
            <ScrollView ref={scrollViewRef} style={styles.messageList} contentContainerStyle={styles.messageListContent} showsVerticalScrollIndicator={false}>
              {messages.map((msg) => (
                <View key={msg.id} style={[styles.messageWrapper, msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}>
                  {msg.sender === 'ai' ? (
                    <>
                      <Image source={require('@/assets/images/AI.jpg')} style={[styles.chatAvatar, { transform: [{ scale: 1.1 }] }]} />
                      <View style={styles.aiBubbleContainer}>
                        <View style={styles.aiBubble}>
                          <Text
                            style={styles.aiMessageText}
                            textBreakStrategy="highQuality"
                          >
                            {msg.text.replace(/\[LINK:.*?\]/g, '').replace(/\n\s*\n/g, '\n').replace(/\s+([.,!?;])/g, '$1').replace(/\s\s+/g, ' ').trim()}
                          </Text>
                          {msg.text.includes('[LINK:') && (
                            <TouchableOpacity
                              style={styles.detailBtn}
                              onPress={() => {
                                const match = msg.text.match(/\[LINK:(.*?)\]/);
                                if (match) {
                                  const id = match[1];
                                  if (id === 'food_all') {
                                    router.push('/food');
                                  } else if (id === 'pagoda_all') {
                                    router.push('/pagoda');
                                  } else if (id === 'culture_all') {
                                    router.push('/culture');
                                  } else if (id.startsWith('pagoda_')) {
                                    router.push({ pathname: '/pagoda-detail', params: { id } });
                                  } else if (id.startsWith('culture_')) {
                                    router.push({ pathname: '/culture-detail', params: { id } });
                                  } else if (id.startsWith('food_')) {
                                    router.push({ pathname: '/food-detail', params: { id } });
                                  }
                                }
                              }}
                            >
                              <Text style={styles.detailBtnText}>
                                {msg.text.includes('_all]') ? t('explore_now') : t('view_details')}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.chatTime}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.userBubbleContainer}>
                        <View style={styles.userBubble}>
                          <Text
                            style={styles.userMessageText}
                            textBreakStrategy="highQuality"
                          >
                            {msg.text}
                          </Text>
                        </View>
                        <Text style={[styles.chatTime, { textAlign: 'right' }]}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Image source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?u=me' }} style={styles.chatAvatar} />
                    </>
                  )}
                </View>
              ))}
            </ScrollView>
            <View style={[
              styles.inputContainer,
              {
                paddingBottom: keyboardHeight > 0
                  ? (Platform.OS === 'ios' ? keyboardHeight - 15 : keyboardHeight + 10)
                  : 12
              }
            ]}>
              <TextInput
                style={styles.input}
                placeholder={t('ask_anything_placeholder')}
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <TouchableOpacity style={styles.sendfab} onPress={sendMessage}>
                <Ionicons name="send" size={28} color={inputText.trim() ? "#1877F2" : "#1877F2"} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: (status === 'idle' || status === 'selected') ? 150 : 10
              }}
            >
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

                {/* AI Card - positioned directly below the camera frame */}
                <View style={[styles.aiCard, { width: '100%', marginTop: 0 }]}>
                  <View style={styles.aiHeader}>
                  </View>

                  {(status === 'idle' || status === 'selected') && (
                    <View style={{ marginBottom: 5 }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }}>
                        {status === 'idle' ? t('ai_camera_idle_title') : t('ai_camera_ready')}
                      </Text>
                    </View>
                  )}
                  {status === 'idle' && <Text style={styles.aiBubbleTextSmall}>{t('ai_camera_idle_desc')}</Text>}
                  {status === 'selected' && <Text style={styles.aiBubbleTextSmall}>{t('ai_camera_selected_desc')}</Text>}
                  {status === 'analyzing' && <View style={[styles.analyzingBox, { marginTop: 120 }]}>
                    <ActivityIndicator color="#0066ffff" size="large" />
                    <Text style={styles.analyzingText}>{t('ai_analyzing')}</Text>
                  </View>}

                  {status === 'result' && result && (
                    <View style={{ marginTop: -5 }}>
                      <Text style={styles.resultTitleSmall}>{result.title}</Text>
                      <Text style={styles.aiBubbleTextSmall}>{result.content}</Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Fixed Bottom Action Buttons */}
            {activeTab === 'camera' && (status === 'idle' || status === 'selected') && (
              <View style={styles.fixedCameraActions}>
                {status === 'idle' && (
                  <View style={styles.camBtnRow}>
                    <TouchableOpacity style={styles.rectBtn} onPress={() => pickImage(false)}>
                      <Ionicons name="images" size={32} color="#0066ffff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rectBtn} onPress={() => pickImage(true)}>
                      <Ionicons name="camera" size={32} color="#0066ffff" />
                    </TouchableOpacity>
                  </View>
                )}

                {status === 'selected' && (
                  <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze}>
                    <LinearGradient colors={['#0066ffff', '#0052cc']} style={styles.analyzeGradient}>
                      <Text style={styles.analyzeBtnText}>{t('ai_start_analysis')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>
      {showToast && (
        <Animated.View style={[
          styles.toastContainer,
          animatedToastStyle,
          {
            backgroundColor: toastType === 'error' ? '#EF4444' : (toastType === 'success' ? '#10B981' : '#007AFF'),
            shadowColor: toastType === 'error' ? '#EF4444' : (toastType === 'success' ? '#10B981' : '#007AFF'),
          }
        ]}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name={toastType === 'success' ? "checkmark" : (toastType === 'error' ? "close" : "information")} size={18} color="#FFF" />
          </View>
          <Text style={styles.toastText} numberOfLines={1} adjustsFontSizeToFit>{toastMsg}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: s(15),
    right: s(15),
    zIndex: 10000,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(14),
    paddingHorizontal: s(20),
    borderRadius: ms(22),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  toastText: { color: '#FFF', fontSize: ms(15), fontWeight: '700', marginLeft: s(15), flex: 1, letterSpacing: 0.3 },
  header: { paddingTop: vs(40), paddingBottom: vs(10), paddingHorizontal: s(20), backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: s(15) },
  headerInfo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: ms(20), fontWeight: '900', color: '#1A1A1A', textAlign: 'center' },
  menuBtn: { width: s(42), height: s(42), justifyContent: 'center', alignItems: 'center' },

  tabContainer: { paddingHorizontal: s(20), paddingVertical: vs(10), backgroundColor: '#FFF' },
  tabWrapper: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: ms(25), padding: s(4) },
  tab: { flex: 1, flexDirection: 'row', height: vs(40), borderRadius: ms(20), alignItems: 'center', justifyContent: 'center', gap: s(6) },
  activeTab: {
    backgroundColor: '#1877F2',
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  tabText: { fontSize: ms(13), fontWeight: '700', color: '#64748B' },
  activeTabText: { color: '#FFF' },

  contentArea: { flex: 1 },
  messageList: { flex: 1 },
  messageListContent: { paddingHorizontal: s(15), paddingTop: vs(15), paddingBottom: vs(30) },
  messageWrapper: { flexDirection: 'row', marginBottom: vs(24), width: '100%', paddingHorizontal: s(10), alignItems: 'flex-start' },
  aiWrapper: { alignSelf: 'flex-start' },
  userWrapper: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  chatAvatar: { width: s(36), height: s(36), borderRadius: s(18), backgroundColor: '#F1F3F4', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  aiBubbleContainer: { marginLeft: s(8), flex: 1, maxWidth: '82%' },
  userBubbleContainer: { marginRight: s(8), alignItems: 'flex-end', flex: 1, maxWidth: '82%' },
  chatName: { fontSize: ms(13), fontWeight: '700', color: '#5F6368', marginBottom: vs(4), marginLeft: s(8) },
  chatTime: { fontSize: ms(11), color: '#70757A', marginTop: vs(4), marginLeft: s(8) },
  aiBubble: {
    backgroundColor: '#F1F3F4',
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
    borderRadius: ms(22),
    borderTopLeftRadius: ms(4),
    alignSelf: 'flex-start'
  },
  userBubble: {
    backgroundColor: '#1877F2',
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
    borderRadius: ms(22),
    borderBottomRightRadius: ms(4),
    alignSelf: 'flex-end'
  },
  aiMessageText: { fontSize: ms(16), color: '#1A1A1A', lineHeight: ms(22), textAlign: 'justify' },
  userMessageText: { fontSize: ms(16), color: '#FFFFFF', lineHeight: ms(22), textAlign: 'justify' },

  detailBtn: {
    backgroundColor: '#1877F2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: ms(12),
    marginTop: vs(6),
    alignSelf: 'flex-start',
    gap: s(6)
  },
  detailBtnText: {
    color: '#FFF',
    fontSize: ms(14),
    fontWeight: '700'
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: vs(60),
    paddingRight: s(10)
  },
  menuPopup: {
    width: s(220),
    backgroundColor: '#FFF',
    borderRadius: ms(16),
    padding: s(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(12),
    gap: s(12)
  },
  menuItemText: {
    fontSize: ms(15),
    fontWeight: '600',
    color: '#1A1A1A'
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: s(8)
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(15),
    paddingTop: vs(12),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF'
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: ms(20),
    paddingHorizontal: s(15),
    paddingVertical: vs(10),
    fontSize: ms(16),
    maxHeight: vs(110),
    color: '#1A1A1A'
  },
  sendfab: {
    marginLeft: s(10),
    width: s(45),
    height: s(45),
    justifyContent: 'center',
    alignItems: 'center'
  },

  cameraSection: { paddingHorizontal: s(20), paddingTop: vs(20), paddingBottom: vs(10), alignItems: 'center' },
  imageFrame: { width: SCREEN_WIDTH - s(80), aspectRatio: 1, padding: s(15), position: 'relative', marginBottom: vs(10) },
  innerFrame: { width: '100%', height: '100%', borderRadius: ms(25), overflow: 'hidden', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  imageWrapper: { width: '100%', height: '100%' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: vs(4), zIndex: 10 },
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  corner: { position: 'absolute', width: s(45), height: s(45), borderColor: '#000', borderStyle: 'solid', zIndex: 20 },
  topL: { top: 0, left: 0, borderTopWidth: 3.5, borderLeftWidth: 3.5, borderTopLeftRadius: ms(15) },
  topR: { top: 0, right: 0, borderTopWidth: 3.5, borderRightWidth: 3.5, borderTopRightRadius: ms(15) },
  botL: { bottom: 0, left: 0, borderBottomWidth: 3.5, borderLeftWidth: 3.5, borderBottomLeftRadius: ms(15) },
  botR: { bottom: 0, right: 0, borderBottomWidth: 3.5, borderRightWidth: 3.5, borderBottomRightRadius: ms(15) },

  focusBracketContainer: { width: s(80), height: s(80), position: 'relative' },
  focusBracket: { position: 'absolute', width: s(25), height: s(25), borderColor: '#000', borderStyle: 'solid' },
  fb_tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: ms(10) },
  fb_tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: ms(10) },
  fb_bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: ms(10) },
  fb_br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: ms(10) },

  aiCard: {
    backgroundColor: '#FFF',
    borderRadius: ms(35),
    paddingHorizontal: s(24),
    paddingBottom: vs(24),
    paddingTop: vs(5),
    width: '100%',
  },
  aiHeader: { alignItems: 'center', justifyContent: 'center', marginBottom: vs(12) },
  aiAvatarSmall: { width: s(36), height: s(36), borderRadius: s(20), backgroundColor: '#1877F2', justifyContent: 'center', alignItems: 'center' },
  aiNameSmall: { fontSize: ms(18), fontWeight: '900', color: '#1A1A1A', textAlign: 'center' },
  aiBubbleTextSmall: { fontSize: ms(16), color: '#475569', lineHeight: ms(26), textAlign: 'justify' },
  analyzingBox: { alignItems: 'center', paddingVertical: vs(10) },
  analyzingText: { marginTop: vs(5), color: '#1877F2', fontWeight: '600' },
  resultTitleSmall: { fontSize: ms(22), fontWeight: '900', color: '#1A1A1A', marginBottom: vs(5) },

  camBtnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(15) },
  rectBtn: {
    flex: 1,
    height: vs(70),
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeBtn: { width: '100%', height: vs(60), borderRadius: ms(20), overflow: 'hidden' },
  analyzeGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  analyzeBtnText: { color: '#FFF', fontWeight: '800', letterSpacing: 0.5, fontSize: ms(16) },

  fixedCameraActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: s(20),
    paddingBottom: vs(25),
    paddingTop: vs(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  LayoutChangeEvent
} from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analyzeImage, chatWithAI } from '../services/ai-service';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<Mode>('chat');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ id: 'default', text: t('ai_intro'), sender: 'ai', timestamp: new Date() }]);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const toastY = useSharedValue(-120);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(SCREEN_HEIGHT);
  const [initialLayoutHeight, setInitialLayoutHeight] = useState(0);

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg); setToastType(type); setShowToast(true);
    toastY.value = withTiming(Platform.OS === 'ios' ? vs(50) : vs(40), { duration: 400 });
    setTimeout(() => {
      toastY.value = withTiming(-vs(120), { duration: 400 });
      setTimeout(() => setShowToast(false), 400);
    }, 4000);
  };

  const CHAT_HISTORY_KEY = user?.uid ? `KHMERGO_CHAT_HISTORY_${user.uid}` : 'KHMERGO_CHAT_HISTORY_GUEST';

  useEffect(() => {
    const loadChat = async () => {
      try {
        const storedChat = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
        if (storedChat) {
          const parsed = JSON.parse(storedChat);
          setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        } else {
          setMessages([{ id: 'default', text: t('ai_intro'), sender: 'ai', timestamp: new Date() }]);
        }
      } catch (e) { console.error(e); }
    };
    loadChat();
  }, [user?.uid, CHAT_HISTORY_KEY]);

  useEffect(() => {
    if (messages.length > 0) AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  }, [messages, CHAT_HISTORY_KEY]);

  const clearChat = async () => {
    if (messages.length <= 1) return;
    try {
      await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
      setMessages([{ id: 'default', text: t('ai_intro'), sender: 'ai', timestamp: new Date() }]);
      triggerToast(t('clear_chat_history'));
    } catch (e) { console.error(e); }
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);
  const scanPos = useSharedValue(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e: any) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const onRootLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (!initialLayoutHeight) setInitialLayoutHeight(height);
    setLayoutHeight(height);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: Message = { id: Date.now().toString(), text: inputText.trim(), sender: 'user', timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputText.trim();
    setInputText('');
    const aiWaitingId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: aiWaitingId, text: t('thinking'), sender: 'ai', timestamp: new Date() }]);
    try {
      const response = await chatWithAI(currentInput);
      setMessages((prev) => prev.map(m => m.id === aiWaitingId ? { ...m, text: response } : m));
    } catch (e) {
      setMessages((prev) => prev.map(m => m.id === aiWaitingId ? { ...m, text: t('ai_error_connection') } : m));
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, activeTab]);

  const pickImage = async (useCamera: boolean = false) => {
    const { status } = useCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = useCamera ? await ImagePicker.launchCameraAsync({ quality: 1 }) : await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled) { setImage(result.assets[0].uri); setStatus('selected'); setResult(null); }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setStatus('analyzing');
    try {
      const minWait = new Promise(r => setTimeout(r, 6000));
      const manipulated = await ImageManipulator.manipulateAsync(image, [{ resize: { width: 800 } }], { base64: true, format: ImageManipulator.SaveFormat.JPEG });
      const [res] = await Promise.all([analyzeImage(manipulated.base64!), minWait]);
      if (res.artifact) setResult({ title: res.artifact.name, content: t('features_label') + ": " + res.artifact.features });
      else if (res.isRecognized) setResult({ title: t('ai_result_title'), content: res.rawResponse! });
      else setResult({ title: t('ai_unknown_object'), content: t('ai_unknown_desc') });
    } catch (e) { setResult({ title: t('connection_error_title'), content: t('connection_error_desc') }); }
    finally { setStatus('result'); }
  };

  const resetCamera = () => { if (image || result) { setImage(null); setStatus('idle'); setResult(null); triggerToast(t('clear_analysis_success')); } };

  // UNIFIED CALCULATION
  const keyboardSpacer = Math.max(0, keyboardHeight - (initialLayoutHeight - layoutHeight));
  const dynamicPadding = keyboardHeight > 0 ? vs(15) : vs(10);

  const renderContentArea = () => (
    <View style={styles.contentArea}>
      {activeTab === 'chat' ? (
        <View style={{ flex: 1 }}>
          <ScrollView ref={scrollViewRef} style={styles.messageList} contentContainerStyle={styles.messageListContent} showsVerticalScrollIndicator={false}>
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.messageWrapper, msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}>
                {msg.sender === 'ai' ? (
                  <>
                    <Image source={require('@/assets/images/AI.jpg')} style={styles.chatAvatar} />
                    <View style={styles.aiBubbleContainer}>
                      <View style={styles.aiBubble}>
                        <Text style={styles.aiMessageText}>{msg.text}</Text>
                        {msg.text.includes('[LINK:') && (
                          <TouchableOpacity 
                            style={styles.detailBtn} 
                            onPress={() => {
                              const match = msg.text.match(/\[LINK:(.*?)\]/);
                              if (match) {
                                const id = match[1];
                                if (id === 'food_all') router.push('/food');
                                else if (id === 'pagoda_all') router.push('/pagoda');
                                else if (id === 'culture_all') router.push('/culture');
                                else if (id.startsWith('pagoda_')) router.push({ pathname: '/pagoda-detail', params: { id } });
                                else if (id.startsWith('culture_')) router.push({ pathname: '/culture-detail', params: { id } });
                                else if (id.startsWith('food_')) router.push({ pathname: '/food-detail', params: { id } });
                              }
                            }}
                          >
                            <Text style={styles.detailBtnText}>{t('view_details')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.chatTime}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.userBubbleContainer}>
                      <View style={styles.userBubble}><Text style={styles.userMessageText}>{msg.text}</Text></View>
                      <Text style={[styles.chatTime, { textAlign: 'right' }]}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <Image source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?u=me' }} style={styles.chatAvatar} />
                  </>
                )}
              </View>
            ))}
          </ScrollView>
          <View style={[styles.inputContainer, { paddingBottom: dynamicPadding }]}>
            <TextInput style={styles.input} placeholder={t('ask_anything_placeholder')} placeholderTextColor="#9CA3AF" value={inputText} onChangeText={setInputText} multiline />
            <TouchableOpacity style={styles.sendfab} onPress={sendMessage}><Ionicons name="send" size={28} color="#1877F2" /></TouchableOpacity>
          </View>
          {Platform.OS === 'android' && <View style={{ height: keyboardSpacer }} />}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 150 }}>
            <View style={styles.cameraSection}>
              <View style={styles.imageFrame}><View style={styles.innerFrame}>{image ? <Image source={{ uri: image }} style={styles.previewImage} /> : <View style={styles.placeholderContainer} />}</View></View>
              <View style={styles.aiCard}><Text style={styles.resultTitleSmall}>{result?.title || t('ai_camera_ready')}</Text><Text style={styles.aiBubbleTextSmall}>{result?.content || t('ai_camera_selected_desc')}</Text></View>
            </View>
          </ScrollView>
          <View style={[styles.fixedCameraActions, { bottom: keyboardSpacer > 0 ? (keyboardSpacer + vs(20)) : vs(20) }]}>
             <View style={styles.camBtnRow}>
                <TouchableOpacity style={styles.rectBtn} onPress={() => pickImage(false)}><Ionicons name="images" size={32} color="#1877F2" /></TouchableOpacity>
                <TouchableOpacity style={styles.rectBtn} onPress={() => pickImage(true)}><Ionicons name="camera" size={32} color="#1877F2" /></TouchableOpacity>
              </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container} onLayout={onRootLayout}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={28} color="#1F2937" /></TouchableOpacity>
        <View style={styles.headerInfo}><Text style={styles.headerTitle}>KhmerGo AI</Text></View>
        <TouchableOpacity onPress={() => activeTab === 'camera' ? resetCamera() : clearChat()}><Ionicons name="refresh-outline" size={ms(26)} color="#EF4444" /></TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity style={[styles.tab, activeTab === 'chat' && styles.activeTab]} onPress={() => setActiveTab('chat')}>
            <Ionicons name="chatbubbles" size={ms(20)} color={activeTab === 'chat' ? '#FFF' : '#6B7280'} /><Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>AI Chatbot</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'camera' && styles.activeTab]} onPress={() => setActiveTab('camera')}>
            <Ionicons name="camera" size={ms(20)} color={activeTab === 'camera' ? '#FFF' : '#6B7280'} /><Text style={[styles.tabText, activeTab === 'camera' && styles.activeTabText]}>AI Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
          {renderContentArea()}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>
          {renderContentArea()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingTop: vs(40), paddingBottom: vs(10), paddingHorizontal: s(20), flexDirection: 'row', alignItems: 'center' },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: ms(20), color: '#1A1A1A', fontWeight: '400' },
  tabContainer: { paddingHorizontal: s(20), paddingVertical: vs(10) },
  tabWrapper: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: ms(25), padding: s(4) },
  tab: { flex: 1, flexDirection: 'row', height: vs(40), borderRadius: ms(20), alignItems: 'center', justifyContent: 'center', gap: s(6) },
  activeTab: { backgroundColor: '#1877F2' },
  tabText: { fontSize: ms(13), color: '#64748B' },
  activeTabText: { color: '#FFF' },
  contentArea: { flex: 1 },
  messageList: { flex: 1 },
  messageListContent: { paddingHorizontal: s(15), paddingTop: vs(15), paddingBottom: vs(30) },
  messageWrapper: { flexDirection: 'row', marginBottom: vs(24), width: '100%', paddingHorizontal: s(10) },
  aiWrapper: { alignSelf: 'flex-start' },
  userWrapper: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  chatAvatar: { width: s(36), height: s(36), borderRadius: s(18) },
  aiBubbleContainer: { marginLeft: s(8), flex: 1, maxWidth: '82%' },
  userBubbleContainer: { marginRight: s(8), alignItems: 'flex-end', flex: 1, maxWidth: '82%' },
  aiBubble: { backgroundColor: '#F1F3F4', padding: s(12), borderRadius: ms(20), borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: '#1877F2', padding: s(12), borderRadius: ms(20), borderBottomRightRadius: 4 },
  aiMessageText: { fontSize: ms(16), color: '#1A1A1A', lineHeight: ms(22) },
  userMessageText: { fontSize: ms(16), color: '#FFF', lineHeight: ms(22) },
  chatTime: { fontSize: ms(11), color: '#70757A', marginTop: 4 },
  detailBtn: { backgroundColor: '#1877F2', paddingHorizontal: s(12), paddingVertical: vs(6), borderRadius: ms(10), marginTop: vs(8), alignSelf: 'flex-start' },
  detailBtnText: { color: '#FFF', fontSize: ms(14), fontWeight: '400' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: s(15), paddingTop: vs(12), borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#FFF' },
  input: { flex: 1, backgroundColor: '#F0F2F5', borderRadius: ms(20), paddingHorizontal: s(15), paddingVertical: vs(10), maxHeight: vs(110), fontSize: ms(16) },
  sendfab: { marginLeft: s(10) },
  cameraSection: { padding: 20, alignItems: 'center' },
  imageFrame: { width: SCREEN_WIDTH - s(80), aspectRatio: 1, position: 'relative', marginBottom: 20 },
  innerFrame: { width: '100%', height: '100%', backgroundColor: '#F1F5F9', borderRadius: 25, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderContainer: { flex: 1, backgroundColor: '#F1F5F9' },
  corner: { position: 'absolute', width: s(45), height: s(45), borderColor: '#000', borderStyle: 'solid', zIndex: 20 },
  topL: { top: 0, left: 0, borderTopWidth: 3.5, borderLeftWidth: 3.5, borderTopLeftRadius: 15 },
  topR: { top: 0, right: 0, borderTopWidth: 3.5, borderRightWidth: 3.5, borderTopRightRadius: 15 },
  botL: { bottom: 0, left: 0, borderBottomWidth: 3.5, borderLeftWidth: 3.5, borderBottomLeftRadius: 15 },
  botR: { bottom: 0, right: 0, borderBottomWidth: 3.5, borderRightWidth: 3.5, borderBottomRightRadius: 15 },
  aiCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
  aiBubbleTextSmall: { fontSize: ms(16), color: '#475569', lineHeight: ms(24) },
  resultTitleSmall: { fontSize: ms(20), fontWeight: '400', color: '#1A1A1A', marginBottom: 8 },
  fixedCameraActions: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 20 },
  camBtnRow: { flexDirection: 'row', gap: 15, justifyContent: 'center' },
  rectBtn: { flex: 1, height: vs(60), backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#1877F2', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  analyzeBtn: { width: '100%', height: vs(60), borderRadius: 20, overflow: 'hidden' },
  analyzeGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  analyzeBtnText: { color: '#FFF', fontSize: ms(18), fontWeight: '400' }
});

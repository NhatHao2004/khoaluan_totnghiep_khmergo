import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms, s, vs } from '@/utils/responsive';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SupportScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userFeedbacks, setUserFeedbacks] = useState<any[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load user feedbacks
  useEffect(() => {
    if (!user) {
      setUserFeedbacks([]);
      setLoadingFeedbacks(false);
      return;
    }

    const q = query(
      collection(db, 'feedback'),
      where('userId', '==', user.uid)
      // Tạm thời bỏ orderBy để tránh lỗi Missing Index, sẽ sort thủ công ở dưới
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const item = doc.data();
          return {
            id: doc.id,
            ...item,
            // Ưu tiên adminReply, fallback sang message nếu cần (tùy cấu trúc cũ)
            adminReply: item.adminReply || item.reply || null
          };
        });

        // Sắp xếp thủ công tại client để tránh lỗi Index
        data.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setUserFeedbacks(data);
        setLoadingFeedbacks(false);
      },
      (error) => {
        console.error("Firebase onSnapshot error:", error);
        setLoadingFeedbacks(false); // Quan trọng: tắt loading dù có lỗi
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Toast States
  const [showToastState, setShowToastState] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastY = useSharedValue(-100);
  const insets = useSafeAreaInsets();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToastState(true);
    toastY.value = withTiming(0, { duration: 400 });

    setTimeout(() => {
      toastY.value = withTiming(-120, { duration: 400 });
      setTimeout(() => setShowToastState(false), 400);
    }, 3000);
  };

  const animatedToastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
    opacity: interpolate(toastY.value, [-100, 0], [0, 1], 'clamp'),
  }));

  const handleSendFeedback = async () => {
    if (!user) {
      showToast(t('login_to_send'), 'error');
      return;
    }


    if (!content.trim()) {
      showToast(t('content_required'), 'error');
      return;
    }

    setIsSending(true);
    try {
      const newFeedbackData = {
        userId: user.uid,
        userName: user.name || 'User',
        avatar: user.avatar || null,
        'e-mail': user.email,
        subject: 'Phản hồi đóng góp',
        content: content.trim(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'feedback'), newFeedbackData);

      // Cập nhật local state ngay lập tức để người dùng thấy luôn
      const optimisticFeedback = {
        id: Date.now().toString(),
        ...newFeedbackData,
        createdAt: { toDate: () => new Date() } // Giả lập để không bị lỗi khi render date
      };
      setUserFeedbacks(prev => [optimisticFeedback, ...prev]);

      showToast(t('feedback_success'), 'success');
      setContent('');
    } catch (error) {
      console.error('Error sending feedback:', error);
      showToast(t('feedback_failed'), 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    // Cập nhật local state trước để UI biến mất ngay lập tức
    setUserFeedbacks(prev => prev.filter(item => item.id !== id));

    try {
      await deleteDoc(doc(db, 'feedback', id));
      showToast(t('delete_feedback_success'), 'success');
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      showToast(t('delete_feedback_failed'), 'error');
      // Nếu lỗi thì nên load lại data từ snapshot (onSnapshot sẽ tự động làm việc này)
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('support_feedback')}</Text>
        <View style={{ width: 25 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('faq')}</Text>
          <TouchableOpacity style={styles.faqItem} onPress={() => router.push('/faq/learn' as any)}>
            <View style={[styles.faqIconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="person-circle-outline" size={24} color="#22C55E" />
            </View>
            <View style={styles.faqInfo}>
              <Text style={styles.faqText}>{t('faq_how_to_learn')}</Text>
              <Text style={styles.faqSub}>{t('tap_to_see_guide')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem} onPress={() => router.push('/faq/use' as any)}>
            <View style={[styles.faqIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="help-circle-outline" size={22} color="#3B82F6" />
            </View>
            <View style={styles.faqInfo}>
              <Text style={styles.faqText}>{t('faq_how_to_use')}</Text>
              <Text style={styles.faqSub}>{t('tap_to_see_guide')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem} onPress={() => router.push('/faq/quiz' as any)}>
            <View style={[styles.faqIconCircle, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="trophy-outline" size={22} color="#F59E0B" />
            </View>
            <View style={styles.faqInfo}>
              <Text style={styles.faqText}>{t('faq_how_to_quiz')}</Text>
              <Text style={styles.faqSub}>{t('tap_to_see_guide')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Feedback Section */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>{t('feedback_section')}</Text>

          <View style={styles.formContainer}>

            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('feedback_placeholder')}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
              onPress={handleSendFeedback}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.sendBtnText}>{t('send_feedback')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Feedback History Section */}
        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>{t('feedback_history')}</Text>

          {loadingFeedbacks ? (
            <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 20 }} />
          ) : userFeedbacks.length > 0 ? (
            userFeedbacks.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.ultraSimpleCard}
                onLongPress={() => setDeletingId(item.id)}
                onPress={() => deletingId && setDeletingId(null)}
                activeOpacity={0.7}
              >
                <View style={styles.historyItemGroup}>
                  <View style={styles.cardMainRow}>
                    <Text style={[styles.userMsgText, { flex: 1 }, language === 'km' && { textAlign: 'left' }]}>
                      {t('feedback_content_label')}: {item.content || item.message || (item.thrilled !== item.userName ? item.thrilled : '') || t('no_content')}
                    </Text>
                  </View>

                  {(item.adminReply || item.reply || item.response) && (
                    <View style={styles.systemReplyBox}>
                      <View style={styles.systemReplyHeader}>
                        <Ionicons name="chatbubble-ellipses" size={16} color="#EF4444" />
                        <Text style={styles.systemReplyTitle}>{t('system_reply')}</Text>
                      </View>
                      <Text style={[styles.systemReplyText, language === 'km' && { textAlign: 'left' }]}>
                        {item.adminReply || item.reply || item.response}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.historyFooter}>
                  {deletingId === item.id && (
                    <TouchableOpacity
                      onPress={() => handleDeleteFeedback(item.id)}
                      style={styles.bottomDeleteBtn}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : null}
        </View>
      </ScrollView>

      {/* Premium Toast System */}
      {showToastState && (
        <Animated.View
          style={[
            styles.toastContainer,
            animatedToastStyle,
            {
              backgroundColor: toastType === 'error' ? '#EF4444' : '#10B981',
              shadowColor: toastType === 'error' ? '#EF4444' : '#10B981',
              top: insets.top + vs(8),
            }
          ]}
        >
          <View style={styles.toastIcon}>
            <Ionicons
              name={toastType === 'success' ? "checkmark" : "close"}
              size={ms(20)}
              color="#FFF"
            />
          </View>
          <Text style={styles.toastText} numberOfLines={1} adjustsFontSizeToFit>{toastMsg}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  backBtn: {
    width: 25,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  section: {
    marginBottom: 23,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#1A1A1A',
    marginBottom: 0,
    lineHeight: 26,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  faqIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  faqInfo: {
    flex: 1,
  },
  faqText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '400',
    marginBottom: 2,
  },
  faqSub: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '400',
  },
  sectionSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '400',
    textAlign: 'justify',
  },
  formContainer: {
    marginTop: 20,
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#334155',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  sendBtn: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  // Ultra Simple History Styles
  historySection: {
    paddingVertical: 10,
    paddingHorizontal: 0,
    marginTop: -10,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#1E293B',
    marginBottom: 25,
  },
  ultraSimpleCard: {
    backgroundColor: '#fff',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 15,
  },
  historyItemGroup: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  userMsgText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
    fontWeight: '400',
    paddingLeft: 16,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  inlineDeleteBtn: {
    paddingLeft: 10,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  deletePlaceholder: {
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomDeleteBtn: {
    padding: 2,
  },
  systemReplyBox: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 16,
    marginTop: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  systemReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  systemReplyTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#EF4444',
    textTransform: 'uppercase',
  },
  systemReplyText: {
    fontSize: 15,
    color: '#0C4A6E',
    lineHeight: 22,
    fontWeight: '400',
  },
  historyDateText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
  },
  toastContainer: {
    position: 'absolute',
    left: s(16),
    right: s(16),
    height: vs(46),
    borderRadius: ms(10),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(14),
    zIndex: 9999,
    elevation: 10,
  },
  toastIcon: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: { color: '#FFF', fontSize: ms(13), fontWeight: '400', marginLeft: s(10), flex: 1 },
});

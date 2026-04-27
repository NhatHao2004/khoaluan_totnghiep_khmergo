import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FeedbackType = 'suggestion' | 'bug';

export default function SupportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  // Send Feedback States
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSendFeedback = async () => {
    if (!user) {
      Alert.alert(t('login_required'), t('login_to_send'), [
        { text: t('back'), style: 'cancel' },
        { text: t('login'), onPress: () => router.push('/login') }
      ]);
      return;
    }

    if (!title.trim() || !content.trim()) {
      Alert.alert(t('error'), t('pass_fields_required'));
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        type: feedbackType,
        title: title.trim(),
        content: content.trim(),
        userId: user.uid,
        userEmail: user.email,
        userName: user.name || 'User',
        createdAt: serverTimestamp(),
        status: 'pending',
      });

      Alert.alert(t('confirm'), t('feedback_success'), [
        { text: t('close'), onPress: () => router.push('/(tabs)/profile') }
      ]);

      setTitle('');
      setContent('');
    } catch (error: any) {
      console.error('Feedback Error:', error);
      Alert.alert(t('error'), t('feedback_failed'));
    } finally {
      setLoading(false);
    }
  };


  const btnColor = feedbackType === 'suggestion' ? '#00CFA3' : '#FF4D4D';

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={25} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('support_feedback')}</Text>
        <View style={{ width: 25 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : 0}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* FAQ Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('faq')}</Text>
            <TouchableOpacity style={styles.faqItem} onPress={() => router.push('/faq/use' as any)}>


              <Text style={styles.faqText}>{t('faq_how_to_use')}</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.faqItem} onPress={() => router.push('/faq/quiz' as any)}>


              <Text style={styles.faqText}>{t('faq_how_to_quiz')}</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.faqItem} onPress={() => router.push('/faq/learn' as any)}>


              <Text style={styles.faqText}>{t('faq_how_to_learn')}</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          </View>

          {/* Feedback Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('feedback_section')}</Text>

            <View style={styles.typeRow}>
              {(['suggestion', 'bug'] as FeedbackType[]).map((type) => {
                const activeColor = type === 'suggestion' ? '#00CFA3' : '#FF4D4D';
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setFeedbackType(type)}
                    style={[
                      styles.typeBtn,
                      feedbackType === type && { backgroundColor: activeColor, borderColor: activeColor }
                    ]}
                  >
                    <Text style={[
                      styles.typeBtnText,
                      feedbackType === type && styles.typeBtnTextActive
                    ]}>
                      {type === 'suggestion' ? t('suggestion') : t('report_issue')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('subject')}</Text>
              <TextInput
                style={[styles.textInput, !user && { backgroundColor: '#F0F0F0', color: '#999' }]}
                value={title}
                onChangeText={setTitle}
                editable={!!user}
                placeholder={t('subject_placeholder')}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('detail')}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, !user && { backgroundColor: '#F0F0F0', color: '#999' }]}
                value={content}
                onChangeText={setContent}
                editable={!!user}
                placeholder={t('feedback_placeholder')}
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: btnColor }
              ]}
              onPress={handleSendFeedback}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>{user ? t('send_feedback') : t('login_to_send')}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: 45,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  backBtn: {
    width: 25,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 34,
    paddingVertical: 2,
  },
  scroll: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  section: {
    marginBottom: 23,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 26,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 55, // Use minHeight for stability with padding
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  faqText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    lineHeight: 22,
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  typeBtnActive: {
    backgroundColor: '#00CFA3',
    borderColor: '#00CFA3',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  typeBtnTextActive: {
    color: '#FFF',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    marginTop: 10,
    backgroundColor: '#00CFA3',
    paddingVertical: 12,
    minHeight: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },

  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 15,
  },
  contactLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  contactBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#333',
  },
  contactBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

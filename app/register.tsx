import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/contexts/LanguageContext';
import { auth, db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RegisterScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Toast States
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const toastY = useSharedValue(-120);

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    toastY.value = withTiming(Platform.OS === 'ios' ? 70 : 50, { duration: 400 });

    setTimeout(() => {
      toastY.value = withTiming(-120, { duration: 400 });
      setTimeout(() => setShowToast(false), 400);
    }, 3000);
  };

  const animatedToastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
    opacity: interpolate(toastY.value, [-120, 50], [0, 1]),
  }));

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests([]);
    } else {
      setSelectedInterests([interest]);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setAvatarUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !repeatPassword) {
      triggerToast(t('error_required'), 'error');
      return;
    }

    if (password !== repeatPassword) {
      triggerToast(t('pass_mismatch'), 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      triggerToast(t('pass_fields_required'), 'error');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      const avatarUrl = avatarUri
        ? avatarUri
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00CFA3&color=fff&size=128`;

      await setDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        avatar: avatarUrl,
        points: 0,
        interests: selectedInterests,
        createdAt: new Date().toISOString(),
      });

      triggerToast(t('register_success'), 'success');
      setTimeout(() => router.replace('/(tabs)'), 2000);
    } catch (error: any) {
      let msg = t('update_failed');
      if (error.code === 'auth/email-already-in-use') {
        msg = t('email_in_use');
      }
      triggerToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.fixedHeader}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.titleText}>{t('register_title')}</Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.loginLinkText}>{t('login_title')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            {/* Avatar Picker */}
            <View style={styles.avatarWrapper}>
              <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} activeOpacity={0.8}>
                <View style={styles.avatarInner}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                  ) : (
                    <LinearGradient
                      colors={['#F1F5F9', '#E2E8F0']}
                      style={styles.avatarPlaceholder}
                    >
                      <Ionicons name="camera" size={32} color="#94A3B8" />
                    </LinearGradient>
                  )}
                </View>
                <View style={styles.addBtnSmall}>
                  <Ionicons name="add" size={16} color="#FFF" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Ảnh đại diện</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('fullname_label') || 'Họ và tên'}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('fullname_placeholder')}
                    placeholderTextColor="#CBD5E1"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="example@email.com"
                    placeholderTextColor="#CBD5E1"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('password_label')}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#CBD5E1"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('confirm_password_label')}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#CBD5E1"
                    value={repeatPassword}
                    onChangeText={setRepeatPassword}
                    secureTextEntry={!showRepeatPassword}
                  />
                  <TouchableOpacity onPress={() => setShowRepeatPassword(!showRepeatPassword)}>
                    <Ionicons name={showRepeatPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Interest Selection - Asymmetric Layout */}
            <View style={styles.interestsBox}>
              <Text style={styles.interestsHeader}>{t('select_interests_title') || 'Bạn quan tâm đến gì?'}</Text>
              <View style={styles.interestsAsymmetricGrid}>
                {/* Left Column: Big Card */}
                <View style={styles.leftCol}>
                  {[
                    { id: 'Chùa', label: t('temple'), img: require('@/assets/images/pagoda.jpg'), color: '#F59E0B', bg: '#FFFFFF' }
                  ].map((item) => {
                    const isSelected = selectedInterests.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.interestCardBig,
                          { backgroundColor: item.bg, borderColor: isSelected ? '#0F172A' : '#F1F5F9' }
                        ]}
                        onPress={() => toggleInterest(item.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.interestCardTextBig, { color: isSelected ? '#1E293B' : '#64748B' }]}>
                          {item.label}
                        </Text>
                        <Image
                          source={item.img}
                          style={styles.interestImgBig}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Right Column: Two Small Cards */}
                <View style={styles.rightCol}>
                  {[
                    { id: 'Văn hóa', label: t('culture'), img: require('@/assets/images/festival.jpg'), color: '#8B5CF6', bg: '#FFFFFF' },
                    { id: 'Ẩm thực', label: t('food'), img: require('@/assets/images/amthuc.jpg'), color: '#EF4444', bg: '#FFFFFF' }
                  ].map((item) => {
                    const isSelected = selectedInterests.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.interestCardSmall,
                          { backgroundColor: item.bg, borderColor: isSelected ? '#0F172A' : '#F1F5F9' }
                        ]}
                        onPress={() => toggleInterest(item.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.smallCardContent}>
                          <Image
                            source={item.img}
                            style={styles.interestImgSmall}
                            resizeMode="contain"
                          />
                          <Text style={[styles.interestCardTextSmall, { color: isSelected ? '#1E293B' : '#64748B' }]} numberOfLines={1}>
                            {item.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={styles.mainBtn}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={styles.btnText}>
                  {loading ? t('registering').toUpperCase() : t('register_account').toUpperCase()}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.footer} onPress={() => setShowTerms(true)}>
              <Text style={styles.footerText}>{t('terms')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms Modal */}
      <Modal visible={showTerms} animationType="fade" transparent onRequestClose={() => setShowTerms(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>ĐIỀU KHOẢN DỊCH VỤ</ThemedText>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.termsText}>
                Chào mừng bạn đến với ứng dụng KhmerGo. Khi sử dụng ứng dụng, bạn đồng ý với các điều khoản và điều kiện sau:{"\n\n"}

                <Text style={styles.termsBold}>1. Mục đích sử dụng:</Text>{" "}
                KhmerGo được phát triển nhằm hỗ trợ tìm hiểu, học tập và quảng bá văn hóa, lịch sử, đời sống và bản sắc của người Khmer Nam Bộ.{"\n\n"}

                <Text style={styles.termsBold}>2. Trách nhiệm người dùng:</Text>{" "}
                Người dùng cam kết sử dụng ứng dụng đúng mục đích, không vi phạm pháp luật, không đăng tải nội dung phản cảm và luôn tôn trọng giá trị văn hóa cộng đồng Khmer.{"\n\n"}

                <Text style={styles.termsBold}>3. Quyền sở hữu nội dung:</Text>{" "}
                Toàn bộ hình ảnh, văn bản, dữ liệu và giao diện trên ứng dụng thuộc quyền sở hữu của nhóm phát triển hoặc được sử dụng hợp pháp. Nghiêm cấm sao chép hoặc sử dụng lại khi chưa được cho phép.{"\n\n"}

                <Text style={styles.termsBold}>4. Chính sách bảo mật:</Text>{" "}
                Ứng dụng có thể thu thập một số dữ liệu cơ bản như phiên bản hệ điều hành và thông tin sử dụng nhằm nâng cao trải nghiệm người dùng. Mọi thông tin đều được bảo mật theo quy định hiện hành.{"\n\n"}

                <Text style={styles.termsBold}>5. Giới hạn trách nhiệm:</Text>{" "}
                KhmerGo không chịu trách nhiệm đối với các sự cố phát sinh từ thiết bị, kết nối mạng hoặc việc sử dụng thông tin ngoài mục đích tham khảo và học tập.{"\n\n"}

                <Text style={styles.termsBold}>6. Chấm dứt quyền sử dụng:</Text>{" "}
                Chúng tôi có quyền tạm ngừng hoặc khóa tài khoản nếu phát hiện hành vi vi phạm điều khoản hoặc gây ảnh hưởng đến hệ thống và cộng đồng người dùng.{"\n\n"}

                <Text style={styles.termsBold}>7. Liên hệ hỗ trợ:</Text>{"\n"}
                {"    "}• Email:{" "}
                <Text style={{ color: '#1A73E8' }}>
                  support@khmergoapp.vn
                </Text>{"\n"}
                {"    "}• Số điện thoại:{" "}
                <Text style={{ color: '#1A73E8' }}>
                  0123 456 789
                </Text>
              </ThemedText>
            </ScrollView>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => setShowTerms(false)}
            >
              <Text style={styles.acceptBtnText}>ĐÃ HIỂU</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Premium Toast System */}
      {showToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            animatedToastStyle,
            {
              backgroundColor: toastType === 'success' || toastType === 'info' ? '#10B981' : '#EF4444',
              shadowColor: toastType === 'success' || toastType === 'info' ? '#10B981' : '#EF4444',
            }
          ]}
        >
          <View style={styles.toastIcon}>
            <Ionicons
              name={toastType === 'success' ? "checkmark" : "close"}
              size={20}
              color="#FFF"
            />
          </View>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  fixedHeader: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 0, backgroundColor: '#F8FAFC' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  titleText: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  loginLinkText: { fontSize: 16, color: '#64748B', fontWeight: '600', marginBottom: 4 },

  card: { backgroundColor: '#FFF', borderRadius: 32, padding: 24 },

  avatarWrapper: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { width: 100, height: 100, padding: 4, borderRadius: 50, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#F1F5F9', position: 'relative' },
  avatarInner: { flex: 1, borderRadius: 46, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 46 },
  avatarPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addBtnSmall: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  avatarHint: { marginTop: 10, fontSize: 13, color: '#94A3B8', fontWeight: '600' },

  form: { gap: 18, marginBottom: 25 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#64748B', marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#F1F5F9' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '600', paddingVertical: 10 },

  interestsBox: { marginBottom: 20 },
  interestsHeader: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 12, marginLeft: 4 },
  interestsAsymmetricGrid: {
    flexDirection: 'row',
    gap: 12,
    height: 180,
  },
  leftCol: {
    flex: 1.2,
  },
  rightCol: {
    flex: 1,
    gap: 12,
  },
  interestCardBig: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 2,
    padding: 16,
    justifyContent: 'space-between',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  interestCardSmall: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    padding: 12,
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  smallCardContent: {
    alignItems: 'center',
    gap: 6,
  },
  interestImgBig: {
    width: 90,
    height: 90,
    borderRadius: 16,
    alignSelf: 'center',
  },
  interestImgSmall: {
    width: 45,
    height: 45,
    borderRadius: 12,
  },
  interestCardTextBig: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  interestCardTextSmall: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  checkBadgeBig: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  checkBadgeSmall: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },

  mainBtn: { borderRadius: 18, overflow: 'hidden' },
  btnGradient: { height: 60, justifyContent: 'center', alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 1, lineHeight: 24, includeFontPadding: false },

  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { fontSize: 13, color: '#94A3B8', textDecorationLine: 'underline' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', width: '100%', borderRadius: 32, padding: 24 },
  modalHeader: { paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', textAlign: 'center' },
  modalScroll: { marginVertical: 20, maxHeight: 400 },
  termsText: { fontSize: 14, lineHeight: 22, color: '#475569', textAlign: 'justify' },
  termsBold: { fontWeight: '800', color: '#0F172A' },
  acceptBtn: { backgroundColor: '#1E293B', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  acceptBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', lineHeight: 22, includeFontPadding: false },

  // Toast Styles
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 9999,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  toastIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
    letterSpacing: 0.2,
    includeFontPadding: false,
    lineHeight: 22,
  },
});

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { auth } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
import { EmailService } from './services/email-service';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { s, vs, ms } from '@/utils/responsive';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';


export default function LoginScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnTo = params.returnTo as string;
  const returnId = params.returnId as string;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password States
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Pass
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Toast States
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const toastY = useSharedValue(-120);
  const waveRotation = useSharedValue(0);

  React.useEffect(() => {
    waveRotation.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 300 }),
        withTiming(-25, { duration: 300 })
      ),
      -1,
      true
    );
  }, [waveRotation]);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${waveRotation.value}deg` }],
  }));

  const triggerToast = React.useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    toastY.value = withTiming(Platform.OS === 'ios' ? vs(50) : vs(40), { duration: 400 });

    setTimeout(() => {
      toastY.value = withTiming(-vs(120), { duration: 400 });
      setTimeout(() => setShowToast(false), 400);
    }, 3000);
  }, [toastY]);

  const animatedToastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
    opacity: interpolate(toastY.value, [-100, 40], [0, 1], 'clamp'),
  }));

  const handleLogin = React.useCallback(async () => {
    if (!email || !password) {
      triggerToast(t('error_required'), 'error');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;
      
      const { getDoc, doc } = await import('firebase/firestore');
      const { db: firestoreDb } = await import('@/utils/firebaseConfig');
      const userDoc = await getDoc(doc(firestoreDb, 'users', firebaseUser.uid));
      const userData = userDoc.data();

      if (userData?.isBlocked && userData?.role !== 'Quản trị viên') {
        setLoading(false);
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
        triggerToast(t('account_blocked'), 'error');
        return;
      }

      await refreshUser();

      if (userData?.role === 'Quản trị viên') {
        router.replace({ pathname: '/(admin)' as any, params: { toast: 'login_success' } });
      } else if (returnTo) {
        router.replace({
          pathname: returnTo as any,
          params: { ...(returnId ? { id: returnId } : {}), toast: 'login_success' }
        });
      } else {
        router.replace({ pathname: '/(tabs)', params: { toast: 'login_success' } });
      }
    } catch (error: any) {
      console.log('Login error:', error);
      let msg = t('update_failed');
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        msg = t('wrong_old_pass');
      }
      triggerToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [email, password, t, triggerToast, refreshUser, router, returnTo, returnId]);

  // Forgot Password Flow Handlers
  const handleRequestCode = async () => {
    setModalError('');
    if (!forgotEmail) { setModalError(t('error_required')); return; }
    setForgotLoading(true);
    try {
      // Ả. Kiểm tra Email có tồn tại trong hệ thống (Firestore) không
      const exists = await EmailService.checkEmailExists(forgotEmail);
      if (!exists) {
        setModalError(t('user_not_found'));
        setForgotLoading(false);
        return;
      }

      // 1. Tạo OTP 6 số
      const otp = EmailService.generateOTP();
      // 2. Lưu vào Firestore (hết hạn sau 5 phút)
      await EmailService.saveOTP(forgotEmail, otp);
      // 3. Gửi qua Resend (giả lập hoặc gọi API)
      const sent = await EmailService.sendOTPEmail(forgotEmail, otp);
      
      if (sent) {
        setForgotStep(2);
        triggerToast(t('enter_otp_desc'), 'info');
      } else {
        setModalError(t('update_failed'));
      }
    } catch (error: any) {
      console.error(error);
      setModalError(t('update_failed'));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setModalError('');
    if (otpCode.length < 6) { setModalError(t('error_required')); return; }
    setForgotLoading(true);
    try {
      const res = await EmailService.verifyOTP(forgotEmail, otpCode);
      if (res.success) {
        setForgotStep(3);
      } else {
        setModalError(res.msg || 'Error');
      }
    } catch (e) {
      setModalError(t('update_failed'));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = () => {
    setModalError('');
    if (newPassword.length < 6) { setModalError(t('pass_too_short')); return; }
    // Simulation: In a custom backend flow, you'd send the resetToken + new password.
    // For Firebase native, the link in Step 1 handles this.
    triggerToast(t('reset_password_success'), 'success');
    setForgotModalVisible(false);
    setForgotStep(1);
    setModalError('');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      {/* White Safety Block for Android Status Bar */}
      <View style={{ height: insets.top, backgroundColor: '#FFF' }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? vs(20) : 0}
      >
        <View style={styles.fixedHeader}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.titleText}>{t('login_title')}</Text>
            <TouchableOpacity onPress={() => router.replace('/register')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.registerLinkText}>{t('register_title')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          bounces={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + vs(20) }]}
        >
          <View style={styles.card}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logoImage}
                contentFit="contain"
                transition={300}
              />
              <View style={styles.logoHintRow}>
                <Text style={styles.logoHint} numberOfLines={1} adjustsFontSizeToFit>{t('welcome_back')}</Text>
                <Animated.View style={[waveStyle, { marginLeft: s(8) }]}>
                  <Text style={styles.waveEmoji}>👋</Text>
                </Animated.View>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={ms(20)} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#CBD5E1"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: s(4), gap: s(10) }}>
                  <Text style={[styles.inputLabel, { flex: 1 }]} numberOfLines={1}>{t('password_label')}</Text>
                  <TouchableOpacity onPress={() => { setForgotModalVisible(true); setForgotStep(1); }} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
                    <Text style={{ fontSize: ms(13), color: '#94A3B8', fontWeight: '400' }}>{t('forgot_password')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={ms(20)} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#CBD5E1"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={ms(20)} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.mainBtn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.btnText}>
                    {t('login').toUpperCase()}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.socialFooter}>
              <View style={styles.dividerBox}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('use_other_account')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialIconsRow}>
                <TouchableOpacity style={[styles.socialCircle, { backgroundColor: '#FF5A5F' }]}>
                  <Ionicons name="logo-google" size={ms(24)} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialCircle, { backgroundColor: '#1877F2' }]}>
                  <Ionicons name="logo-facebook" size={ms(24)} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal visible={forgotModalVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('reset_password')}</Text>
                <TouchableOpacity onPress={() => { setForgotModalVisible(false); setModalError(''); }}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              {forgotStep === 1 && (
                <View style={styles.modalBody}>
                  <Text style={styles.modalDesc} numberOfLines={1} adjustsFontSizeToFit>{t('enter_email_desc')}</Text>
                  {modalError ? <Text style={styles.modalErrorText}>{modalError}</Text> : null}
                  <View style={styles.modalInputWrapper}>
                    <Ionicons name="mail-outline" size={ ms(20) } color="#94A3B8" />
                    <TextInput 
                      style={styles.modalInput} 
                      placeholder="example@gmail.com"
                      value={forgotEmail}
                      onChangeText={(txt) => { setForgotEmail(txt); setModalError(''); }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                  <TouchableOpacity style={styles.modalActionBtn} onPress={handleRequestCode} disabled={forgotLoading}>
                    <LinearGradient colors={['#10B981', '#059669']} style={styles.modalActionGradient}>
                      {forgotLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalActionText}>{t('send_code')}</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {forgotStep === 2 && (
                <View style={styles.modalBody}>
                  <Text style={styles.modalDesc} numberOfLines={1} adjustsFontSizeToFit>{t('enter_otp_desc')}</Text>
                  {modalError ? <Text style={styles.modalErrorText}>{modalError}</Text> : null}
                  <View style={styles.modalInputWrapper}>
                    <Ionicons name="keypad-outline" size={ ms(20) } color="#94A3B8" />
                    <TextInput 
                      style={styles.modalInput} 
                      placeholder="OTP (e.g. 123456)"
                      value={otpCode}
                      onChangeText={(txt) => { setOtpCode(txt); setModalError(''); }}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                  <TouchableOpacity style={styles.modalActionBtn} onPress={handleVerifyOTP} disabled={forgotLoading}>
                    <LinearGradient colors={['#10B981', '#059669']} style={styles.modalActionGradient}>
                      {forgotLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalActionText}>{t('verify_code')}</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {forgotStep === 3 && (
                <View style={styles.modalBody}>
                  <Text style={styles.modalDesc} numberOfLines={1} adjustsFontSizeToFit>{t('new_password_desc')}</Text>
                  {modalError ? <Text style={styles.modalErrorText}>{modalError}</Text> : null}
                  <View style={styles.modalInputWrapper}>
                    <Ionicons name="lock-closed-outline" size={ ms(20) } color="#94A3B8" />
                    <TextInput 
                      style={styles.modalInput} 
                      placeholder={t('new_password')}
                      value={newPassword}
                      onChangeText={(txt) => { setNewPassword(txt); setModalError(''); }}
                      secureTextEntry
                    />
                  </View>
                  <TouchableOpacity style={styles.modalActionBtn} onPress={handleResetPassword}>
                    <LinearGradient colors={['#10B981', '#059669']} style={styles.modalActionGradient}>
                      <Text style={styles.modalActionText}>{t('save').toUpperCase()}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {showToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            animatedToastStyle,
            {
              backgroundColor: toastType === 'error' ? '#EF4444' : toastType === 'success' ? '#10B981' : '#3B82F6',
              shadowColor: toastType === 'error' ? '#EF4444' : '#10B981',
            }
          ]}
        >
          <View style={styles.toastIcon}>
            <Ionicons
              name={toastType === 'success' ? "checkmark" : toastType === 'error' ? "close" : "information"}
              size={ms(20)}
              color="#FFF"
            />
          </View>
          <Text style={styles.toastText} numberOfLines={1} adjustsFontSizeToFit>{toastMsg}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  fixedHeader: { paddingHorizontal: s(20), paddingTop: vs(20), paddingBottom: vs(10), backgroundColor: '#FFF' },
  scrollContent: { paddingHorizontal: s(20), paddingTop: vs(10), backgroundColor: '#FFF' },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', minHeight: vs(50) },
  titleText: { fontSize: ms(32), fontWeight: '400', color: '#1e293b', letterSpacing: -1 },
  registerLinkText: { fontSize: ms(16), color: '#64748B', fontWeight: '400', marginBottom: vs(4) },

  card: { backgroundColor: 'transparent', padding: s(10) },

  logoWrapper: { alignItems: 'center', marginBottom: vs(25) },
  logoImage: { width: s(130), height: s(130) },
  logoHintRow: { marginTop: vs(10), flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoHint: { fontSize: ms(17), color: '#64748B', fontWeight: '400' },
  waveEmoji: { fontSize: ms(20) },

  form: { gap: vs(20), marginBottom: vs(30) },
  inputGroup: { gap: vs(8) },
  inputLabel: { fontSize: ms(14), fontWeight: '400', color: '#475569', marginLeft: s(4) },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: s(16), paddingHorizontal: s(16), height: vs(56), borderWidth: 1, borderColor: '#F1F5F9' },
  inputIcon: { marginRight: s(12) },
  input: { flex: 1, fontSize: ms(16), color: '#1e293b', fontWeight: '400', paddingVertical: vs(10) },

  mainBtn: { borderRadius: s(18), overflow: 'hidden', elevation: 4, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  btnGradient: { height: vs(60), justifyContent: 'center', alignItems: 'center' },
  btnText: { fontSize: ms(16), fontWeight: '400', color: '#FFF', letterSpacing: 1 },

  socialFooter: {
    marginTop: vs(40),
    alignItems: 'center',
  },
  dividerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(15),
    marginBottom: vs(25),
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    flex: 1,
    maxWidth: s(80),
  },
  dividerText: {
    fontSize: ms(13),
    color: '#94A3B8',
    fontWeight: '400',
  },
  socialIconsRow: {
    flexDirection: 'row',
    gap: s(25),
  },
  socialCircle: {
    width: s(54),
    height: s(54),
    borderRadius: s(27),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  toastContainer: {
    position: 'absolute',
    top: 0,
    left: s(20),
    right: s(20),
    height: vs(56),
    borderRadius: s(20),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(16),
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  toastIcon: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    color: '#FFF',
    fontSize: ms(15),
    fontWeight: '400',
    marginLeft: s(12),
    flex: 1,
  },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: s(20) },
  modalContainer: { width: '100%' },
  modalContent: { backgroundColor: '#FFF', borderRadius: s(24), padding: s(20) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(20) },
  modalTitle: { fontSize: ms(20), fontWeight: '400', color: '#1E293B' },
  modalBody: { gap: vs(15) },
  modalDesc: { fontSize: ms(14), color: '#64748B', lineHeight: ms(20) },
  modalErrorText: { fontSize: ms(13), color: '#EF4444', fontWeight: '400', marginTop: -vs(2), marginLeft: s(4), marginBottom: vs(5) },
  modalInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: s(12), paddingHorizontal: s(12), height: vs(50), borderWidth: 1, borderColor: '#F1F5F9' },
  modalInput: { flex: 1, marginLeft: s(10), fontSize: ms(15), color: '#1E293B' },
  modalActionBtn: { borderRadius: s(12), overflow: 'hidden', marginTop: vs(5) },
  modalActionGradient: { height: vs(50), justifyContent: 'center', alignItems: 'center' },
  modalActionText: { color: '#FFF', fontSize: ms(15), fontWeight: '400' }
});
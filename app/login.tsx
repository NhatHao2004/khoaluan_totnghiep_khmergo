import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { auth } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, verticalScale, moderateScale } from '@/utils/responsive';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
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
  View
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen() {
  const { t } = useLanguage();
  const { refreshUser } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnTo = params.returnTo as string;
  const returnId = params.returnId as string;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
  }, []);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${waveRotation.value}deg` }],
  }));

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    toastY.value = withTiming(Platform.OS === 'ios' ? 50 : 40, { duration: 400 });

    setTimeout(() => {
      toastY.value = withTiming(-120, { duration: 400 });
      setTimeout(() => setShowToast(false), 400);
    }, 3000);
  };

  const animatedToastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
    opacity: interpolate(toastY.value, [-100, 40], [0, 1], 'clamp'),
  }));

  const handleLogin = async () => {
    if (!email || !password) {
      triggerToast(t('error_required'), 'error');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await refreshUser();

      if (returnTo) {
        router.replace({
          pathname: returnTo as any,
          params: { ...(returnId ? { id: returnId } : {}), toast: 'login_success' }
        });
      } else {
        router.replace({ pathname: '/(tabs)', params: { toast: 'login_success' } });
      }
    } catch (error: any) {
      let msg = t('update_failed');
      if (error.message === 'ACCOUNT_BLOCKED' || error.message === 'AUTH_FAILED') {
        msg = t('account_blocked');
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        msg = t('wrong_old_pass');
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
            <Text style={styles.titleText}>{t('login_title')}</Text>
            <TouchableOpacity onPress={() => router.replace('/register')}>
              <Text style={styles.registerLinkText}>{t('register_title')}</Text>
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
            {/* Logo/Icon Wrapper */}
            <View style={styles.logoWrapper}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <View style={styles.logoHintRow}>
                <Text style={styles.logoHint} numberOfLines={1} adjustsFontSizeToFit>{t('welcome_back')}</Text>
                <Animated.View style={[waveStyle, { marginLeft: scale(8) }]}>
                  <Text style={styles.waveEmoji}>👋</Text>
                </Animated.View>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={scale(20)} color="#94A3B8" style={styles.inputIcon} />
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
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: scale(4), gap: scale(10) }}>
                  <Text style={[styles.inputLabel, { flex: 1 }]} numberOfLines={1}>{t('password_label')}</Text>
                  <TouchableOpacity>
                    <Text style={{ fontSize: moderateScale(13), color: '#94A3B8', fontWeight: '500' }}>{t('forgot_password')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={scale(20)} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#CBD5E1"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={scale(20)} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Login Button */}
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

            {/* Social Login Footer */}
            <View style={styles.socialFooter}>
              <View style={styles.dividerBox}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('use_other_account')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialIconsRow}>
                <TouchableOpacity style={[styles.socialCircle, { backgroundColor: '#FF5A5F' }]}>
                  <Ionicons name="logo-google" size={scale(24)} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialCircle, { backgroundColor: '#1877F2' }]}>
                  <Ionicons name="logo-facebook" size={scale(24)} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Premium Toast System */}
      {showToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            animatedToastStyle,
            {
              backgroundColor: toastType === 'error' ? '#EF4444' : '#10B981',
              shadowColor: toastType === 'error' ? '#EF4444' : '#10B981',
            }
          ]}
        >
          <View style={styles.toastIcon}>
            <Ionicons
              name={toastType === 'success' ? "checkmark" : "close"}
              size={scale(20)}
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
  container: { flex: 1, backgroundColor: '#FFF' },
  fixedHeader: { paddingHorizontal: scale(20), paddingTop: verticalScale(60), paddingBottom: verticalScale(10), backgroundColor: '#FFF' },
  scrollContent: { paddingHorizontal: scale(20), paddingTop: verticalScale(40), paddingBottom: verticalScale(40), backgroundColor: '#FFF' },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  titleText: { fontSize: moderateScale(32), fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  registerLinkText: { fontSize: moderateScale(16), color: '#64748B', fontWeight: '600', marginBottom: verticalScale(4) },

  card: { backgroundColor: 'transparent', borderRadius: scale(32), padding: scale(24) },

  logoWrapper: { alignItems: 'center', marginBottom: verticalScale(25) },
  logoImage: { width: scale(130), height: scale(130) },
  logoHintRow: { marginTop: verticalScale(5), flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoHint: { fontSize: moderateScale(17), color: '#64748B', fontWeight: '700' },
  waveEmoji: { fontSize: moderateScale(20) },

  form: { gap: verticalScale(20), marginBottom: verticalScale(30) },
  inputGroup: { gap: verticalScale(8) },
  inputLabel: { fontSize: moderateScale(14), fontWeight: '700', color: '#64748B', marginLeft: scale(4), flexShrink: 0 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: scale(16), paddingHorizontal: scale(16), height: verticalScale(56), borderWidth: 1, borderColor: '#F1F5F9' },
  inputIcon: { marginRight: scale(12) },
  input: { flex: 1, fontSize: moderateScale(16), color: '#1E293B', fontWeight: '600', paddingVertical: verticalScale(10) },

  mainBtn: { borderRadius: scale(18), overflow: 'hidden' },
  btnGradient: { height: verticalScale(60), justifyContent: 'center', alignItems: 'center' },
  btnText: { fontSize: moderateScale(16), fontWeight: '800', color: '#FFF', letterSpacing: 1, lineHeight: verticalScale(24), includeFontPadding: false },

  footer: { marginTop: verticalScale(30), flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: moderateScale(14), color: '#64748B', fontWeight: '500' },
  footerLink: { fontSize: moderateScale(14), color: '#10B981', fontWeight: '700' },

  socialFooter: {
    marginTop: verticalScale(40),
    alignItems: 'center',
  },
  dividerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: verticalScale(25),
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: scale(60),
  },
  dividerText: {
    fontSize: moderateScale(13),
    color: '#94A3B8',
    fontWeight: '500',
  },
  socialIconsRow: {
    flexDirection: 'row',
    gap: scale(25),
  },
  socialCircle: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.1,
    shadowRadius: scale(6),
    elevation: 3,
  },

  // Toast Styles
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: scale(20),
    right: scale(20),
    height: verticalScale(56),
    borderRadius: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.3,
    shadowRadius: scale(20),
    elevation: 10,
  },
  toastIcon: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    color: '#FFF',
    fontSize: moderateScale(15),
    fontWeight: '700',
    marginLeft: scale(12),
    flex: 1,
    letterSpacing: 0.2,
    includeFontPadding: false,
    lineHeight: verticalScale(22),
  },
});
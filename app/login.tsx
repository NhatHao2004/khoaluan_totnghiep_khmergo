import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { auth } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { s, vs, ms } from '@/utils/responsive';
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
            <View style={styles.logoWrapper}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <View style={styles.logoHintRow}>
                <Text style={styles.logoHint} numberOfLines={1} adjustsFontSizeToFit>{t('welcome_back')}</Text>
                <Animated.View style={[waveStyle, { marginLeft: 8 }]}>
                  <Text style={styles.waveEmoji}>👋</Text>
                </Animated.View>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
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
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 4, gap: 10 }}>
                  <Text style={[styles.inputLabel, { flex: 1 }]} numberOfLines={1}>{t('password_label')}</Text>
                  <TouchableOpacity>
                    <Text style={{ fontSize: 13, color: '#94A3B8', fontWeight: '500' }}>{t('forgot_password')}</Text>
                  </TouchableOpacity>
                </View>
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
                  <Ionicons name="logo-google" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialCircle, { backgroundColor: '#1877F2' }]}>
                  <Ionicons name="logo-facebook" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  container: { flex: 1, backgroundColor: '#FFF' },
  fixedHeader: { paddingHorizontal: s(20), paddingTop: vs(60), paddingBottom: vs(10), backgroundColor: '#FFF' },
  scrollContent: { paddingHorizontal: s(20), paddingTop: vs(40), paddingBottom: vs(40), backgroundColor: '#FFF' },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  titleText: { fontSize: ms(32), fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  registerLinkText: { fontSize: ms(16), color: '#64748B', fontWeight: '600', marginBottom: vs(4) },

  card: { backgroundColor: 'transparent', borderRadius: ms(32), padding: s(24) },

  logoWrapper: { alignItems: 'center', marginBottom: vs(25) },
  logoImage: { width: s(130), height: vs(130) },
  logoHintRow: { marginTop: vs(5), flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoHint: { fontSize: ms(17), color: '#64748B', fontWeight: '700' },
  waveEmoji: { fontSize: ms(20) },

  form: { gap: vs(20), marginBottom: vs(30) },
  inputGroup: { gap: vs(8) },
  inputLabel: { fontSize: ms(14), fontWeight: '700', color: '#64748B', marginLeft: s(4), flexShrink: 0 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: ms(16), paddingHorizontal: s(16), height: vs(56), borderWidth: 1, borderColor: '#F1F5F9' },
  inputIcon: { marginRight: s(12) },
  input: { flex: 1, fontSize: ms(16), color: '#1E293B', fontWeight: '600', paddingVertical: vs(10) },

  mainBtn: { borderRadius: ms(18), overflow: 'hidden' },
  btnGradient: { height: vs(60), justifyContent: 'center', alignItems: 'center' },
  btnText: { fontSize: ms(16), fontWeight: '800', color: '#FFF', letterSpacing: 1, lineHeight: ms(24), includeFontPadding: false },

  socialFooter: {
    marginTop: vs(40),
    alignItems: 'center',
  },
  dividerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginBottom: vs(25),
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: s(60),
  },
  dividerText: {
    fontSize: ms(13),
    color: '#94A3B8',
    fontWeight: '500',
  },
  socialIconsRow: {
    flexDirection: 'row',
    gap: s(25),
  },
  socialCircle: {
    width: s(50),
    height: s(50),
    borderRadius: s(25),
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
    borderRadius: ms(20),
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
    fontWeight: '700',
    marginLeft: s(12),
    flex: 1,
    letterSpacing: 0.2,
    includeFontPadding: false,
    lineHeight: ms(22),
  },
});
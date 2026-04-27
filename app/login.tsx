import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập Email và Mật khẩu');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Load dữ liệu người dùng lập tức từ Firestore trước khi chuyển trang
      await refreshUser();
      router.replace('/(tabs)');
    } catch (error: any) {
      let msg = 'Đăng nhập thất bại. Vui lòng thử lại!';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        msg = 'Email hoặc mật khẩu không chính xác.';
      }
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.innerContent}>
          {/* Top Navigation */}
          <View style={styles.topNav}>
            <Text style={styles.navActive}>Đăng nhập</Text>
            <TouchableOpacity onPress={() => router.replace('/register')}>
              <Text style={styles.navInactive}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Avatar Icon */}
          <View style={styles.avatarWrapper}>
            <ImagePlaceholder />
          </View>

          {/* Inputs */}
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#C1C1C1"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mật khẩu"
                placeholderTextColor="#C1C1C1"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#C1C1C1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.loginButtonText}>Đang xử lý...</Text>
            ) : (
              <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
            )}
          </TouchableOpacity>
        </View>
        {/* Social Login - Bottom Gray Section */}
        <View style={styles.bottomSection}>
          <Text style={styles.socialText}>Đăng nhập bằng</Text>
          <View style={styles.socialRow}>
            <View style={[styles.socialIcon, { backgroundColor: '#EA4335' }]}>
              <Ionicons name="logo-google" size={18} color="#FFF" />
            </View>
            <View style={[styles.socialIcon, { backgroundColor: '#3B5998' }]}>
              <Ionicons name="logo-facebook" size={18} color="#FFF" />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ImagePlaceholder = () => (
  <View style={styles.avatarContainer}>
    <View style={styles.avatarInner}>
      <Ionicons name="person" size={50} color="#D1D1D1" style={{ marginTop: 10 }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Toàn màn hình trắng
  },
  scrollContent: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  innerContent: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 40,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 50,
  },
  navActive: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    lineHeight: 48,
  },
  navInactive: {
    fontSize: 18,
    fontWeight: '500',
    color: '#B0B0B0',
    marginTop: 6,
    lineHeight: 32,
  },

  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  formContainer: {
    width: '100%',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    paddingVertical: 18,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    lineHeight: 22,
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },

  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00CFA3',
    width: '100%',
    paddingVertical: 12,
    minHeight: 56,
    borderRadius: 30,
    shadowColor: '#00CFA3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 50,
    flexShrink: 0,
  },

  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    lineHeight: 28,
  },

  bottomSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 35,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100, // Khoảng cách cố định, không nhảy theo bàn phím
  },
  socialText: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 15,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 15,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

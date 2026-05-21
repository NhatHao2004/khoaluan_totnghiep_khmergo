import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { auth } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('error_fill_fields') || 'Vui lòng nhập Email và Mật khẩu');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Load dữ liệu người dùng lập tức từ Firestore trước khi chuyển trang
      await refreshUser();
      
      if (returnTo) {
        router.replace({
          pathname: returnTo as any,
          params: returnId ? { id: returnId } : {}
        });
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      let msg = t('update_failed');
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        msg = t('wrong_old_pass'); // Reusing some keys or just fallback
      }
      Alert.alert(t('error'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.innerContent}>
          {/* Top Navigation */}
          <View style={styles.topNav}>
            <Text style={styles.navActive}>{t('login_title')}</Text>
            <TouchableOpacity onPress={() => router.replace('/register')}>
              <Text style={styles.navInactive}>{t('register_title')}</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Avatar Icon */}
          <View style={styles.avatarWrapper}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Inputs */}
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('email_label')}
              placeholderTextColor="#C1C1C1"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('password_label')}
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
            <Text style={styles.loginButtonText}>
              {loading ? t('processing').toUpperCase() : t('login').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



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
    paddingHorizontal: 30,
    paddingTop: 80,
    paddingBottom: 40,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 50,
    gap: 10,
  },
  navActive: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
    flexShrink: 1,
    lineHeight: 34,
    paddingRight: 5,
  },
  navInactive: {
    fontSize: 18,
    fontWeight: '500',
    color: '#B0B0B0',
    flexShrink: 1,
    lineHeight: 24,
    paddingRight: 5,
  },

  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  formContainer: {
    width: '100%',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    lineHeight: 22,
    paddingRight: 5,
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
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    paddingRight: 5,
  },

  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00CFA3',
    width: '100%',
    paddingVertical: 14,
    minHeight: 60,
    borderRadius: 30,
    shadowColor: '#00CFA3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 50,
  },

  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 24,
    paddingRight: 5,
  },

});

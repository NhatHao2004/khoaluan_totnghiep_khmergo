import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/contexts/LanguageContext';
import { auth, db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3, // Giảm chất lượng để base64 nhẹ hơn
      base64: true, // Lấy luôn base64
    });

    if (!result.canceled && result.assets[0].base64) {
      // Lưu cả uri để hiển thị và base64 để upload
      setAvatarUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !repeatPassword) {
      Alert.alert(t('error'), t('error_required'));
      return;
    }

    if (password !== repeatPassword) {
      Alert.alert(t('error'), t('pass_mismatch'));
      return;
    }

    // Validate định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t('error'), t('pass_fields_required')); // Fallback
      return;
    }

    setLoading(true);
    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Xác định URL ảnh đại diện
      const avatarUrl = avatarUri
        ? avatarUri
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00CFA3&color=fff&size=128`;

      // 3. Lưu thông tin vào Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        avatar: avatarUrl,
        points: 0,
        createdAt: new Date().toISOString(),
      });

      // 4. Đăng ký thành công - vào app luôn
      Alert.alert(t('completed'), t('register_success'), [
        { text: t('back'), onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      let msg = t('update_failed');
      if (error.code === 'auth/email-already-in-use') {
        msg = t('email_in_use');
      }
      Alert.alert(t('error'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.innerContent}>
          {/* Top Navigation */}
          <View style={styles.topNav}>
            <Text style={styles.navActive} numberOfLines={1}>{t('register_title')}</Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.navInactive} numberOfLines={1}>{t('login_title')}</Text>
            </TouchableOpacity>
          </View>

          {/* Camera Avatar Placeholder */}
          <View style={styles.avatarWrapper}>
            <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
              <View style={styles.avatarInner}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: 90, height: 90, borderRadius: 45 }} />
                ) : (
                  <Ionicons name="camera" size={35} color="#D1D1D1" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Inputs */}
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('fullname_placeholder')}
              placeholderTextColor="#C1C1C1"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

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

            <View style={[styles.passwordContainer, { marginTop: 20 }]}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('confirm_password_label')}
                placeholderTextColor="#C1C1C1"
                value={repeatPassword}
                onChangeText={setRepeatPassword}
                secureTextEntry={!showRepeatPassword}
              />
              <TouchableOpacity onPress={() => setShowRepeatPassword(!showRepeatPassword)}>
                <Ionicons name={showRepeatPassword ? "eye" : "eye-off"} size={20} color="#C1C1C1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? t('registering').toUpperCase() : t('register_title').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Section - Bottom Gray */}
        {/* Footer Section - Bottom Gray */}
        <View style={styles.bottomSection}>
          <TouchableOpacity onPress={() => setShowTerms(true)}>
            <ThemedText style={styles.footerText}>{t('terms')}</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Terms of Service Modal */}
        <Modal
          visible={showTerms}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTerms(false)}
        >
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  innerContent: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30, // Reduced for more space
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
    lineHeight: 36, // Reduced 
  },
  navInactive: {
    fontSize: 18,
    fontWeight: '500',
    color: '#B0B0B0',
    lineHeight: 28, // Reduced
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
    lineHeight: 26,
  },

  bottomSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 35,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 12,
    color: '#A0A0A0',
    textDecorationLine: 'underline',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxHeight: '80%',
    borderRadius: 24,
    padding: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  closeBtn: {
    padding: 5,
  },
  modalScroll: {
    marginBottom: 15,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    textAlign: 'justify',
  },
  termsBold: {
    fontWeight: '800',
    color: '#0F172A',
    fontSize: 15,
  },
  acceptBtn: {
    backgroundColor: '#00CFA3',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#00CFA3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    lineHeight: 22,
    includeFontPadding: false,
  },
});

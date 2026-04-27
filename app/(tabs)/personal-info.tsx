import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { auth, db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

export default function PersonalInfoScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar || null);

  // Change password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setAvatarUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  // ─── Unified Save ─────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('name_required'));
      return;
    }

    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error(t('not_logged_in'));

      // 1. Update Profile (Name/Avatar)
      await updateDoc(doc(db, 'users', uid), {
        name: name.trim(),
        avatar: avatarUri || user?.avatar || '',
      });

      // 2. Optional Password Update
      const isTryingToChangePass = oldPassword || newPassword || confirmPassword;
      if (isTryingToChangePass) {
        if (!oldPassword || !newPassword || !confirmPassword) {
          throw new Error(t('pass_fields_required'));
        }
        if (newPassword !== confirmPassword) {
          throw new Error(t('pass_mismatch'));
        }
        if (newPassword.length < 6) {
          throw new Error(t('pass_too_short'));
        }

        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email) throw new Error(t('user_not_found'));

        const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);

        // Clear password fields on success
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      await refreshUser();
      Alert.alert(t('confirm'), t('update_success'));
      router.push('/(tabs)/profile');
    } catch (e: any) {
      let msg = e.message || t('update_failed');
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        msg = t('wrong_old_pass');
      }
      Alert.alert(t('error'), msg);
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = avatarUri
    ? { uri: avatarUri }
    : (user?.avatar ? { uri: user.avatar } : null);

  const hasChanges =
    name.trim() !== (user?.name || '') ||
    avatarUri !== (user?.avatar || null) ||
    oldPassword.length > 0 ||
    newPassword.length > 0 ||
    confirmPassword.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={25} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('edit_profile')}</Text>
        <View style={{ width: 25 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrapper}>
              <View style={styles.avatarRing}>
                {avatarSrc ? (
                  <Image source={avatarSrc} style={styles.avatar} />
                ) : (
                  <Ionicons name="person" size={80} color="#DDD" />
                )}
              </View>
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={18} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Profile Info Form */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>{t('personal_info')}</Text>

            {/* Họ và tên */}
            <View style={[styles.menuItem, styles.menuItemBorder]}>
              <Ionicons name="person-outline" size={22} color="#555" style={styles.menuIcon} />
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{t('full_name')}</Text>
                <TextInput
                  style={styles.menuInput}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('full_name')}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Email */}
            <View style={[styles.menuItem, styles.menuItemBorder]}>
              <Ionicons name="mail-outline" size={22} color="#555" style={styles.menuIcon} />
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{t('email')}</Text>
                <Text style={styles.menuStatic}>{user?.email || '—'}</Text>
              </View>
            </View>

            {/* Đổi mật khẩu Section */}
            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>{t('change_password')}</Text>

            {/* Mật khẩu hiện tại */}
            <View style={[styles.menuItem, styles.menuItemBorder]}>
              <Ionicons name="lock-closed-outline" size={22} color="#555" style={styles.menuIcon} />
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{t('current_password')}</Text>
                <View style={styles.pwRow}>
                  <TextInput
                    style={[styles.menuInput, { flex: 1 }]}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry={!showOld}
                    placeholder="••••••••"
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity onPress={() => setShowOld(!showOld)}>
                    <Ionicons name={showOld ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Mật khẩu mới */}
            <View style={[styles.menuItem, styles.menuItemBorder]}>
              <Ionicons name="shield-outline" size={22} color="#555" style={styles.menuIcon} />
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{t('new_password')}</Text>
                <View style={styles.pwRow}>
                  <TextInput
                    style={[styles.menuInput, { flex: 1 }]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                    placeholder="••••••••"
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                    <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Xác nhận mật khẩu mới */}
            <View style={[styles.menuItem, styles.menuItemBorder]}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#555" style={styles.menuIcon} />
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{t('confirm_new_password')}</Text>
                <View style={styles.pwRow}>
                  <TextInput
                    style={[styles.menuInput, { flex: 1 }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    placeholder="••••••••"
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>


          {/* Nút lưu duy nhất */}
          <View style={{ marginBottom: 25 }}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: hasChanges ? '#00CFA3' : '#E0E0E0' }]}
              onPress={handleSubmit}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <ActivityIndicator color="#ffffffff" />
              ) : (
                <Text style={styles.saveBtnText}>{t('save_changes')}</Text>
              )}
            </TouchableOpacity>
          </View>


        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
    lineHeight: 30,
  },
  scroll: {
    paddingHorizontal: 25,
    paddingTop: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#000000ff',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  formContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 15,
    lineHeight: 26,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60, // Fixed height for stability
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    marginRight: 15,
    width: 24,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
    lineHeight: 18,
  },
  menuInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000ff',
    paddingVertical: 0,
    paddingLeft: 0,
    lineHeight: 20,
  },
  menuStatic: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000ff',
    paddingVertical: 0,
    paddingLeft: 0,
    lineHeight: 20,
  },
  pwRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    flexShrink: 0,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

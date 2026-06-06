import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { auth, db } from '@/utils/firebaseConfig';
import { scale, verticalScale, moderateScale } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
  withTiming
} from 'react-native-reanimated';
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

  // Toast States
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastY = useSharedValue(-100);

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type as any);
    setShowToast(true);
    toastY.value = withTiming(Platform.OS === 'ios' ? 50 : 40, { duration: 400 });

    setTimeout(() => {
      toastY.value = withTiming(-100, { duration: 400 });
      setTimeout(() => setShowToast(false), 400);
    }, 3000);
  };

  const handleBack = () => {
    // Reset state before leaving (optional but ensures "xóa sạch" feel)
    if (user) {
      setName(user.name || '');
      setAvatarUri(user.avatar || null);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    router.replace('/(tabs)/profile');
  };

  // Reset state to user data whenever the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        setName(user.name || '');
        setAvatarUri(user.avatar || null);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    }, [user])
  );

  const animatedToastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
    opacity: interpolate(toastY.value, [-100, 40], [0, 1], 'clamp'),
  }));

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
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
      triggerToast(t('name_required'), 'error');
      return;
    }

    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error(t('not_logged_in'));

      // 1. Update Profile (Name/Avatar)
      const newAvatar = avatarUri || user?.avatar || '';
      const newName = name.trim();

      await updateDoc(doc(db, 'users', uid), {
        name: newName,
        avatar: newAvatar,
      });

      // 1b. Sync with Posts & Comments (Cập nhật tên và ảnh đại diện trên toàn bộ dữ liệu cũ)
      try {
        const batch = writeBatch(db);

        // Cập nhật Posts
        const postsQuery = query(collection(db, 'posts'), where('userId', '==', uid));
        const postSnapshots = await getDocs(postsQuery);
        postSnapshots.forEach((postDoc) => {
          batch.update(postDoc.ref, { user: newName, userAvatar: newAvatar });
        });

        // Cập nhật Comments (Sử dụng collectionGroup để quét tất cả sub-collections)
        const { collectionGroup } = await import('firebase/firestore');
        const commentsQuery = query(collectionGroup(db, 'comments'), where('userId', '==', uid));
        const commentSnapshots = await getDocs(commentsQuery);
        commentSnapshots.forEach((commentDoc) => {
          batch.update(commentDoc.ref, { user: newName, avatar: newAvatar });
        });

        if (!postSnapshots.empty || !commentSnapshots.empty) {
          await batch.commit();
        }
      } catch (syncError) {
        console.error("Error syncing profile with posts/comments:", syncError);
      }

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
      triggerToast(t('update_success'), 'success');

      // Delay navigation to let toast be seen longer
      setTimeout(() => {
        router.push('/(tabs)/profile');
      }, 2200);
    } catch (e: any) {
      let msg = e.message || t('update_failed');
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        msg = t('wrong_old_pass');
      }
      triggerToast(msg, 'error');
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
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scale(26)} color="#000000ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('edit_profile')}</Text>
        <View style={{ width: scale(25) }} />
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
                  <Ionicons name="person" size={scale(80)} color="#DDD" />
                )}
              </View>
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={scale(18)} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Profile Info Form */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>{t('personal_info')}</Text>

            {/* Họ và tên */}
            <View style={[styles.menuItem, styles.menuItemBorder]}>
              <Ionicons name="person-outline" size={scale(22)} color="#555" style={styles.menuIcon} />
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
              <Ionicons name="mail-outline" size={scale(22)} color="#555" style={styles.menuIcon} />
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{t('email')}</Text>
                <Text style={styles.menuStatic}>{user?.email || '—'}</Text>
              </View>
            </View>

            {/* Đổi mật khẩu Section */}
            <Text style={[styles.sectionTitle, { marginTop: verticalScale(30) }]}>{t('change_password')}</Text>

            {/* Mật khẩu hiện tại */}
            <View style={[styles.menuItem, styles.menuItemBorder]}>
              <Ionicons name="lock-closed-outline" size={scale(22)} color="#555" style={styles.menuIcon} />
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
                    <Ionicons name={showOld ? "eye-off-outline" : "eye-outline"} size={scale(20)} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Mật khẩu mới */}
            <View style={[styles.menuItem, styles.menuItemBorder]}>
              <Ionicons name="shield-outline" size={scale(22)} color="#555" style={styles.menuIcon} />
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
                    <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={scale(20)} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Xác nhận mật khẩu mới */}
            <View style={[styles.menuItem, styles.menuItemBorder]}>
              <Ionicons name="shield-checkmark-outline" size={scale(22)} color="#555" style={styles.menuIcon} />
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
                    <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={scale(20)} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>


          {/* Nút lưu duy nhất */}
          <View style={{ marginBottom: verticalScale(25) }}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: hasChanges ? '#00CFA3' : '#E0E0E0' }]}
              onPress={handleSubmit}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <ActivityIndicator color="#ffffffff" />
              ) : (
                <Text style={styles.saveBtnText} numberOfLines={1} adjustsFontSizeToFit>{t('save_changes')}</Text>
              )}
            </TouchableOpacity>
          </View>


        </ScrollView>
      </KeyboardAvoidingView>

      {showToast && (
        <Animated.View style={[
          styles.toastContainer,
          animatedToastStyle,
          {
            backgroundColor: toastType === 'error' ? '#EF4444' : (toastType === 'success' ? '#10B981' : '#007AFF'),
            shadowColor: toastType === 'error' ? '#EF4444' : (toastType === 'success' ? '#10B981' : '#007AFF'),
          }
        ]}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: scale(32), height: scale(32), borderRadius: scale(16), justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name={toastType === 'success' ? "checkmark" : (toastType === 'error' ? "close" : "information")} size={scale(18)} color="#FFF" />
          </View>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(50),
    paddingBottom: verticalScale(15),
    backgroundColor: '#ffffffff',
  },
  backBtn: {
    width: scale(25),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: scale(25),
    paddingTop: verticalScale(20),
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: verticalScale(30),
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarRing: {
    width: scale(130),
    height: scale(130),
    borderRadius: scale(65),
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
    bottom: verticalScale(5),
    right: scale(5),
    backgroundColor: '#000000ff',
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  formContainer: {
    marginBottom: verticalScale(40),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: verticalScale(15),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: verticalScale(60), // Fixed height for stability
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    marginRight: scale(15),
    width: scale(24),
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: moderateScale(12),
    color: '#999',
    marginBottom: verticalScale(2),
    lineHeight: verticalScale(18),
  },
  menuInput: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#000000ff',
    paddingVertical: 0,
    paddingLeft: 0,
    lineHeight: verticalScale(20),
  },
  menuStatic: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#000000ff',
    paddingVertical: 0,
    paddingLeft: 0,
    lineHeight: verticalScale(20),
  },
  pwRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveBtn: {
    width: '100%',
    height: verticalScale(56),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffffff',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.2,
    shadowRadius: scale(8),
    elevation: 3,
    flexShrink: 0,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: verticalScale(26), // Optimized for VN
  },
  toastContainer: {
    position: 'absolute',
    left: scale(15),
    right: scale(15),
    zIndex: 10000,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(20),
    borderRadius: scale(22),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.3,
    shadowRadius: scale(20),
    elevation: 10,
  },
  toastText: { color: '#FFF', fontSize: moderateScale(15), fontWeight: '700', marginLeft: scale(15), flex: 1, letterSpacing: 0.3 },
});

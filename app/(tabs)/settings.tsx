import { AuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';

import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useContext(AuthContext);


  // Settings States
  const [isStudyReminder, setIsStudyReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('19:00');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const handleTimeSelect = (h: string, m: string) => {
    setReminderTime(`${h}:${m}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={25} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('settings')}</Text>
        <View style={{ width: 25 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Nhắc nhở học tập */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('notif_settings')}</Text>
            <View style={styles.switchItem}>
              <Text style={styles.switchLabel}>{t('study_reminder')}</Text>
              <TouchableOpacity
                activeOpacity={user ? 0.8 : 1}
                onPress={() => user && setIsStudyReminder(!isStudyReminder)}
                style={[
                  styles.customSwitch,
                  { alignItems: (user && isStudyReminder) ? 'flex-end' : 'flex-start' },
                  !user && { opacity: 0.5 }
                ]}
              >
                <View style={[
                  styles.customThumb,
                  { backgroundColor: (user && isStudyReminder) ? '#FF0000' : '#000' }
                ]} />
              </TouchableOpacity>
            </View>
            {!user && (
              <Text style={{ fontSize: 14, color: '#FF0000', marginTop: 0, marginBottom: 10 }}>
                {t('login_to_use')}
              </Text>
            )}

            {user && isStudyReminder && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.switchItem}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={[styles.switchLabel, { paddingLeft: 10 }]}>{t('reminder_time')}</Text>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeText}>{reminderTime}</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Ngôn ngữ */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('language')}</Text>
            <TouchableOpacity
              style={[styles.optionItem, language === 'vi' && styles.activeOption]}
              onPress={() => setLanguage('vi')}
            >
              <Text style={[styles.optionText, language === 'vi' && styles.activeOptionText]}>{t('vietnamese')}</Text>
              {language === 'vi' && <Ionicons name="checkmark-circle" size={20} color="#ff0000ff" />}
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={[styles.optionItem, language === 'km' && styles.activeOption]}
              onPress={() => setLanguage('km')}
            >
              <Text style={[styles.optionText, language === 'km' && styles.activeOptionText]}>{t('khmer')}</Text>
              {language === 'km' && <Ionicons name="checkmark-circle" size={20} color="#ff0000ff" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Thông tin ứng dụng */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('app_info')}</Text>
            <TouchableOpacity style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('intro')}</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('version')}</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('reminder_time')}</Text>
            <View style={styles.timePickerContainer}>
              <ScrollView
                style={styles.timeList}
                showsVerticalScrollIndicator={false}
              >
                {hours.map(h => (
                  <TouchableOpacity
                    key={h}
                    style={styles.timeItem}
                    onPress={() => handleTimeSelect(h, reminderTime.split(':')[1])}
                  >
                    <Text style={[styles.timeItemText, reminderTime.startsWith(h) && styles.activeTimeText]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.timeSeparator}>:</Text>
              <ScrollView
                style={styles.timeList}
                showsVerticalScrollIndicator={false}
              >
                {minutes.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={styles.timeItem}
                    onPress={() => handleTimeSelect(reminderTime.split(':')[0], m)}
                  >
                    <Text style={[styles.timeItemText, reminderTime.endsWith(m) && styles.activeTimeText]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.closeModalText}>{t('confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 28,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingBottom: 5,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    // Elevation for Android
    elevation: 2,
  },
  customSwitch: {
    width: 46,
    height: 26,
    borderRadius: 15,
    backgroundColor: '#F2F2F2',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 3,
    justifyContent: 'center',
  },
  customThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000ff',
    paddingTop: 15,
    paddingBottom: 5,
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 55, // Fixed height for visual stability
  },
  optionText: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
    lineHeight: 22,
  },
  activeOption: {
    // optional active styling
  },
  activeOptionText: {
    color: '#1A1A1A',
    fontWeight: '600',
    lineHeight: 22,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52, // Fixed height for visual stability
  },
  switchLabel: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
    lineHeight: 22,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeText: {
    fontSize: 14,
    color: '#ffffffff',
    fontWeight: '700',
    lineHeight: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 55, // Fixed height for visual stability
  },
  infoLabel: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
    lineHeight: 22,
  },
  infoValue: {
    fontSize: 14,
    color: '#000000ff',
    fontWeight: '500',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    minHeight: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 20,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    paddingHorizontal: 20,
  },
  timeList: {
    flex: 1,
    height: '100%',
  },
  timeItem: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeItemText: {
    fontSize: 20,
    color: '#AAA',
    fontWeight: '500',
  },
  activeTimeText: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 24,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '700',
    marginHorizontal: 15,
  },
  closeModalBtn: {
    backgroundColor: '#0059ffff',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  closeModalText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

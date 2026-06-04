import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const isAndroid = Platform.OS === 'android';
const shouldSkip = isExpoGo && isAndroid;

// Cấu hình Handler (Luôn chạy để hỗ trợ thông báo nội bộ)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  // Chỉ cấu hình Channel và xin quyền, không lấy Push Token ở đây để tránh lỗi Expo Go SDK 53
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Mặc định',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
  } catch (error) {
    console.log('Error in notification registration:', error);
  }
}

export async function scheduleStudyReminder(title: string, body: string, seconds: number = 2) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: seconds,
      } as any,
    });
  } catch (e) {
    console.log('Error scheduling notification:', e);
  }
}

export async function scheduleDaily7AMReminder() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Bạn chưa học hôm nay 📚',
        body: 'Dành 5 phút để học từ vựng mới nhé',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 7,
        minute: 0,
      } as any,
    });
  } catch (e) {
    console.log('Lỗi lên lịch thông báo:', e);
  }
}

export const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Bạn chưa học hôm nay 📚',
    body: 'Dành 5 phút để học từ vựng mới nhé',
    type: 'study',
  },
];


import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const isAndroid = Platform.OS === 'android';

// Chỉ cấu hình nếu KHÔNG phải Expo Go trên Android
if (!(isExpoGo && isAndroid)) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotificationsAsync() {
  // Bỏ qua đăng ký nếu đang chạy trên Expo Go trên Android (SDK 53+ không hỗ trợ remote notifications)
  if (isExpoGo && Platform.OS === 'android') {
    console.log('Skipping push notification registration on Expo Go (Android)');
    return;
  }

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
}

export async function scheduleStudyReminder(title: string, body: string, seconds: number = 2) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: seconds,
    } as any,
  });
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

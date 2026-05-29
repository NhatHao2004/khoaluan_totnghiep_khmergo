import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LoadingScreen } from '@/components/loading-screen';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { registerForPushNotificationsAsync, scheduleDaily7AMReminder } from '@/utils/notification-handler';

// Chặn thông báo lỗi permission-denied của Firebase gây nhiễu trên App di động
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('permission-denied')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.hideAsync();
        await registerForPushNotificationsAsync();
        
        // Check if notifications are enabled before scheduling
        const saved = await AsyncStorage.getItem('notifications_enabled');
        if (saved === null || saved === 'true') {
          await scheduleDaily7AMReminder();
        }
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LanguageProvider>
          {!isAppReady ? (
            <LoadingScreen onFinish={() => setIsAppReady(true)} />
          ) : (
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack screenOptions={{ 
                headerShown: false,
                contentStyle: { backgroundColor: '#FFFFFF' }
              }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="login" options={{ presentation: 'modal' }} />
                <Stack.Screen name="register" options={{ presentation: 'modal' }} />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          )}
        </LanguageProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

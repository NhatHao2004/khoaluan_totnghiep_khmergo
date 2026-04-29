import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LoadingScreen } from '@/components/loading-screen';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Tắt màn hình Splash rắc rối gốc (native) ngay lập tức
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, []);

  return (
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
  );
}

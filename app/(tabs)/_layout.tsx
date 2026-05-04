import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

// Prevent native splash screen from auto-hiding

const COLORS = {
  primary: '#000000ff',
  inactive: '#717171ff',
  background: '#ffffff',
  shadow: '#000000ff',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tabs
        initialRouteName="index"
        screenOptions={{
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.inactive,
          headerShown: false,
          tabBarButton: HapticTab,
          animation: 'none', // Disable tab switching animation
          lazy: false, // Pre-render all screens to avoid mount-time jerking
          freezeOnBlur: true, // Freezes JS execution on inactive screens for speed
          tabBarStyle: {
            height: 70,
            paddingBottom: 20,
            paddingTop: 15,
            backgroundColor: COLORS.background,
            borderTopLeftRadius: 0, // Simplified for stability
            borderTopRightRadius: 0, // Simplified for stability
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarShowLabel: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Trang chủ',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={size || 24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="quiz"
          options={{
            title: 'Thử thách',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={focused ? 'game-controller' : 'game-controller-outline'}
                size={27}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="medal"
          options={{
            title: 'Thành tích',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={focused ? 'ribbon' : 'ribbon-outline'}
                size={26}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Cá nhân',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={focused ? 'person-circle' : 'person-circle-outline'}
                size={29}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="pagoda"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="pagoda-detail"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="directions"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="edit-profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="personal-info"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="change-password"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="language"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="do-quiz/[id]"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="learning-progress"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="support"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="faq/[id]"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({});

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

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

import React, { useEffect, useRef, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const router = useRouter();
  const [isChatEnabled, setIsChatEnabled] = useState(true);

  // Reset position when pathname changes to home
  useEffect(() => {
    const loadChatSetting = async () => {
      const saved = await AsyncStorage.getItem('chat_button_enabled');
      if (saved !== null) {
        setIsChatEnabled(saved === 'true');
      }
    };
    loadChatSetting();
  }, [pathname]);

  // Position for draggable AI button
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const context = useSharedValue({ x: 0, y: 0 });
  const opacity = useSharedValue(1);
  const dimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = () => {
    opacity.value = withTiming(1, { duration: 200 });
    if (dimTimer.current) clearTimeout(dimTimer.current);
    dimTimer.current = setTimeout(() => {
      opacity.value = withTiming(0.3, { duration: 600 });
    }, 5000);
  };

  useEffect(() => {
    resetIdleTimer();
    return () => { if (dimTimer.current) clearTimeout(dimTimer.current); };
  }, []);

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const BUTTON_SIZE = 50;
  const MARGIN = 10;
  const BTN_BOTTOM = 80;
  const BTN_RIGHT = 10;

  // X limits (Initial is right:10)
  const MIN_X = -SCREEN_WIDTH + BUTTON_SIZE + (BTN_RIGHT * 2);
  const MAX_X = 0;

  // Y limits (Initial is bottom:80)
  const MIN_Y = -SCREEN_HEIGHT + BTN_BOTTOM + BUTTON_SIZE + 40; // top limit
  const MAX_Y = 0; // bottom limit

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value };
      opacity.value = withTiming(1, { duration: 150 });
    })
    .onUpdate((event) => {
      let nextX = event.translationX + context.value.x;
      let nextY = event.translationY + context.value.y;

      // Clamp values during dragging
      translateX.value = Math.min(Math.max(nextX, MIN_X), MAX_X);
      translateY.value = Math.min(Math.max(nextY, MIN_Y), MAX_Y);
    })
    .onEnd(() => {
      // Snap to nearest side (Left or Right)
      const threshold = MIN_X / 2;
      if (translateX.value < threshold) {
        translateX.value = withTiming(MIN_X, { duration: 300 });
      } else {
        translateX.value = withTiming(MAX_X, { duration: 300 });
      }
      runOnJS(resetIdleTimer)();
    });

  const animatedChatStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

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
          name="community"
          options={{
            title: 'Cộng đồng',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={27}
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
            href: null,
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
          name="favorites"
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

      {/* Floating AI Chat Button - Globally visible in tabs */}
      {isChatEnabled && ['/', '/index', '/community', '/quiz', '/profile'].includes(pathname) && (
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.floatingChatBtn, animatedChatStyle]}>
            <TouchableOpacity
              style={styles.chatBtnInner}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/ai-chat' as any);
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={22} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      )}

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  floatingChatBtn: {
    position: 'absolute',
    bottom: 80,
    right: 10,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 99999,
  },
  chatBtnInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

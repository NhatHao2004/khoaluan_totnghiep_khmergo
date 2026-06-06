import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { scale as respScale, verticalScale, moderateScale } from '@/utils/responsive';

// Prevent native splash screen from auto-hiding

const COLORS = {
  primary: '#000000ff',
  inactive: '#717171ff',
  background: '#ffffff',
  shadow: '#000000ff',
};

import { useLanguage } from '@/contexts/LanguageContext';
import React, { useEffect, useRef, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabsLayout() {
  const { t } = useLanguage();
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

  // Shared values for draggable AI button and animations
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const context = useSharedValue({ x: 0, y: 0 });
  const opacity = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const dimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Removed resetIdleTimer to keep button fully visible at all times
  useEffect(() => {
    // Scale animation (3s cycle)
    buttonScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const BUTTON_SIZE = respScale(60);
  const MARGIN = respScale(15);
  const BTN_BOTTOM = verticalScale(85);
  const BTN_RIGHT = respScale(15);

  // X limits
  const MIN_X = -SCREEN_WIDTH + BUTTON_SIZE + (BTN_RIGHT * 2);
  const MAX_X = 0;

  // Y limits
  const MIN_Y = -SCREEN_HEIGHT + BTN_BOTTOM + BUTTON_SIZE + 40;
  const MAX_Y = 0;

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value };
    })
    .onUpdate((event) => {
      let nextX = event.translationX + context.value.x;
      let nextY = event.translationY + context.value.y;
      translateX.value = Math.min(Math.max(nextX, MIN_X), MAX_X);
      translateY.value = Math.min(Math.max(nextY, MIN_Y), MAX_Y);
    })
    .onEnd(() => {
      const threshold = MIN_X / 2;
      if (translateX.value < threshold) {
        translateX.value = withTiming(MIN_X, { duration: 300 });
      } else {
        translateX.value = withTiming(MAX_X, { duration: 300 });
      }
    });

  const animatedChatStyle = useAnimatedStyle(() => {
    // Breathing aura
    const shadowRadius = interpolate(buttonScale.value, [1, 1.1], [8, 18]);

    return {
      opacity: 1, // Always fully visible
      backgroundColor: '#FFFFFF', // Set to white as requested
      shadowColor: '#007AFF', // Blue shadow to pop on white background
      borderColor: '#1E3A8A', // Dark blue border (xanh đậm)
      shadowRadius,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: buttonScale.value },
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
            height: verticalScale(75),
            paddingBottom: verticalScale(5),
            paddingTop: verticalScale(8),
            backgroundColor: COLORS.background,
            borderTopLeftRadius: 0, // Simplified for stability
            borderTopRightRadius: 0, // Simplified for stability
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: moderateScale(11),
            fontWeight: '600',
            marginTop: verticalScale(8),
          }
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('tab_home'),
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={respScale(size || 24)}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: t('tab_community'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={respScale(27)}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="quiz"
          options={{
            title: t('tab_quiz'),
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={focused ? 'game-controller' : 'game-controller-outline'}
                size={respScale(27)}
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
            title: t('tab_profile'),
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={focused ? 'person-circle' : 'person-circle-outline'}
                size={respScale(29)}
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
              activeOpacity={1}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/ai-chat' as any);
              }}
            >
              <Image 
                source={require('@/assets/images/AI.jpg')} 
                style={styles.chatIconImage} 
              />
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
    bottom: verticalScale(85),
    right: respScale(15),
    width: respScale(60),
    height: respScale(60),
    borderRadius: respScale(30),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
    zIndex: 99999,
  },
  chatBtnInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: respScale(30),
  },
  chatIconImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

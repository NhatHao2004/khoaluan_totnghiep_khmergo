import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLanguage } from '@/contexts/LanguageContext';
import { s, vs, ms } from '@/utils/responsive';

const { width } = Dimensions.get('window');

export function LoadingScreen({ onFinish }: { onFinish?: () => void }) {
  const { t } = useLanguage();
  // Sử dụng Animated chuẩn của React Native
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Chỉ giữ lại Animation cho thanh tiến trình
    Animated.timing(progress, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: false,
    }).start(() => {
      // Khi thanh chạy đầy (4000ms), gọi hàm onFinish để chuyển trang ngay
      if (onFinish) onFinish();
    });
  }, [onFinish]);

  const barWidth = s(width * 0.8 / (width / 393)); // Adjusted logic or just use s(330)
  // Actually, barWidth in original was width * 0.85. 
  // Let's use a fixed logic based on responsive width.
  const responsiveBarWidth = s(320); 

  return (
    <ThemedView style={styles.container}>
      <View style={styles.centerContent}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <ThemedText style={styles.title}>
          KhmerGo
        </ThemedText>
        <ThemedText 
          style={styles.subtitle}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {t('loading_preparing')}
        </ThemedText>
      </View>

      <View style={styles.bottomContent}>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, responsiveBarWidth]
                })
              }
            ]}
          />
        </View>
        <ThemedText style={styles.loadingText}>
          {t('loading_text')}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'space-between',
    paddingVertical: vs(80),
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(20),
  },
  logoContainer: {
    marginBottom: vs(5),
  },
  logo: {
    width: s(250),
    height: vs(180),
  },
  title: {
    fontSize: ms(42),
    fontWeight: '800',
    color: '#000',
    marginBottom: vs(8),
    includeFontPadding: false,
    lineHeight: ms(52),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: ms(16),
    color: '#666',
    fontWeight: '500',
    includeFontPadding: false,
    textAlign: 'center',
  },
  bottomContent: {
    alignItems: 'center',
    paddingHorizontal: s(40),
  },
  progressBarContainer: {
    width: s(320),
    height: vs(6),
    backgroundColor: '#f0f0f0',
    borderRadius: vs(3),
    overflow: 'hidden',
    marginBottom: vs(15),
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFCC00',
  },
  loadingText: {
    fontSize: ms(14),
    color: '#999',
    fontWeight: '500',
  },
});

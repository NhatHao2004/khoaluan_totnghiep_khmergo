import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design dimensions (your test device ~6.5" Android FHD+)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

/**
 * Horizontal scale - based on screen width
 * Use for: width, paddingHorizontal, marginHorizontal, gap, borderRadius
 */
export const s = (size: number): number => {
  return Math.round((SCREEN_WIDTH / BASE_WIDTH) * size * 100) / 100;
};

/**
 * Vertical scale - based on screen height
 * Use for: height, paddingVertical, marginVertical, paddingTop, paddingBottom
 */
export const vs = (size: number): number => {
  return Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * size * 100) / 100;
};

/**
 * Moderate scale - softer scaling (default factor 0.5)
 * Use for: fontSize, lineHeight, icon sizes, letterSpacing
 * This prevents text from becoming too large or too small
 */
export const ms = (size: number, factor: number = 0.5): number => {
  return Math.round((size + (s(size) - size) * factor) * 100) / 100;
};

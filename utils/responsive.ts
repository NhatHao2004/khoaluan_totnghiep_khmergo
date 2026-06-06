import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Redmi 12 baseline dimensions
const guidelineBaseWidth = 393;
const guidelineBaseHeight = 873;

/**
 * Scales a size based on the screen width relative to the Redmi 12 (393dp).
 * Use this for width, horizontal padding, margins, font sizes, etc.
 */
const scale = (size: number) => (width / guidelineBaseWidth) * size;

/**
 * Scales a size based on the screen height relative to the Redmi 12 (873dp).
 * Use this for height, vertical padding, margins, etc.
 */
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;

/**
 * Scales a size with a factor to moderate the effect.
 * Useful for font sizes or small elements that shouldn't scale as aggressively.
 * @param size The size to scale
 * @param factor The moderate factor (default 0.5)
 */
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export { scale, verticalScale, moderateScale, width, height };

import { useEffect, type ReactNode } from "react";
import { type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface FadeInViewProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  /** Slide up distance in pixels */
  slideUp?: number;
}

/**
 * Wraps children in a fade-in (and optional slide-up) animation.
 */
export function FadeInView({
  children,
  delay = 0,
  duration = 400,
  style,
  slideUp = 10,
}: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(slideUp);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(0, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay, duration, opacity, translateY, slideUp]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}

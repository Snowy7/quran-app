import { type ReactNode } from "react";
import { type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { hapticLight } from "../lib/haptics";

interface AnimatedPressableProps {
  onPress: () => void;
  children: ReactNode;
  style?: ViewStyle;
  haptic?: boolean;
  scaleDown?: number;
}

/**
 * A Pressable that scales down with spring animation on press.
 * Uses reanimated for 60fps native-thread animation.
 */
export function AnimatedPressable({
  onPress,
  children,
  style,
  haptic = true,
  scaleDown = 0.97,
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const gesture = Gesture.Tap()
    .onBegin(() => {
      "worklet";
      scale.value = withSpring(scaleDown, {
        damping: 15,
        stiffness: 400,
      });
    })
    .onFinalize(() => {
      "worklet";
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 400,
      });
    })
    .onEnd(() => {
      if (haptic) {
        hapticLight();
      }
      onPress();
    })
    .runOnJS(true);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/** Light haptic tap - use for button presses, selections */
export function hapticLight(): void {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/** Medium haptic tap - use for toggles, important actions */
export function hapticMedium(): void {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

/** Heavy haptic tap - use for destructive actions, confirmations */
export function hapticHeavy(): void {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}

/** Success haptic - use when an action succeeds (bookmark saved, etc.) */
export function hapticSuccess(): void {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

/** Error haptic - use when an action fails */
export function hapticError(): void {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

/** Selection haptic - use for picker/scroll changes */
export function hapticSelection(): void {
  if (Platform.OS !== "web") {
    Haptics.selectionAsync();
  }
}

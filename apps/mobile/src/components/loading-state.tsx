import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { palette, spacing } from "../theme/palette";

interface LoadingStateProps {
  label?: string;
  light?: boolean;
}

export function LoadingState({ label = "Loading...", light = false }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        color={light ? "#CC9B76" : palette.brand}
        size="small"
      />
      <Text style={[styles.label, light && styles.labelLight]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  label: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: "500",
  },
  labelLight: {
    color: "#CCB196",
  },
});

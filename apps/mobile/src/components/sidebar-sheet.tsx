import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { palette, radii, shadows, spacing } from "../theme/palette";

interface SidebarSheetProps {
  visible: boolean;
  onClose: () => void;
  onGoHome: () => void;
  onGoQuran: () => void;
  onGoBookmarks: () => void;
  onGoSettings: () => void;
}

export function SidebarSheet({
  visible,
  onClose,
  onGoHome,
  onGoQuran,
  onGoBookmarks,
  onGoSettings,
}: SidebarSheetProps) {
  const items = [
    { label: "Home", icon: "home-outline" as const, action: onGoHome },
    { label: "Quran", icon: "book-outline" as const, action: onGoQuran },
    { label: "Bookmarks", icon: "bookmark-outline" as const, action: onGoBookmarks },
    { label: "Settings", icon: "settings-outline" as const, action: onGoSettings },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sidebarWrap}>
        <View style={styles.sidebar}>
          <View style={styles.header}>
            <Text style={styles.title}>Menu</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={palette.textMuted} />
            </Pressable>
          </View>

          <View style={styles.menuList}>
            {items.map((item) => (
              <Pressable
                key={item.label}
                style={styles.menuItem}
                onPress={() => {
                  item.action();
                  onClose();
                }}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={18} color={palette.brand} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={palette.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.overlay,
  },
  sidebarWrap: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  sidebar: {
    marginTop: 54,
    marginLeft: 12,
    width: "78%",
    maxWidth: 320,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.background,
    padding: spacing.lg,
    ...shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  menuList: {
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.brand + "14",
  },
  menuLabel: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
});

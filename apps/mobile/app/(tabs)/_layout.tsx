import { Tabs } from "expo-router";
import { Platform, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../lib/theme";
import { useTranslation } from "../../lib/i18n";
import { hapticLight } from "../../lib/haptics";
import {
  HomeIcon,
  QuranIcon,
  BookmarkIcon,
  AcademicCapIcon,
  ClockIcon,
} from "../../components/icons/tab-icons";

export default function TabLayout() {
  const c = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tabBarWidth = Math.min(272, Math.max(252, width - 128));
  const sideInset = Math.max(12, (width - tabBarWidth) / 2);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? Math.max(insets.bottom, 8) : 12,
          left: sideInset,
          right: sideInset,
          height: 52,
          borderRadius: 26,
          backgroundColor: c.card,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: c.border + "80",
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={
                <HomeIcon
                  color={focused ? "#FFFFFF" : color}
                  size={focused ? 20 : 18}
                  strokeWidth={focused ? 2.2 : 1.6}
                />
              }
              focused={focused}
              activeColor={c.primary}
            />
          ),
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: t("quran"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={
                <QuranIcon
                  color={focused ? "#FFFFFF" : color}
                  size={focused ? 20 : 18}
                  active={focused}
                />
              }
              focused={focused}
              activeColor={c.primary}
            />
          ),
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t("saved"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={
                <BookmarkIcon
                  color={focused ? "#FFFFFF" : color}
                  size={focused ? 20 : 18}
                  strokeWidth={focused ? 2.2 : 1.6}
                />
              }
              focused={focused}
              activeColor={c.primary}
            />
          ),
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
      <Tabs.Screen
        name="hifz"
        options={{
          title: t("hifz"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={
                <AcademicCapIcon
                  color={focused ? "#FFFFFF" : color}
                  size={focused ? 20 : 18}
                  strokeWidth={focused ? 2.2 : 1.6}
                />
              }
              focused={focused}
              activeColor={c.primary}
            />
          ),
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: t("prayer"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={
                <ClockIcon
                  color={focused ? "#FFFFFF" : color}
                  size={focused ? 20 : 18}
                  strokeWidth={focused ? 2.2 : 1.6}
                />
              }
              focused={focused}
              activeColor={c.primary}
            />
          ),
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
    </Tabs>
  );
}

/**
 * Tab icon with active state matching the web version:
 * - Active: circular primary bg, icon is white, slight translate up
 * - Inactive: transparent bg, muted icon
 */
function TabIcon({
  icon,
  focused,
  activeColor,
}: {
  icon: React.ReactNode;
  focused: boolean;
  activeColor: string;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: focused ? 40 : 36,
        height: focused ? 40 : 36,
        borderRadius: 20,
        backgroundColor: focused ? activeColor : "transparent",
        transform: focused ? [{ translateY: -5 }] : [],
        ...(focused
          ? {
              shadowColor: activeColor,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 6,
            }
          : {}),
      }}
    >
      {icon}
    </View>
  );
}

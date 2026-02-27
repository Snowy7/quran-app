import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../lib/theme";
import { useTranslation } from "../../lib/i18n";
import { hapticLight } from "../../lib/haptics";
import {
  HomeIcon,
  BookOpenIcon,
  BookmarkIcon,
  AcademicCapIcon,
  ClockIcon,
} from "./tab-icons";

export default function TabLayout() {
  const c = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? insets.bottom : 12,
          left: 20,
          right: 20,
          height: 64,
          borderRadius: 32,
          backgroundColor: c.card,
          borderTopWidth: 0,
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
          paddingVertical: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<HomeIcon color={color} />} focused={focused} color={color} />
          ),
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: t("quran"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<BookOpenIcon color={color} />} focused={focused} color={color} />
          ),
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t("saved"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<BookmarkIcon color={color} />} focused={focused} color={color} />
          ),
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
      <Tabs.Screen
        name="hifz"
        options={{
          title: t("hifz"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<AcademicCapIcon color={color} />} focused={focused} color={color} />
          ),
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: t("prayer"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<ClockIcon color={color} />} focused={focused} color={color} />
          ),
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
    </Tabs>
  );
}

function TabIcon({
  icon,
  focused,
  color,
}: {
  icon: React.ReactNode;
  focused: boolean;
  color: string;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: focused ? color + "15" : "transparent",
      }}
    >
      {icon}
    </View>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, shadows } from "../theme/palette";
import { HomeScreen } from "../screens/home-screen";
import { QuranScreen } from "../screens/quran-screen";
import { BookmarksScreen } from "../screens/bookmarks-screen";
import { SettingsScreen } from "../screens/settings-screen";
import { ReaderScreen } from "../screens/reader-screen";
import type { HomeTabParamList, RootStackParamList } from "./types";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<HomeTabParamList>();

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const iconByRoute: Record<string, keyof typeof Ionicons.glyphMap> = {
    Home: "home-outline",
    Quran: "book-outline",
    Bookmarks: "bookmark-outline",
    Settings: "settings-outline",
  };

  const labelByRoute: Record<string, string> = {
    Home: "Home",
    Quran: "Quran",
    Bookmarks: "Saved",
    Settings: "Settings",
  };

  return (
    <View style={[styles.tabBarOuter, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.tabBarPill}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const options = descriptor?.options;
          const isFocused = state.index === index;
          const icon = iconByRoute[route.name] ?? "ellipse-outline";
          const label = labelByRoute[route.name] ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options?.tabBarAccessibilityLabel}
              testID={options?.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
            >
              <Ionicons
                name={isFocused ? icon.replace("-outline", "") as keyof typeof Ionicons.glyphMap : icon}
                size={18}
                color={isFocused ? palette.textOnBrand : palette.textMuted}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabsNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Quran" component={QuranScreen} />
      <Tab.Screen name="Bookmarks" component={BookmarksScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: palette.background,
        },
        headerTintColor: palette.brand,
        headerTitleStyle: {
          fontWeight: "700",
          color: palette.textPrimary,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: palette.background,
        },
      }}
    >
      <RootStack.Screen
        name="Tabs"
        component={TabsNavigator}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="Reader"
        component={ReaderScreen}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  tabBarPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "92%",
    backgroundColor: palette.background,
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadows.lg,
    ...(Platform.OS === "android" ? { elevation: 10 } : null),
  },
  tabItem: {
    flex: 1,
    minHeight: 50,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: palette.brand,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.textMuted,
  },
  tabLabelActive: {
    color: palette.textOnBrand,
  },
});

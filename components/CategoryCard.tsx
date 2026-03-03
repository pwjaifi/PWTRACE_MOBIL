import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";

export interface CategoryCardConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: { bg: string; icon: string; dark: string };
  route: string;
}

interface CategoryCardProps {
  config: CategoryCardConfig;
  onPress: () => void;
}

export function CategoryCard({ config, onPress }: CategoryCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Animated.View style={[styles.wrapper, animStyle]}>
      <Pressable
        style={styles.card}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: config.colors.bg }]}
        >
          <Ionicons name={config.icon} size={28} color={config.colors.icon} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {config.subtitle}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    margin: 6,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    height: 160,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  textContainer: {
    alignItems: "center",
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.textTertiary,
    lineHeight: 15,
    textAlign: "center",
  },
});

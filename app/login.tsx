import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { useAuth } from "@/contexts/AuthContext";

import { Colors } from "@/constants/colors";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const btnScale = useSharedValue(1);
  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "L'email est requis";
    else if (!email.includes("@")) newErrors.email = "Email invalide";
    if (!password) newErrors.password = "Le mot de passe est requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    btnScale.value = withSpring(0.97);

    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      } else {
        const msg = result.reason === "network_error"
          ? "Erreur de connexion au serveur. Vérifiez votre internet."
          : "Email ou mot de passe incorrect.";
        setErrors({ general: msg });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

    } catch (err: any) {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || "NOT SET (localhost fallback)";
      setErrors({ general: `Erreur: ${err.message}` });
      console.error("Login attempt failed to:", apiUrl, err);

      // Show an alert with the URL to help debug on the real phone
      Alert.alert(
        "Détails de l'erreur",
        `URL cible: ${apiUrl}\n\nMessage: ${err.message}`,
        [{ text: "OK" }]
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
      btnScale.value = withSpring(1);
    }
  }

  const logoImg = require("../assets/images/logo.png");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 20, paddingBottom: bottomPad + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(800)} style={styles.loginCard}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoWrap}>
              <Image
                source={logoImg}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>PEPPERWORLD TRACE</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
          </View>

          {errors.general ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.form}>
            <FormTextInput
              label="Email"
              placeholder="Entrez votre email"
              leftIcon="mail"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setErrors({});
              }}
              error={errors.email}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <View style={styles.passwordContainer}>
              <FormTextInput
                label="Password"
                placeholder="Entrez votre mot de passe"
                leftIcon="lock-closed"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setErrors({});
                }}
                error={errors.password}
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={Colors.textTertiary}
                />
              </Pressable>
            </View>

            <Animated.View style={[btnAnimStyle, { marginTop: 10 }]}>
              <Pressable
                style={[styles.loginButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                onPressIn={() => (btnScale.value = withSpring(0.98))}
                onPressOut={() => (btnScale.value = withSpring(1))}
                disabled={loading}
              >
                <View style={styles.buttonInner}>
                  <Ionicons name="log-in-outline" size={22} color={Colors.white} />
                  <Text style={styles.buttonText}>SE CONNECTER</Text>
                </View>
              </Pressable>
            </Animated.View>

            <Pressable style={styles.forgotBtn}>
              <View style={styles.forgotRow}>


              </View>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
  },
  loginCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: "100%",
    maxWidth: 450,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoWrap: {
    width: 64,
    height: 64,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: Colors.primary,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    marginTop: 8,
  },
  form: {
    gap: 20,
  },
  passwordContainer: {
    position: "relative",
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    bottom: 12,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },
  forgotBtn: {
    alignSelf: "center",
    marginTop: 10,
  },
  forgotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.textSecondary,
  },
  errorBox: {
    backgroundColor: "#FDECEA",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FADBD8",
  },
  errorText: {
    color: "#C0392B",
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
});
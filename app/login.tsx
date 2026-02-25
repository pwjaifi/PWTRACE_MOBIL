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
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [accountDisabled, setAccountDisabled] = useState(false);

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
    else if (password.length < 3) newErrors.password = "Mot de passe trop court";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setAccountDisabled(false);
    setLoading(true);
    btnScale.value = withSpring(0.97);

    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      } else if (result.reason === "account_disabled") {
        setAccountDisabled(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (result.reason === "invalid_credentials") {
        setErrors({ general: "Email ou mot de passe incorrect." });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setErrors({ general: "Erreur réseau. Veuillez réessayer." });
      }
    } catch {
      setErrors({ general: "Une erreur est survenue. Veuillez réessayer." });
    } finally {
      setLoading(false);
      btnScale.value = withSpring(1);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
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
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={36} color={Colors.white} />
          </View>
          <Text style={styles.appName}>GreenhouseManager</Text>
          <Text style={styles.appTagline}>Gestion des serres agricoles</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(250)} style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>
          <Text style={styles.cardSubtitle}>
            Connectez-vous pour accéder à vos observations
          </Text>

          {accountDisabled ? (
            <View style={styles.disabledBanner}>
              <Ionicons name="ban-outline" size={20} color={Colors.error} />
              <View style={styles.disabledBannerText}>
                <Text style={styles.disabledBannerTitle}>Compte désactivé</Text>
                <Text style={styles.disabledBannerBody}>
                  Votre compte est inactif. Veuillez contacter votre
                  administrateur pour le réactiver.
                </Text>
              </View>
            </View>
          ) : null}

          {errors.general ? (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={Colors.error}
              />
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          ) : null}

          <View style={styles.fields}>
            <FormTextInput
              label="Email"
              required
              placeholder="nom@ferme.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setErrors((e) => ({ ...e, email: "" }));
              }}
              error={errors.email}
            />

            <View>
              <FormTextInput
                label="Mot de passe"
                required
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setErrors((e) => ({ ...e, password: "" }));
                }}
                error={errors.password}
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPassword((s) => !s)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Colors.textTertiary}
                />
              </Pressable>
            </View>
          </View>

          <Animated.View style={btnAnimStyle}>
            <Pressable
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              onPressIn={() => {
                btnScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
              }}
              onPressOut={() => {
                btnScale.value = withSpring(1, { damping: 15, stiffness: 300 });
              }}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loginBtnInner}>
                  <Ionicons name="sync-outline" size={18} color={Colors.white} />
                  <Text style={styles.loginBtnText}>Connexion en cours...</Text>
                </View>
              ) : (
                <View style={styles.loginBtnInner}>
                  <Ionicons name="log-in-outline" size={18} color={Colors.white} />
                  <Text style={styles.loginBtnText}>Se connecter</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>

          <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(600).delay(400)}
          style={styles.footer}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={14}
            color={Colors.textTertiary}
          />
          <Text style={styles.footerText}>
            Connexion sécurisée — données de votre ferme protégées
          </Text>
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
    paddingHorizontal: 24,
    gap: 28,
  },
  logoArea: {
    alignItems: "center",
    gap: 12,
    paddingTop: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
  },
  appTagline: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    marginTop: -10,
    lineHeight: 19,
  },
  disabledBanner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.error + "30",
  },
  disabledBannerText: {
    flex: 1,
    gap: 4,
  },
  disabledBannerTitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.error,
  },
  disabledBannerBody: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.error,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.error + "20",
  },
  errorBannerText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.error,
    flex: 1,
  },
  fields: {
    gap: 16,
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    bottom: 13,
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginBtnDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
  forgotPassword: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.primary,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.textTertiary,
  },
});

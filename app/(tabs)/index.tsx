import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CategoryCard, CategoryCardConfig } from "@/components/CategoryCard";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES: CategoryCardConfig[] = [
  {
    id: "virus",
    title: "Virus",
    subtitle: "Surveiller les infections virales, sévérité et distribution",
    icon: "bug-outline",
    colors: Colors.categoryColors.virus,
    route: "/observations/virus",
  },
  {
    id: "auxiliaire",
    title: "Auxiliaire",
    subtitle: "Suivi des insectes auxiliaires et population",
    icon: "leaf-outline",
    colors: Colors.categoryColors.auxiliaire,
    route: "/observations/auxiliaire",
  },
  {
    id: "ravageurs",
    title: "Ravageurs",
    subtitle: "Détection et évaluation des ravageurs par serre",
    icon: "warning-outline",
    colors: Colors.categoryColors.ravageurs,
    route: "/observations/ravageurs",
  },
  {
    id: "irrigation",
    title: "Irrigation",
    subtitle: "Mesures VQV, EC et PH supply et drainage",
    icon: "water-outline",
    colors: Colors.categoryColors.irrigation,
    route: "/observations/irrigation",
  },
  {
    id: "inspection",
    title: "Inspection",
    subtitle: "Inspection multi-blocs avec photos et statuts",
    icon: "clipboard-outline",
    colors: Colors.categoryColors.inspection,
    route: "/observations/inspection",
  },
  {
    id: "compteur",
    title: "Compteur",
    subtitle: "Relevés compteurs entrée et sortie par ferme",
    icon: "speedometer-outline",
    colors: Colors.categoryColors.compteur,
    route: "/observations/compteur",
  },
];

const today = new Date();
const dateStr = today.toLocaleDateString("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function handleLogout() {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await logout();
            router.replace("/login");
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </Text>
          </View>
          <View>
            <Text style={styles.headerGreeting}>Bonjour, {user?.name?.split(" ")[0]}</Text>
            <Text style={styles.headerDate} numberOfLines={1}>{dateStr}</Text>
          </View>
        </View>
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>6</Text>
          <Text style={styles.statLabel}>Catégories</Text>
        </View>
        <View style={[styles.statCard, styles.statCardAccent]}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
          <Text style={[styles.statNumber, styles.statNumberWhite]}>Prêt</Text>
          <Text style={[styles.statLabel, styles.statLabelWhite]}>Système</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Fermes</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Catégories d'observation</Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.id}
            config={cat}
            onPress={() => router.push(cat.route as any)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
  },
  headerGreeting: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
  },
  headerDate: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    textTransform: "capitalize",
    maxWidth: 200,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardAccent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statNumber: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
  },
  statNumberWhite: {
    color: Colors.white,
    fontSize: 16,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.textTertiary,
  },
  statLabelWhite: {
    color: "rgba(255,255,255,0.7)",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
});

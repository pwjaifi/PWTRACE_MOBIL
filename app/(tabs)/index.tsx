import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
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
  Layout,
} from "react-native-reanimated";
import { CategoryCard, CategoryCardConfig } from "@/components/CategoryCard";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { FlatList } from "react-native";
import NetInfo from "@react-native-community/netinfo";

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
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState<boolean | null>(true);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const filteredCategories = React.useMemo(() => {
    if (!user?.categories) return CATEGORIES;
    return CATEGORIES.filter((cat) => user.categories.includes(cat.title));
  }, [user?.categories]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLogoutConfirm(true);
  }

  async function confirmLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* ── Logout Confirmation Modal ──────────────────────────────────── */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.box}>
            <View style={modalStyles.iconCircle}>
              <Ionicons name="log-out" size={32} color={Colors.white} />
            </View>
            <Text style={modalStyles.title}>Déconnexion</Text>
            <Text style={modalStyles.subtitle}>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </Text>

            <View style={modalStyles.buttonRow}>
              <Pressable
                style={[modalStyles.button, modalStyles.cancelButton]}
                onPress={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
              >
                <Text style={modalStyles.cancelButtonText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[modalStyles.button, modalStyles.logoutButton]}
                onPress={confirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={modalStyles.logoutButtonText}>Se déconnecter</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
          <View style={[styles.statIcon, { backgroundColor: Colors.successLight }]}>
            <Ionicons name="grid-outline" size={18} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.statNumber}>{filteredCategories.length}</Text>
            <Text style={styles.statLabel}>Modules</Text>
          </View>
        </View>
        <View
          style={[
            styles.statCard,
            !isOnline && styles.statCardOffline,
            isOnline && styles.statCardOnline,
          ]}
        >
          <View style={[styles.statIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons
              name={isOnline ? "wifi" : "cloud-offline"}
              size={18}
              color={Colors.white}
            />
          </View>
          <View>
            <Text style={[styles.statNumber, styles.statNumberWhite]}>
              {isOnline ? "En ligne" : "Hors ligne"}
            </Text>
            <Text style={[styles.statLabel, styles.statLabelWhite]}>Statut</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Observation & Suivi</Text>

      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 40 },
        ]}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(100 * index).springify().damping(12)}
            style={{ flex: 1 }}
          >
            <CategoryCard
              config={item}
              onPress={() => router.push(item.route as any)}
            />
          </Animated.View>
        )}
      />
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
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statCardOnline: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statCardOffline: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  statNumber: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
  },
  statNumberWhite: {
    color: Colors.white,
    fontSize: 15,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.textTertiary,
    marginTop: -2,
  },
  statLabelWhite: {
    color: "rgba(255,255,255,0.7)",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 14,
  },
  columnWrapper: {
    gap: 4,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  box: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 28,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.background,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: Colors.primary,
  },
  logoutButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
});

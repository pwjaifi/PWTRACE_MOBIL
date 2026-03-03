import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { LocalStorageService, type HistoryItem as SyncedHistoryItem, type PendingItem } from "@/services/LocalStorageService";

interface UnifiedHistoryItem {
  id: string;
  category: string;
  categoryKey: keyof typeof Colors.categoryColors;
  farm: string;
  serre: string;
  date: string;
  timestamp: number;
  icon: keyof typeof Ionicons.glyphMap;
  status: "online" | "offline";
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  virus: "bug-outline",
  auxiliaire: "leaf-outline",
  ravageurs: "warning-outline",
  irrigation: "water-outline",
  inspection: "clipboard-outline",
  compteur: "speedometer-outline",
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [history, setHistory] = React.useState<UnifiedHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadAllHistory = React.useCallback(async () => {
    setLoading(true);
    try {
      const pending = await LocalStorageService.getAllPending();
      const synced = await LocalStorageService.getSyncedHistory();

      const unified: UnifiedHistoryItem[] = [
        ...pending.map((p) => ({
          id: p.id,
          category: p.id.split("-")[0],
          categoryKey: p.id.split("-")[0] as any,
          farm: p.data.farmId || "Inconnu",
          serre: p.data.serreId || "-",
          date: new Date(p.savedAt).toLocaleString("fr-FR"),
          timestamp: new Date(p.savedAt).getTime(),
          icon: CATEGORY_ICONS[p.id.split("-")[0]] || "help-outline",
          status: "offline" as const,
        })),
        ...synced.map((s) => ({
          id: s.id,
          category: s.category,
          categoryKey: s.category as any,
          farm: s.data.farmId || "Inconnu",
          serre: s.data.serreId || "-",
          date: new Date(s.syncedAt).toLocaleString("fr-FR"),
          timestamp: new Date(s.syncedAt).getTime(),
          icon: CATEGORY_ICONS[s.category] || "help-outline",
          status: "online" as const,
        })),
      ].sort((a, b) => b.timestamp - a.timestamp);

      setHistory(unified);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadAllHistory();
    }, [loadAllHistory])
  );

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique</Text>
        <Text style={styles.headerSubtitle}>Flux d'activité en temps réel</Text>
      </View>

      <View style={styles.statsOverview}>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatVal}>{history.filter(h => h.status === "offline").length}</Text>
          <Text style={styles.miniStatLabel}>Offline</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatVal}>{history.filter(h => h.status === "online").length}</Text>
          <Text style={styles.miniStatLabel}>Online</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 40 },
        ]}
      >
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="documents-outline" size={60} color={Colors.border} />
            <Text style={styles.emptyText}>Aucune observation enregistrée</Text>
          </View>
        ) : (
          history.map((item) => {
            const colors = Colors.categoryColors[item.categoryKey] || { bg: "#eee", icon: "#999" };
            const isOnline = item.status === "online";

            return (
              <View key={item.id} style={styles.card}>
                <View style={[styles.cardIcon, { backgroundColor: colors.bg }]}>
                  <Ionicons name={item.icon} size={20} color={colors.icon} />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardCategory}>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: isOnline ? Colors.successLight : Colors.warningLight }]}>
                      <Ionicons
                        name={isOnline ? "cloud-done" : "phone-portrait-outline"}
                        size={12}
                        color={isOnline ? Colors.success : Colors.warning}
                      />
                      <Text style={[styles.statusText, { color: isOnline ? Colors.success : Colors.warning }]}>
                        {isOnline ? "Cloud" : "Device"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardFarm}>
                    Ferme: {item.farm} {item.serre !== "-" ? `· Serre: ${item.serre}` : ""}
                  </Text>
                  <Text style={styles.cardDate}>{item.date}</Text>
                </View>
              </View>
            );
          })
        )}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
  },
  statsOverview: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  miniStat: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  miniStatVal: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.primary,
  },
  miniStatLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: Colors.textTertiary,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardCategory: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    textTransform: "uppercase",
  },
  cardFarm: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
  },
  cardDate: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.textTertiary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.textTertiary,
    textAlign: "center",
  },
});

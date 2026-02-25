import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { LocalStorageService } from "@/services/LocalStorageService";
import { SyncService, type SyncResult } from "@/services/SyncService";
import type { ObservationCategory } from "@/models";

interface CategorySyncConfig {
  key: ObservationCategory;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: { bg: string; icon: string; dark: string };
  syncMethod: () => Promise<SyncResult>;
}

const SYNC_CATEGORIES: CategorySyncConfig[] = [
  {
    key: "virus",
    title: "Virus",
    icon: "bug-outline",
    colors: Colors.categoryColors.virus,
    syncMethod: SyncService.syncVirusObservations,
  },
  {
    key: "auxiliaire",
    title: "Auxiliaire",
    icon: "leaf-outline",
    colors: Colors.categoryColors.auxiliaire,
    syncMethod: SyncService.syncAuxiliaireObservations,
  },
  {
    key: "ravageurs",
    title: "Ravageurs",
    icon: "warning-outline",
    colors: Colors.categoryColors.ravageurs,
    syncMethod: SyncService.syncRavageursObservations,
  },
  {
    key: "irrigation",
    title: "Irrigation",
    icon: "water-outline",
    colors: Colors.categoryColors.irrigation,
    syncMethod: SyncService.syncIrrigationObservations,
  },
  {
    key: "inspection",
    title: "Inspection",
    icon: "clipboard-outline",
    colors: Colors.categoryColors.inspection,
    syncMethod: SyncService.syncInspectionObservations,
  },
  {
    key: "compteur",
    title: "Compteur",
    icon: "speedometer-outline",
    colors: Colors.categoryColors.compteur,
    syncMethod: SyncService.syncCompteurObservations,
  },
];

function SyncCategoryCard({
  config,
  count,
  onSync,
  syncing,
  lastResult,
}: {
  config: CategorySyncConfig;
  count: number;
  onSync: () => void;
  syncing: boolean;
  lastResult?: SyncResult;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.card, animStyle]}>
      <View style={styles.cardLeft}>
        <View style={[styles.cardIcon, { backgroundColor: config.colors.bg }]}>
          <Ionicons name={config.icon} size={22} color={config.colors.icon} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{config.title}</Text>
          <View style={styles.cardMeta}>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingCount}>{count}</Text>
              <Text style={styles.pendingLabel}>
                {count === 1 ? "observation" : "observations"}
              </Text>
            </View>
          </View>
          {lastResult ? (
            <View style={styles.resultRow}>
              {lastResult.synced > 0 ? (
                <View style={styles.resultChip}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                  <Text style={[styles.resultChipText, { color: Colors.success }]}>
                    {lastResult.synced} synchronisé(s)
                  </Text>
                </View>
              ) : null}
              {lastResult.failed > 0 ? (
                <View style={[styles.resultChip, styles.resultChipError]}>
                  <Ionicons name="close-circle" size={12} color={Colors.error} />
                  <Text style={[styles.resultChipText, { color: Colors.error }]}>
                    {lastResult.failed} échoué(s)
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>

      <Pressable
        style={[
          styles.syncBtn,
          { backgroundColor: config.colors.icon },
          syncing && styles.syncBtnDisabled,
        ]}
        onPress={onSync}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        disabled={syncing}
      >
        {syncing ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Ionicons name="cloud-upload-outline" size={18} color={Colors.white} />
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function SyncScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [counts, setCounts] = useState<Record<ObservationCategory, number>>({
    virus: 0,
    auxiliaire: 0,
    ravageurs: 0,
    irrigation: 0,
    inspection: 0,
    compteur: 0,
  });
  const [syncingCategory, setSyncingCategory] = useState<ObservationCategory | null>(null);
  const [lastResults, setLastResults] = useState<Partial<Record<ObservationCategory, SyncResult>>>({});
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const loadCounts = useCallback(async () => {
    const fresh = await LocalStorageService.getUnsyncedCounts();
    setCounts(fresh);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCounts();
    }, [loadCounts])
  );

  const totalPending = Object.values(counts).reduce((s, c) => s + c, 0);
  const categoriesWithPending = SYNC_CATEGORIES.filter(
    (c) => counts[c.key] > 0
  );

  async function handleSyncCategory(config: CategorySyncConfig) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSyncingCategory(config.key);
    try {
      const result = await config.syncMethod();
      setLastResults((prev) => ({ ...prev, [config.key]: result }));
      await loadCounts();
      if (result.failed > 0) {
        Alert.alert(
          "Synchronisation partielle",
          `${result.synced} élément(s) synchronisé(s), ${result.failed} ont échoué.`
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Erreur", "La synchronisation a échoué. Vérifiez votre connexion.");
    } finally {
      setSyncingCategory(null);
    }
  }

  async function handleSyncAll() {
    if (totalPending === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSyncingAll(true);
    try {
      const results = await SyncService.syncAll();
      setLastResults(results);
      await loadCounts();
      const totalSynced = Object.values(results).reduce((s, r) => s + r.synced, 0);
      const totalFailed = Object.values(results).reduce((s, r) => s + r.failed, 0);
      if (totalFailed > 0) {
        Alert.alert(
          "Synchronisation terminée",
          `${totalSynced} synchronisé(s), ${totalFailed} ont échoué.`
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Succès", `${totalSynced} observation(s) synchronisée(s) avec succès.`);
      }
    } catch {
      Alert.alert("Erreur", "La synchronisation globale a échoué.");
    } finally {
      setIsSyncingAll(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Synchronisation</Text>
          <Text style={styles.headerSubtitle}>
            {totalPending === 0
              ? "Tout est synchronisé"
              : `${totalPending} observation(s) en attente`}
          </Text>
        </View>
        <Pressable
          style={[
            styles.syncAllBtn,
            (totalPending === 0 || isSyncingAll) && styles.syncAllBtnDisabled,
          ]}
          onPress={handleSyncAll}
          disabled={totalPending === 0 || isSyncingAll}
        >
          {isSyncingAll ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="cloud-upload" size={18} color={Colors.white} />
          )}
          <Text style={styles.syncAllBtnText}>
            {isSyncingAll ? "Sync..." : "Tout syncer"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 100 },
        ]}
        onRefresh={loadCounts}
      >
        {categoriesWithPending.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.primaryLight} />
            </View>
            <Text style={styles.emptyTitle}>Tout est synchronisé</Text>
            <Text style={styles.emptyBody}>
              Toutes vos observations ont été envoyées au serveur. Ajoutez de
              nouvelles observations depuis le tableau de bord.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>EN ATTENTE DE SYNCHRONISATION</Text>
              <Text style={styles.sectionCount}>{categoriesWithPending.length} catégorie(s)</Text>
            </View>

            {categoriesWithPending.map((config) => (
              <SyncCategoryCard
                key={config.key}
                config={config}
                count={counts[config.key]}
                syncing={syncingCategory === config.key || isSyncingAll}
                lastResult={lastResults[config.key]}
                onSync={() => handleSyncCategory(config)}
              />
            ))}
          </>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            La synchronisation envoie les données locales vers le serveur. Une
            connexion internet est requise. Les données sont conservées
            localement jusqu'à la synchronisation réussie.
          </Text>
        </View>
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
  headerTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  syncAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  syncAllBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  syncAllBtnText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.textTertiary,
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    color: Colors.textTertiary,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pendingCount: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
    lineHeight: 24,
  },
  pendingLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textTertiary,
  },
  resultRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  resultChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  resultChipError: {
    backgroundColor: Colors.errorLight,
  },
  resultChipText: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  syncBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  syncBtnDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
  },
  emptyBody: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 290,
  },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});

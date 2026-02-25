import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

interface HistoryItem {
  id: string;
  category: string;
  categoryKey: keyof typeof Colors.categoryColors;
  farm: string;
  serre: string;
  date: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: "submitted" | "pending";
}

const DEMO_HISTORY: HistoryItem[] = [
  {
    id: "1",
    category: "Virus",
    categoryKey: "virus",
    farm: "Ferme Nord",
    serre: "Serre 2",
    date: "Aujourd'hui, 09:30",
    icon: "bug-outline",
    status: "submitted",
  },
  {
    id: "2",
    category: "Irrigation",
    categoryKey: "irrigation",
    farm: "Ferme Sud",
    serre: "Serre 6",
    date: "Aujourd'hui, 07:15",
    icon: "water-outline",
    status: "submitted",
  },
  {
    id: "3",
    category: "Ravageurs",
    categoryKey: "ravageurs",
    farm: "Ferme Nord",
    serre: "Serre 1",
    date: "Hier, 14:00",
    icon: "warning-outline",
    status: "submitted",
  },
  {
    id: "4",
    category: "Inspection",
    categoryKey: "inspection",
    farm: "Ferme Est",
    serre: "Serre 10",
    date: "Hier, 10:45",
    icon: "clipboard-outline",
    status: "submitted",
  },
  {
    id: "5",
    category: "Auxiliaire",
    categoryKey: "auxiliaire",
    farm: "Ferme Nord",
    serre: "Serre 3",
    date: "Il y a 2 jours",
    icon: "leaf-outline",
    status: "submitted",
  },
  {
    id: "6",
    category: "Compteur",
    categoryKey: "compteur",
    farm: "Ferme Sud",
    serre: "-",
    date: "Il y a 2 jours",
    icon: "speedometer-outline",
    status: "submitted",
  },
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique</Text>
        <Text style={styles.headerSubtitle}>Observations récentes</Text>
      </View>

      <View style={styles.infoBar}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.infoText}>
          L'historique complet sera disponible après intégration API
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 100 },
        ]}
      >
        <Text style={styles.sectionLabel}>AUJOURD'HUI</Text>

        {DEMO_HISTORY.map((item) => {
          const colors = Colors.categoryColors[item.categoryKey];
          return (
            <View key={item.id} style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: colors.bg }]}>
                <Ionicons name={item.icon} size={20} color={colors.icon} />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardCategory}>{item.category}</Text>
                  <View style={styles.statusBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={12}
                      color={Colors.success}
                    />
                    <Text style={styles.statusText}>Envoyé</Text>
                  </View>
                </View>
                <Text style={styles.cardFarm}>
                  {item.farm}
                  {item.serre !== "-" ? ` · ${item.serre}` : ""}
                </Text>
                <Text style={styles.cardDate}>{item.date}</Text>
              </View>
            </View>
          );
        })}

        <View style={styles.emptyHint}>
          <Ionicons name="cloud-upload-outline" size={36} color={Colors.border} />
          <Text style={styles.emptyHintTitle}>Synchronisation en attente</Text>
          <Text style={styles.emptyHintText}>
            Une fois l'API connectée, vos observations seront synchronisées
            automatiquement.
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.successLight,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 10,
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
    width: 46,
    height: 46,
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
    gap: 3,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    color: Colors.success,
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
    marginTop: 2,
  },
  emptyHint: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
    marginTop: 12,
  },
  emptyHintTitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.textSecondary,
  },
  emptyHintText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
});

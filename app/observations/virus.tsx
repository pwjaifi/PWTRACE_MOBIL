import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Pressable,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { FormSection } from "@/components/forms/FormSection";
import { FarmSecteurSerreSelect } from "@/components/forms/FarmSecteurSerreSelect";
import { FormDropdown } from "@/components/forms/FormDropdown";
import { FormMultiSelect } from "@/components/forms/FormMultiSelect";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { FormSubmitButton } from "@/components/forms/FormSubmitButton";
import { LocalStorageService } from "@/services/LocalStorageService";
import { useData } from "@/contexts/DataContext";
import { LINES } from "@/models";
import { ActivityIndicator, Pressable as RNPressable } from "react-native";
import { QRScannerModal } from "@/components/qr/QRScannerModal";
import type { SeverityLevel } from "@/models";

const SEVERITY_OPTIONS = [
  { id: "0", label: "0" },
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3", label: "3" },
];

const LINE_OPTIONS = LINES.map((l) => ({ id: l.id, label: l.name }));

export default function VirusScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [farmId, setFarmId] = useState("");
  const [secteurId, setSecteurId] = useState("");
  const [serreId, setSerreId] = useState("");
  const [numberOfPlants, setNumberOfPlants] = useState("");
  const [severity, setSeverity] = useState("");
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const { isPreloaded } = useData();

  const handleScanSuccess = ({ farmId, secteurId, serreId }: { farmId: string, secteurId: string, serreId: string }) => {
    setFarmId(farmId);
    setSecteurId(secteurId);
    setSerreId(serreId);
    setErrors(prev => ({ ...prev, farm: "", secteur: "", serre: "" }));
  };

  if (!isPreloaded) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary }}>
          Initialisation...
        </Text>
      </View>
    );
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!farmId) newErrors.farm = "Veuillez sélectionner une ferme";
    if (!secteurId) newErrors.secteur = "Veuillez sélectionner un secteur";
    if (!serreId) newErrors.serre = "Veuillez sélectionner une serre";
    if (!numberOfPlants || isNaN(Number(numberOfPlants)) || Number(numberOfPlants) < 1)
      newErrors.numberOfPlants = "Entrez un nombre valide de plantes";
    if (!severity) newErrors.severity = "Veuillez sélectionner une sévérité";
    if (selectedLines.length === 0)
      newErrors.lines = "Sélectionnez au moins une ligne";
    if (!description.trim())
      newErrors.description = "La description est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function resetForm() {
    setFarmId("");
    setSecteurId("");
    setSerreId("");
    setNumberOfPlants("");
    setSeverity("");
    setSelectedLines([]);
    setDescription("");
    setErrors({});
  }

  async function handleSubmit() {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      // Saves locally for offline-first sync
      await LocalStorageService.saveVirusObservation({
        farmId,
        secteurId,
        serreId,
        numberOfPlants: Number(numberOfPlants),
        severity: Number(severity) as SeverityLevel,
        selectedLines,
        description,
        imageUri: undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset form immediately
      resetForm();

      // Show in-app success modal
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", "Impossible de sauvegarder l'observation.", [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomPad + 24 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Success Confirmation Modal ──────────────────────────────────── */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowSuccess(false)}
      >
        <Pressable
          style={successStyles.overlay}
          onPress={() => setShowSuccess(false)}
        >
          <View style={successStyles.box}>
            <View style={successStyles.iconCircle}>
              <Ionicons name="checkmark-sharp" size={36} color={Colors.white} />
            </View>
            <Text style={successStyles.title}>Enregistré avec succès !</Text>
            <Text style={successStyles.subtitle}>
              L'observation a été sauvegardée localement.{"\n"}
              Synchronisez pour l'envoyer au serveur.
            </Text>
          </View>
        </Pressable>
      </Modal>
      <View style={styles.categoryBadge}>
        <View style={[styles.badgeDot, { backgroundColor: Colors.categoryColors.virus.icon }]} />
        <Text style={[styles.categoryLabel, { color: Colors.categoryColors.virus.icon }]}>
          Observation Virus
        </Text>
      </View>

      <Pressable
        style={styles.scanButton}
        onPress={() => setShowScanner(true)}
      >
        <Ionicons name="qr-code-outline" size={24} color={Colors.white} />
        <Text style={styles.scanButtonText}>Scanner le QR Code de la Serre</Text>
      </Pressable>

      <QRScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
      />

      <FormSection title="Localisation">
        <FarmSecteurSerreSelect
          farmId={farmId}
          secteurId={secteurId}
          serreId={serreId}
          onFarmChange={setFarmId}
          onSecteurChange={setSecteurId}
          onSerreChange={setSerreId}
          farmError={errors.farm}
          secteurError={errors.secteur}
          serreError={errors.serre}
          allowAllSerres
        />
      </FormSection>

      <FormSection title="Données d'observation">
        <FormTextInput
          label="Nombre de plantes affectées"
          required
          placeholder="Ex: 25"
          keyboardType="numeric"
          value={numberOfPlants}
          onChangeText={setNumberOfPlants}
          error={errors.numberOfPlants}
        />

        <FormDropdown
          label="Sévérité"
          required
          placeholder="Sélectionner le niveau de sévérité"
          options={SEVERITY_OPTIONS}
          value={severity}
          onChange={setSeverity}
          error={errors.severity}
        />

        <View style={styles.labelRow}>
          <Text style={styles.fieldLabel}>Lignes concernées *</Text>
          <Pressable
            onPress={() => setSelectedLines(LINES.map(l => l.id))}
            hitSlop={10}
          >
            <Text style={styles.selectAllText}>Tout sélectionner</Text>
          </Pressable>
        </View>
        <FormMultiSelect
          label=""
          required
          placeholder="Sélectionner les lignes"
          options={LINE_OPTIONS}
          values={selectedLines}
          onChange={setSelectedLines}
          error={errors.lines}
        />
      </FormSection>

      <FormSection title="Description">
        <FormTextInput
          label="Description"
          required
          placeholder="Décrivez les symptômes observés..."
          multiline
          value={description}
          onChangeText={setDescription}
          error={errors.description}
        />
      </FormSection>


      <FormSubmitButton
        label="Enregistrer localement"
        onPress={handleSubmit}
        loading={loading}
        icon="save-outline"
      />
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.text,
  },
  selectAllText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.categoryColors.virus.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryLabel: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 8,
  },
  scanButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
});

const successStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  box: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 14,
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 19,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

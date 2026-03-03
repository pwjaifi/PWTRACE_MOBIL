import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
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
import { FormRadioGroup } from "@/components/forms/FormRadioGroup";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { FormSubmitButton } from "@/components/forms/FormSubmitButton";
import { LocalStorageService } from "@/services/LocalStorageService";
import { ApiService } from "@/services/ApiService";
import { useData } from "@/contexts/DataContext";
import { LINES, type PopulationLevel } from "@/models";

const POPULATION_OPTIONS = [
  {
    id: "1",
    label: "Faible (1)",
    color: "#2ECC71", // Green
  },
  {
    id: "2",
    label: "Moyen (2)",
    color: "#F39C12", // Orange
  },
  {
    id: "3",
    label: "Élevé (3)",
    color: "#E74C3C", // Red
  },
];

const LINE_OPTIONS = LINES.map((l) => ({ id: l.id, label: l.name }));

export default function AuxiliaireScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [farmId, setFarmId] = useState("");
  const [secteurId, setSecteurId] = useState("");
  const [serreId, setSerreId] = useState("");
  const [typeObsId, setTypeObsId] = useState("");
  const [population, setPopulation] = useState("");
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { auxiliaireTypes, isPreloaded } = useData();
  const typeOptions = useMemo(() =>
    auxiliaireTypes.map((t: any) => ({
      id: t.id.toString(),
      label: t.name || t.nom || `Type #${t.id}`
    })),
    [auxiliaireTypes]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

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
    if (!typeObsId) newErrors.type = "Veuillez sélectionner un type d'observation";
    if (!population) newErrors.population = "Veuillez sélectionner un niveau de population";
    if (selectedLines.length === 0) newErrors.lines = "Veuillez sélectionner au moins une ligne";
    if (!description.trim()) newErrors.description = "La description est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function resetForm() {
    setFarmId("");
    setSecteurId("");
    setSerreId("");
    setTypeObsId("");
    setPopulation("");
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
      await LocalStorageService.saveAuxiliaireObservation({
        farmId,
        secteurId,
        serreId,
        typeObservationId: typeObsId,
        population: (population === "1" ? "low" : population === "2" ? "medium" : "high") as PopulationLevel,
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
      Alert.alert("Erreur", "Impossible de sauvegarder l'observation.", [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
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
        <View style={[styles.badgeDot, { backgroundColor: Colors.categoryColors.auxiliaire.icon }]} />
        <Text style={[styles.categoryLabel, { color: Colors.categoryColors.auxiliaire.icon }]}>
          Observation Auxiliaire
        </Text>
      </View>

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
        />
      </FormSection>

      <FormSection title="Type d'observation">
        <FormDropdown
          label="Type d'observation"
          required
          placeholder={isPreloaded ? "Sélectionner le type d'auxiliaire" : "Chargement des types..."}
          options={typeOptions}
          value={typeObsId}
          onChange={setTypeObsId}
          error={errors.type}
          disabled={!isPreloaded}
        />
      </FormSection>

      <FormSection title="Évaluation">
        <FormRadioGroup
          label="Niveau de population"
          required
          options={POPULATION_OPTIONS}
          value={population}
          onChange={setPopulation}
          error={errors.population}
          horizontal
        />

        <View style={styles.labelRow}>
          <Text style={styles.fieldLabel}>Lignes concernées *</Text>
          <Pressable
            onPress={() => {
              if (selectedLines.length === LINES.length) {
                setSelectedLines([]);
              } else {
                setSelectedLines(LINES.map((l) => l.id));
              }
            }}
            hitSlop={10}
          >
            <Text style={styles.selectAllText}>
              {selectedLines.length === LINES.length ? "Tout désélectionner" : "Tout sélectionner"}
            </Text>
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
          placeholder="Décrivez vos observations..."
          multiline
          value={description}
          onChangeText={setDescription}
          error={errors.description}
          maxLength={500}
          showCharacterCount
        />
      </FormSection>


      <FormSubmitButton
        label="Enregistrer localement"
        onPress={handleSubmit}
        loading={loading}
        icon="save-outline"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 20 },
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
    backgroundColor: Colors.categoryColors.auxiliaire.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  categoryLabel: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
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

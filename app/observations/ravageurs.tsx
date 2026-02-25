import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { FormSection } from "@/components/forms/FormSection";
import { FarmSecteurSerreSelect } from "@/components/forms/FarmSecteurSerreSelect";
import { FormDropdown } from "@/components/forms/FormDropdown";
import { FormMultiSelect } from "@/components/forms/FormMultiSelect";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { FormImagePicker } from "@/components/forms/FormImagePicker";
import { FormSubmitButton } from "@/components/forms/FormSubmitButton";
import { LocalStorageService } from "@/services/LocalStorageService";
import { getObservationTypesByCategory } from "@/services/mockData";
import { LINES } from "@/models";
import type { SeverityLevel } from "@/models";

const SEVERITY_OPTIONS = [
  { id: "0", label: "0 - Aucun" },
  { id: "1", label: "1 - Léger" },
  { id: "2", label: "2 - Modéré" },
  { id: "3", label: "3 - Sévère" },
];

const LINE_OPTIONS = LINES.map((l) => ({ id: l.id, label: l.name }));

export default function RavageursScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [farmId, setFarmId] = useState("");
  const [secteurId, setSecteurId] = useState("");
  const [serreId, setSerreId] = useState("");
  const [typeObsId, setTypeObsId] = useState("");
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const typeOptions = getObservationTypesByCategory("ravageurs").map((t) => ({
    id: t.id,
    label: t.name,
  }));

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!farmId) newErrors.farm = "Veuillez sélectionner une ferme";
    if (!secteurId) newErrors.secteur = "Veuillez sélectionner un secteur";
    if (!serreId) newErrors.serre = "Veuillez sélectionner une serre";
    if (!typeObsId) newErrors.type = "Veuillez sélectionner un type d'observation";
    if (selectedLines.length === 0) newErrors.lines = "Sélectionnez au moins une ligne";
    if (!severity) newErrors.severity = "Veuillez sélectionner une sévérité";
    if (!description.trim()) newErrors.description = "La description est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      // Saves locally for offline-first sync — use SyncService to send to backend
      await LocalStorageService.saveRavageursObservation({
        farmId,
        secteurId,
        serreId,
        typeObservationId: typeObsId,
        selectedLines,
        severity: Number(severity) as SeverityLevel,
        description,
        imageUri,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Enregistré localement",
        "L'observation a été sauvegardée. Synchronisez depuis l'onglet Sync pour l'envoyer au serveur.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Erreur", "Impossible de sauvegarder l'observation. Réessayez.");
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
      <View style={styles.categoryBadge}>
        <View style={[styles.badgeDot, { backgroundColor: Colors.categoryColors.ravageurs.icon }]} />
        <Text style={[styles.categoryLabel, { color: Colors.categoryColors.ravageurs.icon }]}>
          Observation Ravageurs
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
          label="Type de ravageur"
          required
          placeholder="Sélectionner le type de ravageur"
          options={typeOptions}
          value={typeObsId}
          onChange={setTypeObsId}
          error={errors.type}
        />
      </FormSection>

      <FormSection title="Évaluation">
        <FormMultiSelect
          label="Lignes concernées"
          required
          placeholder="Sélectionner les lignes"
          options={LINE_OPTIONS}
          values={selectedLines}
          onChange={setSelectedLines}
          error={errors.lines}
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
      </FormSection>

      <FormSection title="Description">
        <FormTextInput
          label="Description"
          required
          placeholder="Décrivez vos observations sur les ravageurs..."
          multiline
          value={description}
          onChangeText={setDescription}
          error={errors.description}
        />
      </FormSection>

      <FormSection title="Photo">
        <FormImagePicker
          label="Photo"
          value={imageUri}
          onChange={setImageUri}
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
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.categoryColors.ravageurs.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  categoryLabel: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
});

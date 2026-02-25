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
import { LINES } from "@/models";
import type { SeverityLevel } from "@/models";

const SEVERITY_OPTIONS = [
  { id: "0", label: "0 - Aucun" },
  { id: "1", label: "1 - Léger" },
  { id: "2", label: "2 - Modéré" },
  { id: "3", label: "3 - Sévère" },
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
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  async function handleSubmit() {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      // Saves locally for offline-first sync — use SyncService to send to backend
      await LocalStorageService.saveVirusObservation({
        farmId,
        secteurId,
        serreId,
        numberOfPlants: Number(numberOfPlants),
        severity: Number(severity) as SeverityLevel,
        selectedLines,
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", "Impossible de sauvegarder l'observation. Réessayez.");
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
      <View style={styles.categoryBadge}>
        <View style={[styles.badgeDot, { backgroundColor: Colors.categoryColors.virus.icon }]} />
        <Text style={[styles.categoryLabel, { color: Colors.categoryColors.virus.icon }]}>
          Observation Virus
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

        <FormMultiSelect
          label="Lignes concernées"
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

      <FormSection title="Photo">
        <FormImagePicker
          label="Photo (optionnel)"
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20,
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
});

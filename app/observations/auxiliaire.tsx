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
import { FormRadioGroup } from "@/components/forms/FormRadioGroup";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { FormImagePicker } from "@/components/forms/FormImagePicker";
import { FormSubmitButton } from "@/components/forms/FormSubmitButton";
import { LocalStorageService } from "@/services/LocalStorageService";
import { getObservationTypesByCategory } from "@/services/mockData";
import type { PopulationLevel } from "@/models";

const POPULATION_OPTIONS = [
  {
    id: "low",
    label: "Faible",
    description: "Population peu présente",
    color: Colors.categoryColors.auxiliaire.icon,
  },
  {
    id: "medium",
    label: "Moyen",
    description: "Présence modérée",
    color: Colors.categoryColors.auxiliaire.dark,
  },
  {
    id: "high",
    label: "Élevé",
    description: "Population importante",
    color: Colors.error,
  },
];

export default function AuxiliaireScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [farmId, setFarmId] = useState("");
  const [secteurId, setSecteurId] = useState("");
  const [serreId, setSerreId] = useState("");
  const [typeObsId, setTypeObsId] = useState("");
  const [population, setPopulation] = useState<PopulationLevel | "">("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const typeOptions = getObservationTypesByCategory("auxiliaire").map((t) => ({
    id: t.id,
    label: t.name,
  }));

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!farmId) newErrors.farm = "Veuillez sélectionner une ferme";
    if (!secteurId) newErrors.secteur = "Veuillez sélectionner un secteur";
    if (!serreId) newErrors.serre = "Veuillez sélectionner une serre";
    if (!typeObsId) newErrors.type = "Veuillez sélectionner un type d'observation";
    if (!population) newErrors.population = "Veuillez sélectionner un niveau de population";
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
      await LocalStorageService.saveAuxiliaireObservation({
        farmId,
        secteurId,
        serreId,
        typeObservationId: typeObsId,
        population: population as PopulationLevel,
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
          placeholder="Sélectionner le type d'auxiliaire"
          options={typeOptions}
          value={typeObsId}
          onChange={setTypeObsId}
          error={errors.type}
        />
      </FormSection>

      <FormSection title="Population">
        <FormRadioGroup
          label="Niveau de population"
          required
          options={POPULATION_OPTIONS}
          value={population}
          onChange={(v) => setPopulation(v as PopulationLevel)}
          error={errors.population}
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
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 20 },
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

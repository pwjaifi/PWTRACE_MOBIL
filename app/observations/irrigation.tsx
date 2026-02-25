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
import { FormMultiSelect } from "@/components/forms/FormMultiSelect";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { FormDateTimePicker } from "@/components/forms/FormDateTimePicker";
import { FormSubmitButton } from "@/components/forms/FormSubmitButton";
import { ApiService } from "@/services/ApiService";
import { LINES } from "@/models";

const LINE_OPTIONS = LINES.map((l) => ({ id: l.id, label: l.name }));

export default function IrrigationScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [farmId, setFarmId] = useState("");
  const [secteurId, setSecteurId] = useState("");
  const [serreId, setSerreId] = useState("");

  const [supplyVQV, setSupplyVQV] = useState("");
  const [supplyEC, setSupplyEC] = useState("");
  const [supplyPH, setSupplyPH] = useState("");
  const [drainageVQV, setDrainageVQV] = useState("");
  const [drainageEC, setDrainageEC] = useState("");
  const [drainagePH, setDrainagePH] = useState("");

  const [observationDateTime, setObservationDateTime] = useState(new Date());
  const [selectedLines, setSelectedLines] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateNumber(val: string, field: string, label: string, errors: Record<string, string>) {
    if (!val.trim() || isNaN(Number(val)) || Number(val) < 0)
      errors[field] = `${label} invalide`;
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!farmId) newErrors.farm = "Veuillez sélectionner une ferme";
    if (!secteurId) newErrors.secteur = "Veuillez sélectionner un secteur";
    if (!serreId) newErrors.serre = "Veuillez sélectionner une serre";
    validateNumber(supplyVQV, "supplyVQV", "Supply VQV", newErrors);
    validateNumber(supplyEC, "supplyEC", "Supply EC", newErrors);
    validateNumber(supplyPH, "supplyPH", "Supply PH", newErrors);
    validateNumber(drainageVQV, "drainageVQV", "Drainage VQV", newErrors);
    validateNumber(drainageEC, "drainageEC", "Drainage EC", newErrors);
    validateNumber(drainagePH, "drainagePH", "Drainage PH", newErrors);
    if (selectedLines.length === 0) newErrors.lines = "Sélectionnez au moins une ligne";
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
      // API integration point — calls ApiService.createIrrigationObservation
      await ApiService.createIrrigationObservation({
        farmId,
        secteurId,
        serreId,
        supplyVQV: Number(supplyVQV),
        supplyEC: Number(supplyEC),
        supplyPH: Number(supplyPH),
        drainageVQV: Number(drainageVQV),
        drainageEC: Number(drainageEC),
        drainagePH: Number(drainagePH),
        observationDateTime,
        selectedLines,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès", "Observation irrigation enregistrée.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Erreur", "Impossible d'enregistrer l'observation. Réessayez.");
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
        <View style={[styles.badgeDot, { backgroundColor: Colors.categoryColors.irrigation.icon }]} />
        <Text style={[styles.categoryLabel, { color: Colors.categoryColors.irrigation.icon }]}>
          Observation Irrigation
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

      <FormSection title="Supply (Apport)">
        <View style={styles.metricsRow}>
          <View style={styles.metricField}>
            <FormTextInput
              label="VQV"
              required
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={supplyVQV}
              onChangeText={setSupplyVQV}
              error={errors.supplyVQV}
              hint="L/plant"
            />
          </View>
          <View style={styles.metricField}>
            <FormTextInput
              label="EC"
              required
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={supplyEC}
              onChangeText={setSupplyEC}
              error={errors.supplyEC}
              hint="mS/cm"
            />
          </View>
          <View style={styles.metricField}>
            <FormTextInput
              label="PH"
              required
              placeholder="0.0"
              keyboardType="decimal-pad"
              value={supplyPH}
              onChangeText={setSupplyPH}
              error={errors.supplyPH}
            />
          </View>
        </View>
      </FormSection>

      <FormSection title="Drainage">
        <View style={styles.metricsRow}>
          <View style={styles.metricField}>
            <FormTextInput
              label="VQV"
              required
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={drainageVQV}
              onChangeText={setDrainageVQV}
              error={errors.drainageVQV}
              hint="L/plant"
            />
          </View>
          <View style={styles.metricField}>
            <FormTextInput
              label="EC"
              required
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={drainageEC}
              onChangeText={setDrainageEC}
              error={errors.drainageEC}
              hint="mS/cm"
            />
          </View>
          <View style={styles.metricField}>
            <FormTextInput
              label="PH"
              required
              placeholder="0.0"
              keyboardType="decimal-pad"
              value={drainagePH}
              onChangeText={setDrainagePH}
              error={errors.drainagePH}
            />
          </View>
        </View>
      </FormSection>

      <FormSection title="Planification">
        <FormDateTimePicker
          label="Date et heure d'observation"
          required
          value={observationDateTime}
          onChange={setObservationDateTime}
          mode="datetime"
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

      <FormSubmitButton
        label="Enregistrer l'observation"
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
    backgroundColor: Colors.categoryColors.irrigation.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  categoryLabel: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricField: {
    flex: 1,
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { FormSection } from "@/components/forms/FormSection";
import { FormDropdown } from "@/components/forms/FormDropdown";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { FormDateTimePicker } from "@/components/forms/FormDateTimePicker";
import { FormSubmitButton } from "@/components/forms/FormSubmitButton";
import { LocalStorageService } from "@/services/LocalStorageService";
import { MOCK_FARMS, getCompteursByFarmAndType } from "@/services/mockData";
import type { CompteurType } from "@/models";

export default function CompteurScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [compteurType, setCompteurType] = useState<CompteurType | "">("");
  const [farmId, setFarmId] = useState("");
  const [compteurId, setCompteurId] = useState("");
  const [dateTime, setDateTime] = useState(new Date());
  const [vCompteur, setVCompteur] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const farmOptions = MOCK_FARMS.map((f) => ({ id: f.id, label: f.name }));

  const compteurOptions =
    farmId && compteurType
      ? getCompteursByFarmAndType(farmId, compteurType as CompteurType).map(
          (c) => ({ id: c.id, label: c.name })
        )
      : [];

  function handleFarmChange(id: string) {
    setFarmId(id);
    setCompteurId("");
  }

  function handleTypeChange(type: CompteurType) {
    setCompteurType(type);
    setFarmId("");
    setCompteurId("");
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!compteurType) newErrors.type = "Veuillez sélectionner un type";
    if (!farmId) newErrors.farm = "Veuillez sélectionner une ferme";
    if (!compteurId) newErrors.compteur = "Veuillez sélectionner un compteur";
    if (!vCompteur || isNaN(Number(vCompteur)) || Number(vCompteur) < 0)
      newErrors.vCompteur = "Entrez une valeur valide";
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
      await LocalStorageService.saveCompteurObservation({
        compteurType: compteurType as CompteurType,
        farmId,
        compteurId,
        dateTime,
        vCompteur: Number(vCompteur),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Enregistré localement",
        "Le relevé a été sauvegardé. Synchronisez depuis l'onglet Sync pour l'envoyer au serveur.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Erreur", "Impossible de sauvegarder le relevé. Réessayez.");
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
        <View style={[styles.badgeDot, { backgroundColor: Colors.categoryColors.compteur.icon }]} />
        <Text style={[styles.categoryLabel, { color: Colors.categoryColors.compteur.icon }]}>
          Relevé Compteur
        </Text>
      </View>

      <FormSection title="Type de compteur">
        <View style={styles.typeSelector}>
          {(["IN", "OUT"] as CompteurType[]).map((type) => {
            const isSelected = compteurType === type;
            return (
              <Pressable
                key={type}
                style={[
                  styles.typeCard,
                  isSelected && styles.typeCardSelected,
                ]}
                onPress={() => handleTypeChange(type)}
              >
                <View
                  style={[
                    styles.typeIconWrap,
                    {
                      backgroundColor: isSelected
                        ? Colors.primary
                        : Colors.successLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeIconText,
                      { color: isSelected ? Colors.white : Colors.primary },
                    ]}
                  >
                    {type}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.typeLabel,
                    isSelected && styles.typeLabelSelected,
                  ]}
                >
                  {type === "IN" ? "Entrée" : "Sortie"}
                </Text>
                <Text style={styles.typeSubLabel}>
                  {type === "IN" ? "Apport d'eau" : "Drainage"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {errors.type ? <Text style={styles.errorText}>{errors.type}</Text> : null}
      </FormSection>

      <FormSection title="Ferme et compteur">
        <FormDropdown
          label="Ferme"
          required
          placeholder={
            compteurType
              ? "Sélectionner une ferme"
              : "Choisissez d'abord un type"
          }
          options={farmOptions}
          value={farmId}
          onChange={handleFarmChange}
          error={errors.farm}
          disabled={!compteurType}
        />

        {farmId && compteurOptions.length > 0 ? (
          <FormDropdown
            label="Compteur"
            required
            placeholder="Sélectionner un compteur"
            options={compteurOptions}
            value={compteurId}
            onChange={setCompteurId}
            error={errors.compteur}
          />
        ) : farmId && compteurOptions.length === 0 ? (
          <View style={styles.noCompteurBanner}>
            <Text style={styles.noCompteurText}>
              Aucun compteur {compteurType === "IN" ? "d'entrée" : "de sortie"} disponible pour cette ferme.
            </Text>
          </View>
        ) : null}
      </FormSection>

      <FormSection title="Relevé">
        <FormDateTimePicker
          label="Date et heure du relevé"
          required
          value={dateTime}
          onChange={setDateTime}
          mode="datetime"
        />

        <FormTextInput
          label="Valeur du compteur (V-Compteur)"
          required
          placeholder="Ex: 12345"
          keyboardType="decimal-pad"
          value={vCompteur}
          onChangeText={setVCompteur}
          error={errors.vCompteur}
          hint="Relevez la valeur affichée sur le compteur"
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
    backgroundColor: Colors.categoryColors.compteur.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  categoryLabel: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  typeCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.successLight,
  },
  typeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  typeIconText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  typeLabel: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
  },
  typeLabelSelected: {
    color: Colors.primary,
  },
  typeSubLabel: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.error,
    marginTop: 4,
  },
  noCompteurBanner: {
    backgroundColor: Colors.warningLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
  },
  noCompteurText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.warning,
  },
});

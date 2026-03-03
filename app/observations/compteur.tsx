import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Pressable,
  ActivityIndicator,
  Modal,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { FormSection } from "@/components/forms/FormSection";
import { FormDropdown } from "@/components/forms/FormDropdown";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { FormDateTimePicker } from "@/components/forms/FormDateTimePicker";
import { FormSubmitButton } from "@/components/forms/FormSubmitButton";
import { LocalStorageService } from "@/services/LocalStorageService";
import { ApiService } from "@/services/ApiService";
import { useData } from "@/contexts/DataContext";
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

  const { isPreloaded, farmsIn, farmsOut, compteurs } = useData();

  const farmOptions = useMemo(() => {
    const data = compteurType === "IN" ? farmsIn : farmsOut;
    return data.map((f: any) => ({ id: f.id.toString(), label: f.name }));
  }, [compteurType, farmsIn, farmsOut]);

  const compteurOptions = useMemo(() => {
    if (!farmId || !compteurType) return [];
    const list = compteurs[`${farmId}_${compteurType}`] || [];
    return list.map((c: any) => ({ id: c.id.toString(), label: c.name }));
  }, [farmId, compteurType, compteurs]);

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

  // Fetch Compteurs logic removed - now using useMemo with cached data from useData()

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

  function resetForm() {
    setCompteurType("");
    setFarmId("");
    setCompteurId("");
    setDateTime(new Date());
    setVCompteur("");
    setErrors({});
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

      // Reset form immediately so user can add another entry
      resetForm();

      // Show in-app success modal
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch {
      Alert.alert("Erreur", "Impossible de sauvegarder le relevé. Réessayez.", [{ text: "OK" }]);
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
              Le relevé compteur a été sauvegardé localement.{"\n"}
              Synchronisez pour l'envoyer au serveur.
            </Text>
          </View>
        </Pressable>
      </Modal>
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
        ) : farmId ? (
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

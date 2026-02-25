import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { Colors } from "@/constants/colors";
import { FormSection } from "@/components/forms/FormSection";
import { FormDropdown } from "@/components/forms/FormDropdown";
import { FormRadioGroup } from "@/components/forms/FormRadioGroup";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { FormMultiImagePicker } from "@/components/forms/FormImagePicker";
import { FormDateTimePicker } from "@/components/forms/FormDateTimePicker";
import { FormSubmitButton } from "@/components/forms/FormSubmitButton";
import { ApiService } from "@/services/ApiService";
import {
  ALL_SERRES,
  getSerreInfo,
  getObservationTypesByCategory,
  MOCK_CULTURES,
} from "@/services/mockData";
import type { InspectionObservationBlock, ObservationStatus } from "@/models";

const STATUS_OPTIONS = [
  {
    id: "todo",
    label: "À faire",
    description: "Action requise",
    color: Colors.warning,
  },
  {
    id: "normal",
    label: "Normal",
    description: "Situation normale",
    color: Colors.primary,
  },
  {
    id: "danger",
    label: "Danger",
    description: "Intervention urgente",
    color: Colors.error,
  },
];

const INSPECTION_CATEGORIES = [
  { id: "irrigation", label: "Irrigation" },
  { id: "virus", label: "Virus" },
  { id: "auxiliaire", label: "Auxiliaire" },
  { id: "ravageurs", label: "Ravageurs" },
];

function ObservationBlockItem({
  block,
  index,
  onUpdate,
  onRemove,
}: {
  block: InspectionObservationBlock;
  index: number;
  onUpdate: (block: InspectionObservationBlock) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const typeOptions = getObservationTypesByCategory(
    block.categoryId
  ).map((t) => ({ id: t.id, label: t.name }));

  return (
    <View style={blockStyles.container}>
      <Pressable
        style={blockStyles.header}
        onPress={() => setExpanded((e) => !e)}
      >
        <View style={blockStyles.headerLeft}>
          <View style={blockStyles.blockNumber}>
            <Text style={blockStyles.blockNumberText}>{index + 1}</Text>
          </View>
          <Text style={blockStyles.blockTitle}>
            {block.categoryId
              ? INSPECTION_CATEGORIES.find((c) => c.id === block.categoryId)
                  ?.label ?? "Observation"
              : `Bloc ${index + 1}`}
          </Text>
          {block.status ? (
            <View
              style={[
                blockStyles.statusPill,
                {
                  backgroundColor:
                    block.status === "danger"
                      ? Colors.errorLight
                      : block.status === "todo"
                      ? Colors.warningLight
                      : Colors.successLight,
                },
              ]}
            >
              <Text
                style={[
                  blockStyles.statusPillText,
                  {
                    color:
                      block.status === "danger"
                        ? Colors.error
                        : block.status === "todo"
                        ? Colors.warning
                        : Colors.primary,
                  },
                ]}
              >
                {block.status === "todo"
                  ? "À faire"
                  : block.status === "normal"
                  ? "Normal"
                  : "Danger"}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={blockStyles.headerRight}>
          <Pressable
            onPress={onRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
          </Pressable>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={Colors.textSecondary}
          />
        </View>
      </Pressable>

      {expanded ? (
        <View style={blockStyles.content}>
          <FormDropdown
            label="Catégorie"
            required
            placeholder="Sélectionner une catégorie"
            options={INSPECTION_CATEGORIES}
            value={block.categoryId}
            onChange={(v) =>
              onUpdate({ ...block, categoryId: v, typeObservationId: "" })
            }
          />

          <FormDropdown
            label="Type d'observation"
            required
            placeholder={
              block.categoryId
                ? "Sélectionner un type"
                : "Choisir une catégorie d'abord"
            }
            options={typeOptions}
            value={block.typeObservationId}
            onChange={(v) => onUpdate({ ...block, typeObservationId: v })}
            disabled={!block.categoryId}
          />

          <FormRadioGroup
            label="Statut"
            required
            options={STATUS_OPTIONS}
            value={block.status}
            onChange={(v) =>
              onUpdate({ ...block, status: v as ObservationStatus })
            }
            horizontal
          />

          <FormMultiImagePicker
            label="Photos"
            values={block.imageUris}
            onChange={(uris) => onUpdate({ ...block, imageUris: uris })}
            maxImages={4}
          />

          <FormTextInput
            label="Description"
            placeholder="Décrivez vos observations..."
            multiline
            value={block.description}
            onChangeText={(v) => onUpdate({ ...block, description: v })}
          />
        </View>
      ) : null}
    </View>
  );
}

const blockStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: "hidden",
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceSecondary,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  blockNumber: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  blockNumberText: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
  },
  blockTitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
    flex: 1,
  },
  statusPill: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  content: {
    padding: 14,
    gap: 14,
  },
});

export default function InspectionScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [observationDate, setObservationDate] = useState(new Date());
  const [serreId, setSerreId] = useState("");
  const [cultureId, setCultureId] = useState("");
  const [blocks, setBlocks] = useState<InspectionObservationBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const serreInfo = serreId ? getSerreInfo(serreId) : null;

  const serreOptions = ALL_SERRES.map((s) => ({ id: s.id, label: s.name }));
  const cultureOptions = MOCK_CULTURES.map((c) => ({ id: c.id, label: c.name }));

  function addBlock() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newBlock: InspectionObservationBlock = {
      id: Crypto.randomUUID(),
      categoryId: "",
      typeObservationId: "",
      status: "normal",
      imageUris: [],
      description: "",
    };
    setBlocks((prev) => [...prev, newBlock]);
  }

  function updateBlock(id: string, updated: InspectionObservationBlock) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)));
  }

  function removeBlock(id: string) {
    Alert.alert(
      "Supprimer le bloc",
      "Êtes-vous sûr de vouloir supprimer ce bloc d'observation ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () =>
            setBlocks((prev) => prev.filter((b) => b.id !== id)),
        },
      ]
    );
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!serreId) newErrors.serre = "Veuillez sélectionner une serre";
    if (!cultureId) newErrors.culture = "Veuillez sélectionner une culture";
    if (blocks.length === 0)
      newErrors.blocks = "Ajoutez au moins un bloc d'observation";
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
      // API integration point — calls ApiService.createInspectionObservation
      await ApiService.createInspectionObservation({
        observationDate,
        serreId,
        farmId: serreInfo?.farm?.id ?? "",
        secteurId: serreInfo?.secteur?.id ?? "",
        cultureId,
        observationBlocks: blocks,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès", "Inspection enregistrée.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Erreur", "Impossible d'enregistrer l'inspection. Réessayez.");
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
        <View style={[styles.badgeDot, { backgroundColor: Colors.categoryColors.inspection.icon }]} />
        <Text style={[styles.categoryLabel, { color: Colors.categoryColors.inspection.icon }]}>
          Inspection
        </Text>
      </View>

      <FormSection title="Informations générales">
        <FormDateTimePicker
          label="Date d'observation"
          required
          value={observationDate}
          onChange={setObservationDate}
          mode="date"
        />

        <FormDropdown
          label="Serre"
          required
          placeholder="Sélectionner une serre"
          options={serreOptions}
          value={serreId}
          onChange={setSerreId}
          error={errors.serre}
        />

        {serreId && serreInfo?.farm ? (
          <View style={styles.autoInfoRow}>
            <View style={styles.autoInfoItem}>
              <Text style={styles.autoInfoLabel}>Ferme</Text>
              <Text style={styles.autoInfoValue}>{serreInfo.farm.name}</Text>
            </View>
            <View style={styles.autoInfoDivider} />
            <View style={styles.autoInfoItem}>
              <Text style={styles.autoInfoLabel}>Secteur</Text>
              <Text style={styles.autoInfoValue}>{serreInfo.secteur?.name}</Text>
            </View>
          </View>
        ) : null}

        <FormDropdown
          label="Culture"
          required
          placeholder="Sélectionner la culture"
          options={cultureOptions}
          value={cultureId}
          onChange={setCultureId}
          error={errors.culture}
        />
      </FormSection>

      <View style={styles.blocksSection}>
        <View style={styles.blocksSectionHeader}>
          <Text style={styles.blocksSectionTitle}>BLOCS D'OBSERVATION</Text>
          <Text style={styles.blocksCount}>{blocks.length} bloc(s)</Text>
        </View>

        {errors.blocks ? (
          <Text style={styles.blocksError}>{errors.blocks}</Text>
        ) : null}

        {blocks.map((block, index) => (
          <ObservationBlockItem
            key={block.id}
            block={block}
            index={index}
            onUpdate={(updated) => updateBlock(block.id, updated)}
            onRemove={() => removeBlock(block.id)}
          />
        ))}

        <Pressable style={styles.addBlockBtn} onPress={addBlock}>
          <View style={styles.addBlockIcon}>
            <Ionicons name="add" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.addBlockText}>Ajouter un bloc d'observation</Text>
        </Pressable>
      </View>

      <FormSubmitButton
        label="Enregistrer l'inspection"
        onPress={handleSubmit}
        loading={loading}
        icon="save-outline"
        disabled={blocks.length === 0}
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
    backgroundColor: Colors.categoryColors.inspection.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  categoryLabel: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  autoInfoRow: {
    flexDirection: "row",
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  autoInfoItem: {
    flex: 1,
    gap: 3,
  },
  autoInfoDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  autoInfoLabel: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  autoInfoValue: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
  blocksSection: {
    gap: 12,
  },
  blocksSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  blocksSectionTitle: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  blocksCount: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: Colors.textTertiary,
  },
  blocksError: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.error,
  },
  addBlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 16,
  },
  addBlockIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  addBlockText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
});

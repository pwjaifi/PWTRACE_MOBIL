import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { QRScannerModal } from "@/components/qr/QRScannerModal";
import * as Crypto from "expo-crypto";
import { Colors } from "@/constants/colors";
import { FormSection } from "@/components/forms/FormSection";
import { FormDropdown } from "@/components/forms/FormDropdown";
import { FormRadioGroup } from "@/components/forms/FormRadioGroup";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { FormMultiImagePicker } from "@/components/forms/FormImagePicker";
import { FormDateTimePicker } from "@/components/forms/FormDateTimePicker";
import { FormSubmitButton } from "@/components/forms/FormSubmitButton";
import { LocalStorageService } from "@/services/LocalStorageService";
import { ApiService } from "@/services/ApiService";
import { useData } from "@/contexts/DataContext";
import {
} from "@/services/mockData";
import type { InspectionObservationBlock, ObservationStatus } from "@/models";

const STATUS_OPTIONS = [
  {
    id: "todo",
    label: "To Do",
    description: "Action requise",
    color: Colors.warning, // Orange
  },
  {
    id: "normal",
    label: "Normal",
    description: "Situation normale",
    color: Colors.success, // Green
  },
  {
    id: "danger",
    label: "Danger",
    description: "Intervention urgente",
    color: Colors.error, // Red
  },
];


/**
 * ISO-8601 week number calculation
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Custom Confirmation Modal for reliable deletion
function ConfirmModal({
  visible,
  onConfirm,
  onCancel,
  title,
  message,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={confirmModalStyles.overlay}>
        <View style={confirmModalStyles.modal}>
          <Text style={confirmModalStyles.title}>{title}</Text>
          <Text style={confirmModalStyles.message}>{message}</Text>
          <View style={confirmModalStyles.actions}>
            <Pressable
              style={[confirmModalStyles.btn, confirmModalStyles.btnCancel]}
              onPress={onCancel}
            >
              <Text style={confirmModalStyles.btnCancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[confirmModalStyles.btn, confirmModalStyles.btnDelete]}
              onPress={onConfirm}
            >
              <Text style={confirmModalStyles.btnDeleteText}>Supprimer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const confirmModalStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  modal: {
    width: "85%",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnCancelText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.textSecondary,
  },
  btnDelete: {
    backgroundColor: Colors.error,
  },
  btnDeleteText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
});

function ObservationBlockItem({
  block,
  index,
  onUpdate,
  onRemove,
  categories,
  observationTypesMap,
}: {
  block: InspectionObservationBlock;
  index: number;
  onUpdate: (block: InspectionObservationBlock) => void;
  onRemove: () => void;
  categories: { id: string; label: string }[];
  observationTypesMap: Record<string, any[]>;
}) {
  const [expanded, setExpanded] = useState(true);
  const typeOptions = useMemo(() => {
    const types = observationTypesMap[block.categoryId] || [];
    return types.map((t: any) => ({
      id: t.id.toString(),
      label: t.name || t.nom || `Type #${t.id}`
    }));
  }, [block.categoryId, observationTypesMap]);

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
              ? categories.find((c) => c.id.toString() === block.categoryId.toString())
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
                          : Colors.success,
                    borderColor:
                      block.status === "danger"
                        ? Colors.error
                        : block.status === "todo"
                          ? Colors.warning
                          : Colors.success,
                  },
                ]}
              >
                {block.status === "todo"
                  ? "To Do"
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
            options={categories}
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
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    textTransform: "uppercase",
  },
  content: {
    padding: 14,
    gap: 14,
  },
});

export default function InspectionScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { serres, cultures, categories, isPreloaded, getSerreInfo: getCachedSerreInfo, observationTypesMap } = useData();

  const [observationDate, setObservationDate] = useState(new Date());
  const [serreId, setSerreId] = useState("");
  const [cultureId, setCultureId] = useState("");
  const [blocks, setBlocks] = useState<InspectionObservationBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for delete modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);

  // State for success confirmation
  const [showSuccess, setShowSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleScanSuccess = useCallback(({ serreId }: { farmId: string, secteurId: string, serreId: string }) => {
    setSerreId(serreId);
    setErrors(prev => ({ ...prev, serre: "" }));
  }, []);

  const weekNumber = useMemo(() => getWeekNumber(observationDate), [observationDate]);

  const serreOptions = useMemo(() =>
    serres.map((s: any) => ({ id: s.id.toString(), label: s.nomSerre || s.nom || s.name })),
    [serres]
  );

  const cultureOptions = useMemo(() =>
    cultures.map((c: any) => ({ id: c.id.toString(), label: c.name })),
    [cultures]
  );

  const categoriesOptions = useMemo(() =>
    categories.map((c: any) => ({ id: c.id.toString(), label: c.name })),
    [categories]
  );

  const serreDetails = useMemo(() => getCachedSerreInfo(serreId), [serreId, getCachedSerreInfo]);

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

  function handleRemovePress(id: string) {
    setBlockToDelete(id);
    setDeleteModalVisible(true);
  }

  function confirmDelete() {
    if (blockToDelete) {
      setBlocks((prev) => prev.filter((b) => b.id !== blockToDelete));
      setDeleteModalVisible(false);
      setBlockToDelete(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!serreId) {
      newErrors.serre = "Veuillez sélectionner une serre";
    } else if (!serreDetails) {
      newErrors.serre = "Détails de la serre introuvables";
    }

    if (!cultureId) newErrors.culture = "Veuillez sélectionner une culture";

    if (blocks.length === 0) {
      newErrors.blocks = "Ajoutez au moins un bloc d'observation";
    } else {
      // Check if each block has required fields
      const incompleteBlock = blocks.some((b) => !b.categoryId || !b.typeObservationId);
      if (incompleteBlock) {
        newErrors.blocks = "Tous les blocs doivent avoir une catégorie et un type";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function resetForm() {
    setSerreId("");
    setCultureId("");
    setBlocks([]);
    setErrors({});
    setObservationDate(new Date());
  }

  async function handleSubmit() {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      // Saves locally for offline-first sync — use SyncService to send to backend
      await LocalStorageService.saveInspectionObservation({
        observationDate,
        weekNumber,
        serreId,
        farmId: serreDetails?.ferme?.id?.toString() ?? "",
        secteurId: serreDetails?.secteur?.id?.toString() ?? "",
        cultureId,
        observationBlocks: blocks,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset form immediately so user can add another entry
      resetForm();

      // Show in-app success modal
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch {
      Alert.alert("Erreur", "Impossible de sauvegarder l'inspection. Réessayez.", [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  }

  if (!isPreloaded) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary }}>
          Initialisation des données...
        </Text>
      </View>
    );
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
              L'inspection a été sauvegardée localement.{"\n"}
              Synchronisez pour l'envoyer au serveur.
            </Text>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.categoryBadge}>
        <View style={[styles.badgeDot, { backgroundColor: Colors.categoryColors.inspection.icon }]} />
        <Text style={[styles.categoryLabel, { color: Colors.categoryColors.inspection.icon }]}>
          Inspection
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

      <FormSection title="Informations générales">
        <View style={styles.dateAndWeekRow}>
          <View style={{ flex: 1 }}>
            <FormDateTimePicker
              label="Date d'observation"
              required
              value={observationDate}
              onChange={setObservationDate}
              mode="date"
            />
          </View>
          <View style={styles.weekDisplayBox}>
            <Text style={styles.weekLabel}>Semaine</Text>
            <Text style={styles.weekValue}>{weekNumber}</Text>
          </View>
        </View>

        <FormDropdown
          label="Serre"
          required
          placeholder="Sélectionner une serre"
          options={serreOptions}
          value={serreId}
          onChange={setSerreId}
          error={errors.serre}
        />

        {serreDetails ? (
          <View style={styles.autoInfoRow}>
            <View style={styles.autoInfoItem}>
              <Text style={styles.autoInfoLabel}>Ferme</Text>
              <Text style={styles.autoInfoValue}>{serreDetails.ferme.nom}</Text>
            </View>
            <View style={styles.autoInfoDivider} />
            <View style={styles.autoInfoItem}>
              <Text style={styles.autoInfoLabel}>Secteur</Text>
              <Text style={styles.autoInfoValue}>{serreDetails.secteur.nom}</Text>
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
            onRemove={() => handleRemovePress(block.id)}
            categories={categoriesOptions}
            observationTypesMap={observationTypesMap}
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
        label="Enregistrer localement"
        onPress={handleSubmit}
        loading={loading}
        icon="save-outline"
        disabled={blocks.length === 0}
      />

      <ConfirmModal
        visible={deleteModalVisible}
        title="Supprimer le bloc"
        message="Êtes-vous sûr de vouloir supprimer ce bloc d'observation ?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
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
  dateAndWeekRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-end",
  },
  weekDisplayBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    height: 56, // Align with typical input height
    marginBottom: 0,
  },
  weekLabel: {
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
    color: Colors.textTertiary,
    textTransform: "uppercase",
  },
  weekValue: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.primary,
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

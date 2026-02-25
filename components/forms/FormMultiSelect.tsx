import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface MultiSelectOption {
  id: string;
  label: string;
}

interface FormMultiSelectProps {
  label: string;
  required?: boolean;
  placeholder?: string;
  options: MultiSelectOption[];
  values: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

export function FormMultiSelect({
  label,
  required,
  placeholder = "Sélectionner...",
  options,
  values,
  onChange,
  error,
}: FormMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const selectedLabels = options
    .filter((o) => values.includes(o.id))
    .map((o) => o.label);

  function toggle(id: string) {
    if (values.includes(id)) {
      onChange(values.filter((v) => v !== id));
    } else {
      onChange([...values, id]);
    }
  }

  function selectAll() {
    if (values.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.id));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <Pressable
        style={[styles.trigger, error ? styles.triggerError : null]}
        onPress={() => setOpen(true)}
      >
        <Text
          style={[styles.triggerText, !values.length && styles.placeholder]}
          numberOfLines={2}
        >
          {values.length === 0
            ? placeholder
            : selectedLabels.join(", ")}
        </Text>
        <View style={styles.badge}>
          {values.length > 0 ? (
            <Text style={styles.badgeText}>{values.length}</Text>
          ) : null}
          <Ionicons
            name="chevron-down"
            size={16}
            color={Colors.textSecondary}
          />
        </View>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={selectAll} style={styles.selectAllBtn}>
                <Text style={styles.selectAllText}>
                  {values.length === options.length
                    ? "Désélectionner tout"
                    : "Tout sélectionner"}
                </Text>
              </Pressable>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = values.includes(item.id);
                return (
                  <Pressable
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                    ]}
                    onPress={() => toggle(item.id)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected ? (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={Colors.white}
                        />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />

            <Pressable
              style={styles.doneBtn}
              onPress={() => setOpen(false)}
            >
              <Text style={styles.doneBtnText}>
                Confirmer ({values.length} sélectionnés)
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.text,
  },
  required: { color: Colors.error },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 50,
  },
  triggerError: { borderColor: Colors.error },
  triggerText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  placeholder: { color: Colors.textTertiary },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    backgroundColor: Colors.primary,
    color: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    overflow: "hidden",
  },
  error: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.error,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: "75%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
  },
  selectAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  selectAllText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.primary,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: Colors.successLight,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
  },
  optionTextSelected: {
    fontFamily: "Poppins_500Medium",
    color: Colors.primary,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 12,
    alignItems: "center",
  },
  doneBtnText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
});

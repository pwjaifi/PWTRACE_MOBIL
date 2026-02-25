import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface DropdownOption {
  id: string;
  label: string;
  disabled?: boolean;
}

interface FormDropdownProps {
  label: string;
  required?: boolean;
  placeholder?: string;
  options: DropdownOption[];
  value?: string;
  onChange: (id: string) => void;
  error?: string;
  disabled?: boolean;
}

export function FormDropdown({
  label,
  required,
  placeholder = "Sélectionner...",
  options,
  value,
  onChange,
  error,
  disabled,
}: FormDropdownProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.id === value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <Pressable
        style={[
          styles.trigger,
          open && styles.triggerOpen,
          error ? styles.triggerError : null,
          disabled && styles.triggerDisabled,
        ]}
        onPress={() => !disabled && setOpen(true)}
      >
        <Text
          style={[
            styles.triggerText,
            !selected && styles.placeholder,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={disabled ? Colors.disabled : Colors.textSecondary}
        />
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              scrollEnabled={options.length > 6}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.option,
                    item.id === value && styles.optionSelected,
                    item.disabled && styles.optionDisabled,
                  ]}
                  onPress={() => {
                    if (!item.disabled) {
                      onChange(item.id);
                      setOpen(false);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.id === value && styles.optionTextSelected,
                      item.disabled && styles.optionTextDisabled,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.id === value ? (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  ) : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.text,
  },
  required: {
    color: Colors.error,
  },
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
  },
  triggerOpen: {
    borderColor: Colors.primary,
  },
  triggerError: {
    borderColor: Colors.error,
  },
  triggerDisabled: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.borderLight,
  },
  triggerText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  placeholder: {
    color: Colors.textTertiary,
  },
  disabledText: {
    color: Colors.disabledText,
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
    maxHeight: "70%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  optionSelected: {
    backgroundColor: Colors.successLight,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
  },
  optionTextSelected: {
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
  optionTextDisabled: {
    color: Colors.textTertiary,
  },
});

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

export interface RadioOption {
  id: string;
  label: string;
  description?: string;
  color?: string;
}

interface FormRadioGroupProps {
  label: string;
  required?: boolean;
  options: RadioOption[];
  value?: string;
  onChange: (id: string) => void;
  error?: string;
  horizontal?: boolean;
}

export function FormRadioGroup({
  label,
  required,
  options,
  value,
  onChange,
  error,
  horizontal,
}: FormRadioGroupProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <View style={[styles.options, horizontal && styles.optionsHorizontal]}>
        {options.map((option) => {
          const isSelected = option.id === value;
          const color = option.color ?? Colors.primary;
          return (
            <Pressable
              key={option.id}
              style={[
                styles.option,
                horizontal && styles.optionHorizontal,
                isSelected && [
                  styles.optionSelected,
                  { borderColor: color, backgroundColor: color + "15" },
                ],
              ]}
              onPress={() => onChange(option.id)}
            >
              <View
                style={[
                  styles.radio,
                  isSelected && { borderColor: color },
                ]}
              >
                {isSelected ? (
                  <View style={[styles.radioInner, { backgroundColor: color }]} />
                ) : null}
              </View>
              <View style={[styles.optionContent, horizontal && styles.optionContentHorizontal]}>
                <Text
                  style={[
                    styles.optionLabel,
                    horizontal && styles.optionLabelHorizontal,
                    isSelected && { color, fontFamily: "Poppins_600SemiBold" },
                  ]}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
                {option.description ? (
                  <Text
                    style={[
                      styles.optionDescription,
                      horizontal && styles.optionDescriptionHorizontal,
                    ]}
                    numberOfLines={1}
                  >
                    {option.description}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.text,
  },
  required: { color: Colors.error },
  options: {
    gap: 8,
  },
  optionsHorizontal: {
    flexDirection: "row",
    gap: 6,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  optionHorizontal: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 10,
    gap: 6,
  },
  optionSelected: {
    borderWidth: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionContent: { flex: 1 },
  optionContentHorizontal: {
    alignItems: "center",
    width: "100%",
  },
  optionLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.text,
  },
  optionLabelHorizontal: {
    fontSize: 13,
    textAlign: "center",
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textTertiary,
    marginTop: 1,
  },
  optionDescriptionHorizontal: {
    fontSize: 10,
    textAlign: "center",
  },
  error: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.error,
  },
});

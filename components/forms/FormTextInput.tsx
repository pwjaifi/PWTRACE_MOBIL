import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Pressable,
} from "react-native";
import { Colors } from "@/constants/colors";

interface FormTextInputProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  multiline?: boolean;
}

export function FormTextInput({
  label,
  required,
  error,
  hint,
  multiline,
  value,
  onChangeText,
  ...rest
}: FormTextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        placeholderTextColor={Colors.textTertiary}
        {...rest}
      />
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceSecondary,
  },
  inputError: {
    borderColor: Colors.error,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textTertiary,
  },
  error: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.error,
  },
});

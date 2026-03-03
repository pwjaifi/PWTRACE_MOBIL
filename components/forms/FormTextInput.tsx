import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

interface FormTextInputProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  multiline?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  showCharacterCount?: boolean;
}

export function FormTextInput({
  label,
  required,
  error,
  hint,
  multiline,
  leftIcon,
  value,
  onChangeText,
  showCharacterCount,
  maxLength,
  ...rest
}: FormTextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
        {showCharacterCount && maxLength && (
          <Text style={[styles.counter, (value?.length || 0) >= maxLength && styles.counterMax]}>
            {value?.length || 0} / {maxLength}
          </Text>
        )}
      </View>
      <View style={[
        styles.inputWrapper,
        focused && styles.inputFocused,
        error ? styles.inputError : null,
        multiline && styles.multilineWrapper,
      ]}>
        {leftIcon && (
          <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
            <Ionicons name={leftIcon} size={20} color={focused ? Colors.primary : Colors.textTertiary} />
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          placeholderTextColor={Colors.textTertiary}
          maxLength={maxLength}
          {...rest}
        />
      </View>
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.text,
  },
  required: {
    color: Colors.error,
  },
  counter: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.textTertiary,
  },
  counterMax: {
    color: Colors.error,
  },
  inputWrapper: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: "#E1E8EE",
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 56,
  },
  multilineWrapper: {
    alignItems: "flex-start",
  },
  iconContainer: {
    paddingHorizontal: 12,
    backgroundColor: "#FBFDFF",
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1.5,
    borderRightColor: "#E1E8EE",
  },
  iconContainerFocused: {
    borderRightColor: Colors.primary,
    backgroundColor: Colors.successLight,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "web" ? 14 : 12,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  inputFocused: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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

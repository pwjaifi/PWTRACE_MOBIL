import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

interface FormImagePickerProps {
  label: string;
  required?: boolean;
  value?: string;
  onChange: (uri: string | undefined) => void;
  error?: string;
}

export function FormImagePicker({
  label,
  required,
  value,
  onChange,
  error,
}: FormImagePickerProps) {
  const [permission, requestPermission] =
    ImagePicker.useMediaLibraryPermissions();

  async function handlePick() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Permission requise",
          "Veuillez autoriser l'accès à votre galerie photo."
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  }

  function handleRemove() {
    onChange(undefined);
  }

  function showOptions() {
    Alert.alert("Ajouter une photo", "Choisissez une source", [
      { text: "Galerie", onPress: handlePick },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      {value ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: value }} style={styles.preview} />
          <Pressable style={styles.removeBtn} onPress={handleRemove}>
            <Ionicons name="close-circle" size={24} color={Colors.white} />
          </Pressable>
          <Pressable style={styles.changeBtn} onPress={showOptions}>
            <Ionicons name="camera" size={14} color={Colors.white} />
            <Text style={styles.changeBtnText}>Changer</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.picker, error ? styles.pickerError : null]}
          onPress={showOptions}
        >
          <View style={styles.pickerIcon}>
            <Ionicons name="image-outline" size={28} color={Colors.primaryLight} />
          </View>
          <Text style={styles.pickerTitle}>Ajouter une photo</Text>
          <Text style={styles.pickerSubtitle}>
            Appuyez pour sélectionner depuis la galerie
          </Text>
        </Pressable>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

interface FormMultiImagePickerProps {
  label: string;
  required?: boolean;
  values: string[];
  onChange: (uris: string[]) => void;
  maxImages?: number;
  error?: string;
}

export function FormMultiImagePicker({
  label,
  required,
  values,
  onChange,
  maxImages = 4,
  error,
}: FormMultiImagePickerProps) {
  const [permission, requestPermission] =
    ImagePicker.useMediaLibraryPermissions();

  async function handlePick() {
    if (values.length >= maxImages) {
      Alert.alert(
        "Limite atteinte",
        `Maximum ${maxImages} photos autorisées.`
      );
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Permission requise",
          "Veuillez autoriser l'accès à votre galerie photo."
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onChange([...values, result.assets[0].uri]);
    }
  }

  function removeImage(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <Text style={styles.multiHint}>
        {values.length}/{maxImages} photos
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.multiRow}
      >
        {values.map((uri, index) => (
          <View key={index} style={styles.multiThumb}>
            <Image source={{ uri }} style={styles.multiThumbImg} />
            <Pressable
              style={styles.multiRemove}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={20} color={Colors.white} />
            </Pressable>
          </View>
        ))}

        {values.length < maxImages ? (
          <Pressable style={styles.multiAdd} onPress={handlePick}>
            <Ionicons name="add" size={28} color={Colors.primaryLight} />
          </Pressable>
        ) : null}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  picker: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    borderStyle: "dashed",
    paddingVertical: 24,
    alignItems: "center",
    gap: 6,
  },
  pickerError: { borderColor: Colors.error },
  pickerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerTitle: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.text,
  },
  pickerSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textTertiary,
  },
  previewContainer: {
    borderRadius: 12,
    overflow: "hidden",
    height: 180,
    position: "relative",
  },
  preview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },
  changeBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  changeBtnText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: Colors.white,
  },
  error: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.error,
  },
  multiHint: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textTertiary,
  },
  multiRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  multiThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: "visible",
    position: "relative",
  },
  multiThumbImg: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  multiRemove: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
  },
  multiAdd: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
});

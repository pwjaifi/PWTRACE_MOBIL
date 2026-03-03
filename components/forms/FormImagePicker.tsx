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
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

interface FormImagePickerProps {
  label: string;
  required?: boolean;
  value?: string;
  onChange: (uri: string | undefined) => void;
  error?: string;
}

/**
 * Compress and resize image to reduce file size before upload.
 * Max width: 800px, JPEG quality: 0.6
 */
async function compressImage(uri: string): Promise<string> {
  try {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulated.uri;
  } catch (e) {
    console.warn("[ImagePicker] Compression failed, using original:", e);
    return uri;
  }
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
      const compressed = await compressImage(result.assets[0].uri);
      onChange(compressed);
    }
  }

  async function handleCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "L'accès à la caméra est nécessaire.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const compressed = await compressImage(result.assets[0].uri);
      onChange(compressed);
    }
  }

  function handleRemove() {
    onChange(undefined);
  }

  function showOptions() {
    Alert.alert("Ajouter une photo", "Choisissez une source", [
      { text: "Prendre une photo", onPress: handleCamera },
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
      allowsEditing: false, // SKIP the confusing system screen
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const compressed = await compressImage(result.assets[0].uri);
      onChange([...values, compressed]);
    }
  }

  async function handleCamera() {
    if (values.length >= maxImages) {
      Alert.alert("Limite atteinte", `Maximum ${maxImages} photos.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "L'accès à la caméra est nécessaire.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false, // SKIP the confusing system screen
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const compressed = await compressImage(result.assets[0].uri);
      onChange([...values, compressed]);
    }
  }

  function showOptions() {
    if (values.length >= maxImages) {
      Alert.alert("Limite atteinte", `Maximum ${maxImages} photos.`);
      return;
    }
    Alert.alert("Ajouter une photo", "Choisissez une source", [
      { text: "Appareil photo", onPress: handleCamera },
      { text: "Galerie", onPress: handlePick },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  function removeImage(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.container}>
      <View style={styles.multiHeader}>
        <View>
          <Text style={styles.label}>
            {label}
            {required ? <Text style={styles.required}> *</Text> : null}
          </Text>
          <Text style={styles.multiHint}>
            {values.length}/{maxImages} photos
          </Text>
        </View>

        {values.length < maxImages && (
          <Pressable style={styles.headerAddBtn} onPress={showOptions}>
            <Ionicons name="camera-outline" size={18} color={Colors.primary} />
            <Text style={styles.headerAddBtnText}>Ajouter</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.multiRow}
      >
        {values.length === 0 ? (
          <Pressable style={styles.multiAddPlaceholder} onPress={showOptions}>
            <View style={styles.pickerIconRow}>
              <Ionicons name="camera" size={40} color={Colors.primary} />
              <Ionicons name="arrow-back-outline" size={24} color={Colors.primary} style={styles.arrowIcon} />
            </View>
            <Text style={styles.pickerTitle}>Prendre une photo</Text>
            <Text style={styles.pickerSubtitle}>Tapez ici pour commencer</Text>
          </Pressable>
        ) : (
          <>
            {values.map((uri, index) => (
              <View key={index} style={styles.multiThumb}>
                <Image source={{ uri }} style={styles.multiThumbImg} />
                <Pressable
                  style={styles.multiRemove}
                  onPress={() => removeImage(index)}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={16} color={Colors.white} />
                </Pressable>
              </View>
            ))}

            {values.length < maxImages && (
              <Pressable style={styles.multiAddSquare} onPress={showOptions}>
                <View style={styles.multiAddSquareIcon}>
                  <Ionicons name="camera-outline" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.multiAddSquareText}>Ajouter</Text>
              </Pressable>
            )}
          </>
        )}
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
  pickerIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  arrowIcon: {
    transform: [{ rotate: "180deg" }],
  },
  pickerTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
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
    marginTop: -4,
  },
  multiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  headerAddBtnText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
  multiRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 4,
    minHeight: 100,
  },
  multiThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  multiThumbImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  multiRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#DC3545", // Solid Vibrant Red
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  multiAddPlaceholder: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  multiAddSquare: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  multiAddSquareIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  multiAddSquareText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
});

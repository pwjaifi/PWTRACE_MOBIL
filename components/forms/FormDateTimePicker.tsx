import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FormDateTimePickerProps {
  label: string;
  required?: boolean;
  value: Date;
  onChange: (date: Date) => void;
  mode?: "date" | "datetime";
  error?: string;
}

function formatDate(date: Date, mode: "date" | "datetime" = "datetime"): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (mode === "date") return `${day}/${month}/${year}`;
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function FormDateTimePicker({
  label,
  required,
  value,
  onChange,
  mode = "datetime",
  error,
}: FormDateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const [tempYear, setTempYear] = useState(value.getFullYear());
  const [tempMonth, setTempMonth] = useState(value.getMonth());
  const [tempDay, setTempDay] = useState(value.getDate());
  const [tempHour, setTempHour] = useState(value.getHours());
  const [tempMinute, setTempMinute] = useState(value.getMinutes());

  function handleOpen() {
    setTempYear(value.getFullYear());
    setTempMonth(value.getMonth());
    setTempDay(value.getDate());
    setTempHour(value.getHours());
    setTempMinute(value.getMinutes());
    setOpen(true);
  }

  function handleConfirm() {
    const newDate = new Date(tempYear, tempMonth, tempDay, tempHour, tempMinute);
    onChange(newDate);
    setOpen(false);
  }

  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const days = Array.from(
    { length: getDaysInMonth(tempYear, tempMonth) },
    (_, i) => i + 1
  );
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <Pressable
        style={[styles.trigger, error ? styles.triggerError : null]}
        onPress={handleOpen}
      >
        <Ionicons
          name={mode === "date" ? "calendar-outline" : "time-outline"}
          size={18}
          color={Colors.primary}
        />
        <Text style={styles.triggerText}>{formatDate(value, mode)}</Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={handleConfirm}>
                <Text style={styles.confirmText}>Confirmer</Text>
              </Pressable>
            </View>

            <View style={styles.pickerRow}>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerColLabel}>Jour</Text>
                {days.map((d) => (
                  <Pressable
                    key={d}
                    style={[
                      styles.pickerItem,
                      d === tempDay && styles.pickerItemSelected,
                    ]}
                    onPress={() => setTempDay(d)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        d === tempDay && styles.pickerItemTextSelected,
                      ]}
                    >
                      {d.toString().padStart(2, "0")}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={[styles.pickerCol, { flex: 2 }]}>
                <Text style={styles.pickerColLabel}>Mois</Text>
                {months.map((m, idx) => (
                  <Pressable
                    key={m}
                    style={[
                      styles.pickerItem,
                      idx === tempMonth && styles.pickerItemSelected,
                    ]}
                    onPress={() => setTempMonth(idx)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        idx === tempMonth && styles.pickerItemTextSelected,
                      ]}
                    >
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.pickerCol}>
                <Text style={styles.pickerColLabel}>Année</Text>
                {years.map((y) => (
                  <Pressable
                    key={y}
                    style={[
                      styles.pickerItem,
                      y === tempYear && styles.pickerItemSelected,
                    ]}
                    onPress={() => setTempYear(y)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        y === tempYear && styles.pickerItemTextSelected,
                      ]}
                    >
                      {y}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {mode === "datetime" ? (
                <>
                  <View style={styles.pickerCol}>
                    <Text style={styles.pickerColLabel}>Heure</Text>
                    {hours.map((h) => (
                      <Pressable
                        key={h}
                        style={[
                          styles.pickerItem,
                          h === tempHour && styles.pickerItemSelected,
                        ]}
                        onPress={() => setTempHour(h)}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            h === tempHour && styles.pickerItemTextSelected,
                          ]}
                        >
                          {h.toString().padStart(2, "0")}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.pickerCol}>
                    <Text style={styles.pickerColLabel}>Min</Text>
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                      <Pressable
                        key={m}
                        style={[
                          styles.pickerItem,
                          Math.floor(tempMinute / 5) * 5 === m && styles.pickerItemSelected,
                        ]}
                        onPress={() => setTempMinute(m)}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            Math.floor(tempMinute / 5) * 5 === m &&
                              styles.pickerItemTextSelected,
                          ]}
                        >
                          {m.toString().padStart(2, "0")}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </View>
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
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  triggerError: { borderColor: Colors.error },
  triggerText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
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
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sheetTitle: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
  },
  confirmText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
  pickerRow: {
    flexDirection: "row",
    paddingVertical: 8,
    maxHeight: 300,
  },
  pickerCol: {
    flex: 1,
    alignItems: "center",
    overflow: "scroll",
  },
  pickerColLabel: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingVertical: 6,
  },
  pickerItem: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  pickerItemSelected: {
    backgroundColor: Colors.successLight,
  },
  pickerItemText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
  },
  pickerItemTextSelected: {
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
});

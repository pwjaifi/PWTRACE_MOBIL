import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    Modal,
    Pressable,
    Alert,
    Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { getSerreInfo } from "@/services/mockData";
import * as Haptics from "expo-haptics";

interface QRScannerModalProps {
    visible: boolean;
    onClose: () => void;
    onScanSuccess: (data: { farmId: string; secteurId: string; serreId: string }) => void;
}

export function QRScannerModal({ visible, onClose, onScanSuccess }: QRScannerModalProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (visible && !permission?.granted) {
            requestPermission();
        }
    }, [visible, permission]);

    useEffect(() => {
        if (visible) {
            setScanned(false);
        }
    }, [visible]);

    const handleBarcodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);

        let farmId = "";
        let secteurId = "";
        let serreId = "";

        try {
            // Try to parse the QR data as JSON
            const parsed = JSON.parse(data);

            // Handle the format: {"ferme_id":"1","secteur_id":"1","serre_ids":["7"]}
            if (parsed.ferme_id && parsed.secteur_id) {
                farmId = String(parsed.ferme_id);
                secteurId = String(parsed.secteur_id);
                // Take the first ID if serre_ids is an array
                serreId = Array.isArray(parsed.serre_ids) ? String(parsed.serre_ids[0]) : String(parsed.serre_ids || "");
            }
            // Handle simple format if needed: {"serreId": "1"}
            else if (parsed.serreId) {
                serreId = String(parsed.serreId);
            }
        } catch (e) {
            // Not JSON, assume data is just the Serre ID string
            serreId = data.trim();
        }

        // If we have a serreId but no farm/secteur, look them up in our data
        if (serreId && (!farmId || !secteurId)) {
            const info = getSerreInfo(serreId);
            if (info.serre && info.farm && info.secteur) {
                farmId = info.farm.id;
                secteurId = info.secteur.id;
                serreId = info.serre.id;
            }
        }

        if (farmId && secteurId && serreId) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onScanSuccess({ farmId, secteurId, serreId });
            onClose();
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                "Code non reconnu",
                `La serre "${serreId || data}" n'a pas été trouvée dans la base de données.`,
                [{ text: "Réessayer", onPress: () => setScanned(false) }]
            );
        }
    };

    if (!permission) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {!permission.granted ? (
                    <View style={styles.permissionContainer}>
                        <Ionicons name="camera-outline" size={64} color={Colors.primary} />
                        <Text style={styles.permissionText}>
                            Nous avons besoin de votre permission pour utiliser la caméra
                        </Text>
                        <Pressable style={styles.button} onPress={requestPermission}>
                            <Text style={styles.buttonText}>Autoriser la caméra</Text>
                        </Pressable>
                        <Pressable style={styles.closeBtn} onPress={onClose}>
                            <Text style={styles.closeBtnText}>Annuler</Text>
                        </Pressable>
                    </View>
                ) : (
                    <>
                        <CameraView
                            style={StyleSheet.absoluteFillObject}
                            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                            barcodeScannerSettings={{
                                barcodeTypes: ["qr", "ean13", "code128"],
                            }}
                        />

                        <View style={styles.overlay}>
                            <View style={styles.topBar}>
                                <Pressable onPress={onClose} style={styles.iconButton}>
                                    <Ionicons name="close" size={30} color="white" />
                                </Pressable>
                                <Text style={styles.title}>Scanner Serre</Text>
                                <View style={{ width: 44 }} />
                            </View>

                            <View style={styles.scannerZone}>
                                <View style={styles.cornerTopLeft} />
                                <View style={styles.cornerTopRight} />
                                <View style={styles.cornerBottomLeft} />
                                <View style={styles.cornerBottomRight} />
                            </View>

                            <View style={styles.bottomBar}>
                                <Text style={styles.hint}>
                                    Placez le QR code de la serre dans le cadre
                                </Text>
                            </View>
                        </View>
                    </>
                )}
            </View>
        </Modal>
    );
}

const { width } = Dimensions.get("window");
const scannerSize = width * 0.7;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    permissionContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: Colors.background,
    },
    permissionText: {
        fontSize: 16,
        fontFamily: "Poppins_500Medium",
        textAlign: "center",
        marginVertical: 20,
        color: Colors.text,
    },
    button: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
    },
    buttonText: {
        color: "white",
        fontFamily: "Poppins_600SemiBold",
        fontSize: 16,
    },
    closeBtn: {
        marginTop: 20,
    },
    closeBtnText: {
        color: Colors.textSecondary,
        fontFamily: "Poppins_400Regular",
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 50,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 20,
    },
    title: {
        color: "white",
        fontSize: 20,
        fontFamily: "Poppins_700Bold",
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    scannerZone: {
        width: scannerSize,
        height: scannerSize,
        position: "relative",
    },
    bottomBar: {
        paddingHorizontal: 40,
    },
    hint: {
        color: "white",
        textAlign: "center",
        fontFamily: "Poppins_500Medium",
        fontSize: 14,
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        overflow: "hidden",
    },
    cornerTopLeft: {
        position: "absolute",
        top: 0,
        left: 0,
        width: 40,
        height: 40,
        borderTopWidth: 5,
        borderLeftWidth: 5,
        borderColor: Colors.primary,
    },
    cornerTopRight: {
        position: "absolute",
        top: 0,
        right: 0,
        width: 40,
        height: 40,
        borderTopWidth: 5,
        borderRightWidth: 5,
        borderColor: Colors.primary,
    },
    cornerBottomLeft: {
        position: "absolute",
        bottom: 0,
        left: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 5,
        borderLeftWidth: 5,
        borderColor: Colors.primary,
    },
    cornerBottomRight: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 5,
        borderRightWidth: 5,
        borderColor: Colors.primary,
    },
});

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Colors } from "@/constants/colors";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ActivityIndicator, View, AppState, AppStateStatus } from "react-native";
import { NotificationService } from "@/services/NotificationService";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Retour",
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.primary,
        headerTitleStyle: {
          fontFamily: "Poppins_600SemiBold",
          fontSize: 16,
          color: Colors.text,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="observations/virus"
        options={{ title: "Observation Virus" }}
      />
      <Stack.Screen
        name="observations/auxiliaire"
        options={{ title: "Observation Auxiliaire" }}
      />
      <Stack.Screen
        name="observations/ravageurs"
        options={{ title: "Observation Ravageurs" }}
      />
      <Stack.Screen
        name="observations/irrigation"
        options={{ title: "Observation Irrigation" }}
      />
      <Stack.Screen
        name="observations/inspection"
        options={{ title: "Inspection" }}
      />
      <Stack.Screen
        name="observations/compteur"
        options={{ title: "Relevé Compteur" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Handle Notifications
  useEffect(() => {
    const setupNotifications = async () => {
      const granted = await NotificationService.setup();
      if (granted) {
        await NotificationService.schedule12hReminder();
      }
    };

    setupNotifications();

    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        // App came to foreground, reset the 12h timer
        NotificationService.schedule12hReminder();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DataProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </DataProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

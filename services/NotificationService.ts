import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when the app is open
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const NotificationService = {
    /**
     * Request permissions and setup Android channels
     */
    async setup() {
        if (Platform.OS === 'web') return false;

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#1A6B3C',
            });
        }

        return finalStatus === 'granted';
    },

    /**
     * Schedules a reminder for 12 hours from now.
     * Every time this is called, any existing reminder is replaced with a fresh 12h timer.
     */
    async schedule12hReminder() {
        if (Platform.OS === 'web') return;

        try {
            // 1. Cancel all existing scheduled notifications to reset the timer
            await Notifications.cancelAllScheduledNotificationsAsync();

            // 2. Schedule a new one for 12 hours (12 * 60 * 60 seconds)
            const seconds = 12 * 60 * 60;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Observations manquantes ?",
                    body: "Hey, je pense que vous avez oublié quelques observations aujourd'hui !",
                    data: { url: "/" },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: seconds,
                },
            });

            console.log(`[NotificationService] Reminder scheduled in ${seconds} seconds`);
        } catch (error) {
            console.warn("[NotificationService] Error scheduling notification:", error);
        }
    }
};

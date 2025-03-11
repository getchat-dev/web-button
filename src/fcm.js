import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

let _messaging;

const messaging = async (config) => {
    if(! _messaging) {

        if(! await isSupported()) {
            return null;
        }

        const app = getApps().length === 0 ? initializeApp(config) : getApp();

        _messaging = getMessaging(app);
    }

    return _messaging;
};

const fetchToken = async (config, vapidKey) => {
    try {
        const fcmMessaging = await messaging(config);

        if (fcmMessaging) {
            const token = await getToken(fcmMessaging, { vapidKey });
            return token;
        }

        return null;
    }
    catch (err) {
        console.error("An error occurred while fetching the token:", err);
        return null;
    }
};

class FcmTokenManager {

    #token = null;
    #fcmConfig = null;
    #vapidKey = null;
    #notificationPermissionStatus = null;
    #retryLoadToken = 0;
    #isLoading = false;

    constructor(fcmConfig, vapidKey) {
        if(! fcmConfig) {
            throw new Error("FCM config is required");
        }

        if(! vapidKey) {
            throw new Error("Vapid Key is required");
        }

        this.#fcmConfig = fcmConfig;
        this.#vapidKey = vapidKey;
    }

    /**
     * Retrieves the notification permission status and Firebase Cloud Messaging (FCM) token.
     *
     * @async
     * @function getNotificationPermissionAndToken
     * @param {boolean} [requestPermission=false] - If `true`, requests notification permission when the current state is `"default"` and the script runs in the top-level window.
     *
     * @returns {Promise<{ status: "granted" | "denied" | "default" | "unsupported", token: string | null }>}
     * - `status`: `"granted"` if notifications are allowed, `"denied"` if blocked, `"default"` if undecided, `"unsupported"` if the browser does not support notifications.
     * - `token`: The FCM token if available; otherwise, `null`.
     *
     * @description
     * This method determines the notification permission status and, if allowed, retrieves the FCM token. It:
     * - Checks if the browser supports notifications.
     * - Handles existing permission states (`"granted"`, `"denied"`, `"default"`).
     * - Optionally requests permission when running in the top-level window.
     * - Fetches the FCM token when permission is granted.
     *
     * @throws {Error} If an error occurs while fetching the FCM token (e.g., network issues or misconfiguration).
     *
     * @example
     * // Get the current permission status and token without requesting permission
     * const result = await instance.getNotificationPermissionAndToken();
     * console.log(result.status, result.token);
     *
     * @example
     * // Request permission if not already granted
     * const result = await instance.getNotificationPermissionAndToken(true);
     * console.log(result.status, result.token);
     */
    async getNotificationPermissionAndToken(requestPermission = false) {

        if (!("Notification" in window)) {
            console.error("This browser does not support desktop notification");
            return { status: "unsupported", token: null };
        }

        if (Notification.permission === "granted") {
            const _token = await fetchToken(this.#fcmConfig, this.#vapidKey);
            return { status: "granted", token: _token };
        }

        if (Notification.permission === "denied") {
            return { status: "denied", token: null };
        }

        // If permission is default and requestPermission is true
        if (requestPermission && window.top === window.self) {
            const permission = await Notification.requestPermission();

            if (permission === "granted") {
                const _token = await fetchToken(this.#fcmConfig, this.#vapidKey);
                return { status: "granted", token: _token };
            }

            if (permission === "denied") {
                return { status: "denied", token: null };
            }
        }

        return { status: "default", token: null };
    }

    async loadToken() {
        if (this.#isLoading) return;

        if(this.#token) {
            return this.#token;
        }

        this.#isLoading = true;

        let response;
        try {
            response = await this.getNotificationPermissionAndToken(true);
        }
        catch (err) {
            this.#isLoading = false;
            throw err;
        }

        if(response.status === 'granted' && response.token) {
            this.#token = response.token;
        }

        this.#notificationPermissionStatus = Notification.permission;
        this.#isLoading = false;

        return response;
    }
}

export default FcmTokenManager;
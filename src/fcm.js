import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, deleteToken } from "firebase/messaging";

let _messaging;

const messaging = async (config) => {
    if(! _messaging) {

        if(! await isSupported()) {
            return null;
        }

        const app = getApps().length === 0 ? initializeApp(config, 'getchat-button') : getApp();

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
    #debug = false;

    constructor(fcmConfig, vapidKey, debug = false) {
        if(! fcmConfig) {
            throw new Error("FCM config is required");
        }

        if(! vapidKey) {
            throw new Error("Vapid Key is required");
        }

        if(debug === true) {
            this.#debug = true;
        }

        this.#fcmConfig = fcmConfig;
        this.#vapidKey = vapidKey;
    }

    /**
     * Retrieves the current notification permission status from the browser.
     *
     * This async method checks if the browser supports the Notification API
     * and returns the current permission status. If Notifications are not
     * supported by the browser, it returns "unsupported" and logs an error
     * message when debug mode is enabled.
     *
     * @async
     * @returns {string} values:
     *   - "granted" - User has given permission to display notifications
     *   - "denied" - User has explicitly denied permission to display notifications
     *   - "default" - User has neither granted nor denied permission (treated as "denied")
     *   - "unsupported" - Browser does not support the Notification API
     *
     * @example
     * // Check current notification permission
     * const permissionStatus = instance.getNotificationPermission();
     * if (permissionStatus === "granted") {
     *   console.log('Notifications are allowed');
     * } else if (permissionStatus === "unsupported") {
     *   console.log('Notifications are not supported in this browser');
     * }
     */
    getNotificationPermission() {

        if (! ("Notification" in window)) {
            return "unsupported";
        }

        return Notification.permission;
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
            if (_token) {
                this.#token = _token;
            }

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
                if (_token) {
                    this.#token = _token;
                }

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

    /**
     * Deletes the FCM token from Firebase messaging service.
     *
     * This async method attempts to delete the current Firebase Cloud Messaging (FCM) token.
     * If successful, it clears the internal token reference and returns true.
     * If any errors occur during the deletion process or if no token exists,
     * it logs the error (when debug mode is enabled) and returns false.
     *
     * @async
     * @returns {Promise<boolean>} A promise that resolves to:
     *   - true if the token was successfully deleted
     *   - false if the token doesn't exist or if deletion failed
     * @throws {Error} Internally catches any errors during token deletion and returns false
     *
     * @example
     * // Delete the FCM token
     * const result = await instance.deleteToken();
     * if (result) {
     *   console.log('Token successfully deleted');
     * } else {
     *   console.log('Failed to delete token');
     * }
     */
    async deleteToken() {
        if(this.#token) {
            try {
                const fcmMessaging = await messaging(this.#fcmConfig);
                if(fcmMessaging) {
                    const status = await deleteToken(fcmMessaging);
                    if(status) {
                        this.#token = null;

                        return true;
                    }
                }
            }
            catch (err) {
                if(this.#debug) {
                    console.error("An error occurred while deleting the token:", err);
                }
            }
        }
        else {
            if(this.#debug) {
                console.error("Token is not set");
            }
        }

        return false;
    }
}

export default FcmTokenManager;
import { safeJSONParse, iframeRPC, singletonPromise } from '@/utils.js'
import { startObservViewport } from '@/viewportObserver';
import embedChat from '@/embedChat';
import onMessage from '@/onMessage';

import fcmManager from '@/fcm';

const FCM_TOKEN_STORAGE_KEY = '`getchat.webpush.fcm_token`';
const WEBPUSH_DISABLED_STORAGE_KEY = 'getchat.webpush.disabled';

export default class Chat {

    #chatNode;
    #chatNodeStyle = {}; // accepts only if $chatNode is passed and is valid
    #chatIframe;
    #chatUrl;

    #loadingState = 0; // there are 4 states: -1 - loading error, 0 - initial state, 1 - loading, 2 - loaded
    #loadingError;

    #onChatLoadedCallback;
    #onBeforeChatLoad;

    #readyPromise;

    #fcmManager;

    constructor({ id, url, node, nodeStyle, onBeforeChatLoad, onLoaded, handleKeyboardOnTouchDevices = true }) {

        if(! node) {
            throw new Error('node parameter is required');
        }
        // assume that if node is a string, it is a DOM selector
        if(typeof node === 'string') {
            node = document.querySelector(node);
        }

        if(!(node instanceof HTMLElement)) {
            throw new Error('node parameter must be an HTMLElement instance');
        }

        this.#chatNode = node;
        this.#chatNodeStyle = nodeStyle;

        if(! url && ! (node instanceof HTMLIFrameElement && node.src)) {
            throw new Error('url parameter is required or node parameter must be an iframe element with src attribute');
        }

        this.#chatUrl = url;

        if(typeof onBeforeChatLoad === 'function') {
            this.#onBeforeChatLoad = onBeforeChatLoad;
        }

        this.#onChatLoadedCallback = () => {
            this.#loadingState = 2;

            if (typeof onLoaded === 'function') {
                onLoaded(this.#chatIframe);
            }

            if(handleKeyboardOnTouchDevices === true) {
                startObservViewport(this.#chatNode);
            }

            this.#onChatLoadedCallback = null;
        }

        this.load = singletonPromise(this.#load.bind(this));

        {
            let resolve, reject;
            const promise = new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            });

            this.#readyPromise = { promise, resolve, reject };
        }
    }

    whenReady() {
        if (this.#readyPromise?.promise) {
            return this.#readyPromise.promise;
        }

        let status = false;
        if (this.#loadingState === 2) {
            status = true;
        }

        return Promise.resolve(status);
    }

    get loadingState() {
        return this.#loadingState;
    }

    isLoaded() {
        return this.#loadingState === 2;
    }

    addEventListener(event, listener) {
        this.whenReady().then(() => {
            if (this.#chatIframe) {
                onMessage(event, listener, this.#chatIframe);
            }
        });
    }

    getChatNode() {
        return this.#chatNode;
    }

    getChatIframeNode() {
        return this.#chatIframe;
    }

    async #load(timeout = 5000) {
        const promise = new Promise((resolve, reject) => {
            try {

                // if is loaded state
                if (this.#loadingState === 1) {
                    resolve();
                    return;
                }
                // if not initial state
                else if (this.#loadingState !== 0) {
                    reject(this.#loadingError ?? 'Chat cannot be loaded, current state: ' + this.#loadingState);
                }

                // set the state to loading
                this.#loadingState = 1;

                this.#chatIframe = embedChat(
                    this.#chatNode,
                    this.#chatUrl,
                    {
                        style: this.#chatNodeStyle,
                        onbeforeload: this.#onBeforeChatLoad,
                        onready: () => {
                            this.#onChatLoadedCallback();

                            this.#loadingState = 2;

                            this.#readyPromise?.resolve();
                            this.#readyPromise = null;
                        },
                        onerror: (e) => {
                            this.#loadingError = e;
                            this.#loadingState = -1; // -1 means error during loading

                            this.#readyPromise?.resolve();
                            this.#readyPromise = null;
                        }
                    }
                );
            }
            catch (e) {
                this.#loadingError = e;
                this.#loadingState = -1; // -2 means error during loading
                reject(e);
            }
        });

        return this.#readyPromise?.promise ?? promise;
    }

    rpc(method, params, timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (this.#loadingState !== 2) {
                reject(new Error('Chat is not loaded'));
                return;
            }

            if (!this.#chatIframe) {
                reject(new Error('Chat iframe is not loaded'));
                return;
            }

            let to;

            const rpcHandler = (e, data) => {
                clearTimeout(to);
                resolve(data?.data);

                return -1;
            }

            const uuid = iframeRPC(this.#chatIframe, method, params);
            if (uuid) {
                onMessage('response.' + uuid, rpcHandler, this.#chatIframe);
                if (timeout > 0) {
                    to = setTimeout(() => {
                        console.info('RPC Timeout', method, params);
                        reject('Timeout');
                    }, timeout);
                }
            }
        });
    }

    /**
     * Initializes web push notifications by retrieving Firebase Cloud Messaging (FCM) configuration and VAPID key.
     *
     * @async
     * @function initWebPushNotification
     * @param {Object} [options] - Optional parameters.
     * @param {Function} [options.onNotificationClicked] - Callback function to call when a user clicks on a notification and existing window is focused.
     *
     * @returns {Promise<{ status: "granted" | "denied" | "default" | "unsupported", token: string | null }>}
     * - `status`: `"granted"` if notifications are allowed, `"denied"` if blocked, `"default"` if undecided, `"unsupported"` if the browser does not support notifications.
     * - `token`: The FCM token if available; otherwise, `null`.
     *
     * @description
     * This method performs the following actions:
     * 1. Retrieves Firebase Cloud Messaging (FCM) configuration via RPC.
     * 2. Retrieves the VAPID (Voluntary Application Server Identification) key via RPC.
     * 3. Initializes the FCM manager with the retrieved configuration and key.
     * 4. Requests and processes notification permission status.
     * 5. If permission is `"default"`, sets up an event listener to handle future permission requests (`"getchat.webpush.request"`).
     * 6. If permission is `"granted"`, sets up an event listener for web push reset events (`"getchat.webpush.reset"`).
     * 7. Sends the permission status to the backend via RPC.
     *
     * @throws {Error}
     * - If fetching the FCM configuration fails.
     * - If retrieving the VAPID key fails.
     * - If there is an issue initializing the FCM manager.
     * - If an error occurs while processing notification permissions.
     *
     * @example
     * // Typical usage in a class method
     * try {
     *   const result = await this.initWebPushNotification();
     *   console.log('Permission status:', result.status);
     *   if (result.token) {
     *     console.log('FCM token retrieved:', result.token);
     *   }
     * } catch (error) {
     *   console.error('Failed to initialize web push notifications:', error);
     * }
     */
    async initWebPushNotification({onNotificationClicked = null} = {}) {
        // const module = await import('@/fcm.js');
        // if(! module) {
        //     throw new Error('Failed to load fcm.js');
        // }
        // if(! module.default) {
        //     throw new Error('fcm.js does not have default export');
        // }

        const { config: fcmConfig } = await this.rpc('getchat.messenger.getFCMConfig');
        if (!fcmConfig) {
            throw new Error('Failed to get FCM config');
        }

        const { vapidKey } = await this.rpc('getchat.messenger.getVapidKey');
        if (!vapidKey) {
            throw new Error('Failed to get Vapid Key');
        }

        // this.#fcmManager = module.default(fcmConfig, vapidKey);
        this.#fcmManager = new fcmManager(fcmConfig, vapidKey);
        const permission = localStorage.getItem(WEBPUSH_DISABLED_STORAGE_KEY) === 'true' ? { status: this.#fcmManager.getNotificationPermission(), token: null } : await this.#fcmManager.getNotificationPermissionAndToken();

        if(permission.token) {
            const { id: userId } = await this.rpc('getchat.messenger.actor.getId');
            const prevTokenData = safeJSONParse(localStorage.getItem(FCM_TOKEN_STORAGE_KEY));

            // this is the case when the token was changed, but, i faced with safari for macos and ios
            // here is github thread that some user faced when safari can change the token spontaneously
            // https://github.com/firebase/firebase-js-sdk/issues/8010
            // maybe it is a bug in safari https://bugs.webkit.org/show_bug.cgi?id=279277
            if(! prevTokenData || (prevTokenData?.token != permission.token && prevTokenData?.userId == userId)) {
                // we need to save new token to getchat
                if(await this.#putTokenToGetchat(permission.token)) {
                    localStorage.setItem(FCM_TOKEN_STORAGE_KEY, JSON.stringify({token: permission.token, userId}));
                }
            }
            // in case when the token wasn't changed but the user was changed
            else if(prevTokenData?.token == permission.token && prevTokenData?.userId !== userId) {
                if(await this.#fcmManager.deleteToken()) {
                    permission.token = null;
                    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
                }
            }
        }

        // let's know getchat about the permission status
        this.rpc('getchat.messenger.webpush.permission.set', permission);

        if (permission.status !== 'denied') {

            const requestPushNotificationsHandler = async (e, data) => {

                const response = {
                    status: false
                };

                try {
                    const permission = await this.requestNotificationPermission();
                    response.permission = permission;
                    if (permission !== false && permission?.status === 'granted' && permission?.token) {
                        response.status = true;
                    }
                }
                catch (e) {
                    response.error = e.message;
                }

                if (data?.cbId) {
                    iframeRPC(this.#chatIframe, 'response.' + data.cbId, {
                        type: 'response.' + data.cbId,
                        data: response
                    });
                }

                if (response.status) {
                    // it will unsubscribe the event listener
                    return -1;
                }
            }

            const disablePushNotificationsHandler = async (e, data) => {

                const response = {
                    status: true
                };

                try {
                    await this.disableNotifications();
                }
                catch (e) {
                    response.error = e.message;
                }

                if (data?.cbId) {
                    iframeRPC(this.#chatIframe, 'response.' + data.cbId, {
                        type: 'response.' + data.cbId,
                        data: response
                    });
                }

                if (response.status) {
                    return -1;
                }
            }

            this.addEventListener('getchat.webpush.request', requestPushNotificationsHandler);
            this.addEventListener('getchat.webpush.reset', disablePushNotificationsHandler);

            if(typeof onNotificationClicked === 'function') {
                console.info('onNotificationClicked was passed', onNotificationClicked);

                navigator.serviceWorker.addEventListener('message', (e) => {
                    if (e.data?.type === 'notification-clicked') {
                        console.info('notification-clicked AAAAA', e.data);
                        onNotificationClicked(e.data);
                    }
                });
            }
        }

        return permission;
    }

    async requestNotificationPermission(e) {

        if (!this.#fcmManager) {
            throw new Error('FCM manager is not initialized, call initWebPushNotification() first');
        }

        let response = await this.#fcmManager.loadToken();

        if (! (response.status === 'granted' && response.token)) {
            // just in case set the permission status to getchat
            this.rpc('getchat.messenger.webpush.permission.set', response);

            return response;
        }

        const { id: userId } = await this.rpc('getchat.messenger.actor.getId');
        const prevTokenData = safeJSONParse(localStorage.getItem(FCM_TOKEN_STORAGE_KEY));
        // in case when the token wasn't changed
        if(prevTokenData?.token == response.token) {
            // but the user was changed
            if(prevTokenData?.userId !== userId) {
                await this.#fcmManager.deleteToken();
                localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);

                response = await this.#fcmManager.loadToken();
            }
            // the user is the same
            else {
                this.rpc('getchat.messenger.webpush.permission.set', response);

                return response;
            }
        }

        this.rpc('getchat.messenger.webpush.permission.set', response);

        if (response.status === 'granted' && response.token) {

            localStorage.removeItem(WEBPUSH_DISABLED_STORAGE_KEY);

            if (await this.#putTokenToGetchat(response.token)) {
                localStorage.setItem(FCM_TOKEN_STORAGE_KEY, JSON.stringify({token: response.token, userId}));
                response.persisted = true;
            }
        }

        return response;
    }

    /**
     * Attempts to clear notification-related data
     * Note: This doesn't directly revoke permission, but can help reset the state
     */
    async disableNotifications() {
        if (! this.#fcmManager) {
            throw new Error('FCM manager is not initialized, call initWebPushNotification() first');
        }

        const status = await this.#fcmManager.deleteToken();

        if (status) {
            // update the permission status
            this.rpc('getchat.messenger.webpush.permission.set', {status: this.#fcmManager.getNotificationPermission(), token: null});
            localStorage.setItem(WEBPUSH_DISABLED_STORAGE_KEY, 'true');
            localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
        }

        return status;
    }

    async #putTokenToGetchat(token) {
        const { status } = await this.rpc('getchat.messenger.fcm_token.register', { token });

        return status ?? false;
    }
}
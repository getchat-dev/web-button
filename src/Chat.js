import { safeJSONParse, cssTransitionBasedAnimate, removeClassName, iframeRPC } from '@/utils.js'
import { startObservViewport, finishObservViewport } from '@/viewportObserver';
import embedChat from '@/embedChat';
import onMessage from '@/onMessage';
import escapeHandler from '@/escapeHandler';

import fcmManager from '@/fcm';

import styles from '@/outer.module.css';

const FCM_TOKEN_STORAGE_KEY = '`getchat.webpush.fcm_token`';
const WEBPUSH_DISABLED_STORAGE_KEY = 'getchat.webpush.disabled';

export default class Chat {

    #button;
    #chatNode;
    #chatIframe;
    #chatUrl;

    #closeOnEscape = true;

    #isChatLoaded = -1;
    #isChatOpened = false;
    #animationState = false;

    #onBeforeEmbedChat;
    #onChatLoadedCallback;

    #onBeforeOpen;
    #onAfterOpen;
    #onBeforeClose;
    #onAfterClose;

    #readyPromise;

    #fcmManager;
    #requestNotificationPermission;
    #unsibscribePushMessage;

    constructor({ id, url, button, closeOnEscape = true, autoload, autoopen = false, autoopenDelay, onBeforeEmbedChat, onChatLoaded, onBeforeOpen, onAfterOpen, onBeforeClose, onAfterClose }) {
        this.#chatUrl = url;
        this.#closeOnEscape = closeOnEscape;

        if (button instanceof Element) {
            this.#button = button;
        }

        if (typeof onBeforeEmbedChat !== 'function') {
            throw new Error('onBeforeEmbedChat parameter must be a function, ' + typeof onBeforeEmbedChat + ' given');
        }
        this.#onBeforeEmbedChat = onBeforeEmbedChat;

        let onload;
        if (autoopen) {
            if (autoopen !== 'once' || !window.localStorage.getItem(`getchat_opened`)) {
                onload =
                    !isNaN(autoopenDelay)
                        ? () => {
                            setTimeout(this.open, autoopenDelay * 1000);
                        }
                        : this.open
                    ;
            }
        }

        this.#onChatLoadedCallback = () => {
            this.#isChatLoaded = 1;
            onload && onload();

            if (typeof onChatLoaded === 'function') {
                onChatLoaded();
            }

            this.#onBeforeEmbedChat = null;
            this.#onChatLoadedCallback = null;
        }

        if (autoload) {
            this.load(false);
        }

        this.#onBeforeOpen = onBeforeOpen;
        this.#onAfterOpen = onAfterOpen;
        this.#onBeforeClose = onBeforeClose;
        this.#onAfterClose = onAfterClose;

        if (this.#button) {
            this.#button.addEventListener('click', () => {
                this.toggle();
            });
        }

        {
            let resolve, reject;
            const promise = new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            });

            this.#readyPromise = { promise, resolve, reject };

            if (this.#button) {
                promise.then(async () => {
                    const unreads = await this.rpc('getchat.messenger.getUnreads');
                    this.#button.setBadge(unreads?.total?.messages ?? 0);
                });
            }
        }
    }

    whenReady() {
        if (this.#readyPromise?.promise) {
            return this.#readyPromise.promise;
        }

        if (this.#isChatLoaded === 1) {
            return Promise.resolve();
        }

        return new Promise();
    }

    load(showLoader = true) {
        return new Promise((resolve, reject) => {
            try {
                if (this.#isChatLoaded > -1) {
                    resolve();
                    return;
                }

                this.#isChatLoaded = 0;

                const chatNode = this.#onBeforeEmbedChat();
                if (!(chatNode instanceof Element)) {
                    throw new Error('onBeforeEmbedChat must return an Element');
                }

                this.#chatNode = chatNode;

                if (showLoader) {
                    this.#button?.setState('loading');
                }

                this.#chatIframe = embedChat(chatNode, this.#chatUrl, {}, () => {
                    this.#onChatLoadedCallback();
                    this.#button?.setState('loaded');

                    this.#isChatLoaded = 1;

                    resolve();

                    this.#readyPromise?.resolve();
                    this.#readyPromise = null;
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }

    isLoaded() {
        return this.#isChatLoaded === 1;
    }

    isOpened() {
        return this.#isChatOpened;
    }

    toggle() {
        return new Promise(async (resolve, reject) => {

            if (this.#isChatLoaded === 0) {
                resolve();
                return;
            }

            if (this.#isChatOpened) {
                await this.close();
            }
            else {
                await this.open();
            }

            resolve();
        });
    }

    open = () => {
        return new Promise(async (resolve, reject) => {

            if (this.#isChatLoaded < 1) {
                await this.load();
            }

            if (this.#isChatOpened && !this.#animationState) {
                resolve();
                return;
            }

            try {
                this.#animationState = true;

                if (typeof (this.#onBeforeOpen) === 'function') {
                    await this.#onBeforeOpen();
                }

                if (this.#button) {
                    await cssTransitionBasedAnimate(
                        this.#button,
                        styles['button-animation-preclose'],
                        styles['button-animation-close'],
                    );
                }

                await cssTransitionBasedAnimate(
                    this.#chatNode,
                    styles['chat-animation-preopen'],
                    styles['chat-animation-opened']
                );

                if (typeof (this.#onAfterOpen) === 'function') {
                    await this.#onAfterOpen();
                }

                iframeRPC(this.#chatIframe, 'getchat.messenger.repaint');

                startObservViewport(this.#chatNode);

                this.#animationState = false;
                this.#isChatOpened = true;

                iframeRPC(this.#chatIframe, 'getchat.chat.input.focus');

                if (this.#closeOnEscape) {
                    escapeHandler.bind(this.close);
                }
            }
            catch (e) {
                reject(e);
            }

            resolve();
        });
    }

    close = () => {
        return new Promise(async (resolve, reject) => {

            if (!this.#isChatOpened && !this.#animationState) {
                resolve();
                return;
            }

            if (this.#closeOnEscape) {
                escapeHandler.unbind(this.close);
            }

            try {
                this.#animationState = true;

                finishObservViewport(this.#chatNode);

                if (typeof (this.#onBeforeClose) === 'function') {
                    await this.#onBeforeClose();
                }

                await cssTransitionBasedAnimate(
                    this.#chatNode,
                    styles['chat-animation-opened'],
                    styles['chat-animation-close']
                );

                removeClassName(this.#chatNode, styles['chat-animation-close']);
                removeClassName(this.#button, styles['button-animation-close']);

                if (this.#button) {
                    await cssTransitionBasedAnimate(
                        this.#button,
                        styles['button-animation-preopen'],
                        styles['button-animation-open'],
                    );
                }

                removeClassName(this.#button, styles['button-animation-open']);

                this.#animationState = true;
                this.#isChatOpened = false;

                if (typeof (this.#onAfterClose) === 'function') {
                    await this.#onAfterClose();
                }

                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
    }

    addEventListener(event, listener) {
        this.whenReady().then(() => {
            if (this.#chatIframe) {
                onMessage(event, listener, this.#chatIframe);
            }
        });
    }

    getButton() {
        return this.#button;
    }

    getChatNode() {
        return this.#chatNode;
    }

    getChatIframeNode() {
        return this.#chatIframe;
    }

    rpc(method, params, timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (this.#isChatLoaded < 1) {
                reject('Chat is not loaded');
                return;
            }

            if (!this.#chatIframe) {
                reject('Chat iframe is not loaded');
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
    async initWebPushNotification() {
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
            // in case when the token wasn't changed but the user was changed
            if(prevTokenData?.token == permission.token && prevTokenData?.userId !== userId) {
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

            if(permission.status === 'granted' && permission.token) {
                this.#activateOnPushMessage();
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

            const { status } = await this.rpc('getchat.messenger.fcm_token.register', { token: response.token });
            if (status === true) {
                localStorage.setItem(FCM_TOKEN_STORAGE_KEY, JSON.stringify({token: response.token, userId}));
                // just in case try to remove the old listener
                this.#deactivateOnPushMessage();
                this.#activateOnPushMessage();

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

        const response = await this.#fcmManager.deleteToken();
        if (response.status === true) {
            // update the permission status
            this.rpc('getchat.messenger.webpush.permission.set', {status: this.#fcmManager.getNotificationPermission(), token: null});
            localStorage.setItem(WEBPUSH_DISABLED_STORAGE_KEY, 'true');
            localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);

            this.#deactivateOnPushMessage();
        }

        return response;
    }

    async #activateOnPushMessage() {
        if (this.#fcmManager) {
            const unsubscribe = await this.#fcmManager.onMessage((payload) => {

                console.log(
                    "Received new foreground push message ",
                    payload
                );

                const link = payload.fcmOptions?.link || payload.data?.link;

                const notificationTitle = payload.data.title;
                const notificationOptions = {
                    body: payload.data.body,
                    icon: payload.data?.icon ?? null,
                    image: payload.data.image ?? null,
                    data: { url: link },
                };

                // show notification
                const notification = new Notification(notificationTitle, notificationOptions);
                notification.onclick = (event) => {
                    event.preventDefault(); // Prevent the browser from focusing the Notification's tab
                    if (link) {
                        window.open(link, '_blank');
                    }
                };

            });

            if(unsubscribe) {
                this.#unsibscribePushMessage = unsubscribe;
            }
        }
    }

    #deactivateOnPushMessage() {
        if (this.#unsibscribePushMessage) {
            this.#unsibscribePushMessage();
            this.#unsibscribePushMessage = null;
        }
    }
}
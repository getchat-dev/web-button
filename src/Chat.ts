import { safeJSONParse, iframeRPC, dedupePromise, promiseWithResolve, isPlainObject, isString } from '@/utils.js';
import { startObservViewport } from '@/viewportObserver';
import deviceDetector from '@/deviceDetector';
import embedChat from '@/embedChat';
import onMessage from '@/onMessage';

import type FcmManager from '@/fcm';
import type { createFaviconBadgeManager } from '@/faviconBadgeManager';
import type { createSharedWorker, CreatedSharedWorker } from '@/createSharedWorker';
import type { createTimerWorker, SharedWorkerTimer } from '@/createTimerWorker';
import type { UnreadSummary } from '@/types';

// @ts-ignore
import timerWorkerUrl from '@/timer-worker?sharedworker&no-inline';

async function loadFcm() {
    const module = await import('@/fcm');
    if (!module) throw new Error('Failed to load fcm.js');
    if (!module.default) throw new Error('fcm.js does not have default export');

    return module.default;
}

type BadgeManagerPackages = {
    createFaviconBadgeManager: typeof createFaviconBadgeManager;
    createSharedWorker?: typeof createSharedWorker;
    createTimerWorker?: typeof createTimerWorker;
    workerUrl?: string;
}

async function loadBadgeManagerPackages(): Promise<BadgeManagerPackages> {

    const faviconBadgeManagerModule = await import('@/faviconBadgeManager');
    if (!faviconBadgeManagerModule) throw new Error('Failed to load faviconBadgeManager.js');
    if (!faviconBadgeManagerModule.createFaviconBadgeManager) throw new Error('faviconBadgeManager.js does not have createFaviconBadgeManager export');

    const results: BadgeManagerPackages = {
        createFaviconBadgeManager: faviconBadgeManagerModule.createFaviconBadgeManager,
    };

    const createSharedWorkerModule = await import('@/createSharedWorker');
    if (!createSharedWorkerModule) console.error('Failed to load createSharedWorker.js');
    if (!createSharedWorkerModule.createSharedWorker) console.error('createSharedWorker.js does not have createSharedWorker export');

    const createTimerWorker = await import('@/createTimerWorker');
    if (!createTimerWorker) console.error('Failed to load createTimerWorker.js');
    if (!createTimerWorker.createTimerWorker) console.error('createTimerWorker.js does not have createTimerWorker export');

    results.createSharedWorker = createSharedWorkerModule.createSharedWorker;
    results.createTimerWorker = createTimerWorker.createTimerWorker;
    results.workerUrl = import.meta.resolve('./timer-worker.js');
    // results.workerUrl = timerWorkerUrl;

    return results;
}

import type {
    ChatOptions,
    InitWebPushNotificationsOptions,
    NotificationPermissionResult,
    Notification
} from './types';

import type { PromiseWithResolve } from '@/utils.js';

type ChatEventListenerHandler = (e: Event, data: Record<string, any>) => void;

const FCM_TOKEN_STORAGE_KEY = '`getchat.webpush.fcm_token`';
const WEBPUSH_DISABLED_STORAGE_KEY = 'getchat.webpush.disabled';

export default class Chat {
    #chatNode: HTMLElement;
    #chatNodeStyle: Record<string, string>;
    #chatIframe: HTMLIFrameElement | null = null;
    #chatUrl?: string;

    #loadingState: number = 0; // there are 4 states: -1 - loading error, 0 - initial state, 1 - loading, 2 - loaded
    #loadingError: unknown;

    #onChatLoadedCallback: (() => void) | null;
    #onBeforeChatLoad?: (iframe: HTMLIFrameElement) => void;

    #readyPromise: PromiseWithResolve<boolean> | null;

    #fcmManager?: InstanceType<typeof FcmManager>;
    #welcomeMessage?: Notification;

    load: () => Promise<boolean>;

    constructor({ id, url, node, nodeStyle, onBeforeLoad, onLoaded, handleKeyboardOnTouchDevices = true, showUnreadInBrowserTab = false }: ChatOptions) {
        if (!node) throw new Error('node parameter is required');

        if (typeof node === 'string') {
            const el: Nullable<HTMLElement> = document.querySelector(node) as Nullable<HTMLElement>;
            if (!(el instanceof HTMLElement)) {
                throw new Error(`No element found for selector: ${node}`);
            }
            node = el;
        }

        if (!(node instanceof HTMLElement)) {
            throw new Error('node parameter must be an HTMLElement instance');
        }

        this.#chatNode = node;
        this.#chatNodeStyle = nodeStyle || {};

        if (!url && !(node instanceof HTMLIFrameElement && node.src)) {
            throw new Error('url parameter is required or node parameter must be an iframe element with src attribute');
        }

        this.#chatUrl = url;

        if (typeof onBeforeLoad === 'function') {
            this.#onBeforeChatLoad = onBeforeLoad;
        }

        this.#onChatLoadedCallback = async() => {
            this.#loadingState = 2;
            if (typeof onLoaded === 'function') {
                onLoaded(this.#chatIframe);
            }

            if (handleKeyboardOnTouchDevices === true) {
                startObservViewport(this.#chatNode);
            }

            if (showUnreadInBrowserTab === true && deviceDetector().isDesktop === true) {
                const { createFaviconBadgeManager, createSharedWorker, createTimerWorker, workerUrl } = await loadBadgeManagerPackages();
                let worker: Nullable<CreatedSharedWorker> = null;
                let timer: SharedWorkerTimer | Window = window;

                if(createSharedWorker && createTimerWorker && workerUrl) {
                    try {
                        worker = await createSharedWorker(workerUrl, {name: 'sync-timer-worker', type: 'module'});
                        if(worker) {
                            timer = createTimerWorker(worker);
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                }

                // const { setBadge, clean } = createFaviconBadgeManager({ type: 'fill', animation: 'blink', borderRadius: 8 });
                const { setBadge, clean } = createFaviconBadgeManager({ borderRadius: 8 }, timer);

                this.rpc('getchat.messenger.getUnreads').then((result: UnreadSummary) => {
                    if(result?.total?.messages > 0) {
                        setBadge(result?.total?.chats);
                    }
                });
            }

            this.#onChatLoadedCallback = null;
        };

        this.load = dedupePromise(this.#load.bind(this), true);

        this.#readyPromise = promiseWithResolve<boolean>();
    }

    whenReady(): Promise<boolean> {
        if (this.#readyPromise?.promise) {
            return this.#readyPromise.promise;
        }

        let status: boolean = false;
        if (this.#loadingState === 2) {
            status = true;
        }

        return Promise.resolve(status);
    }

    get loadingState(): number {
        return this.#loadingState;
    }

    isLoaded(): boolean {
        return this.#loadingState === 2;
    }

    addEventListener(event: string, listener: ChatEventListenerHandler): void {
        this.whenReady().then(() => {
            if (this.#chatIframe) {
                onMessage(event, listener, this.#chatIframe);
            }
        });
    }

    getChatNode(): HTMLElement {
        return this.#chatNode;
    }

    getChatIframeNode(): HTMLIFrameElement | null {
        return this.#chatIframe;
    }

    async #load(timeout: number = 5000): Promise<boolean> {
        return new Promise((resolve, reject) => {
            switch(this.#loadingState) {
                case -1:
                    return reject(this.#loadingError ?? new Error('Chat cannot be loaded, current state: -1'));
                case 1:
                    return this.whenReady();
                case 2:
                    resolve(true);
            }

            this.#loadingState = 1;

            const onError = (e: any): void => {
                if( e instanceof Error) {
                    this.#loadingError = e;
                }

                this.#loadingState = -1;

                this.#readyPromise?.reject(e);
                this.#readyPromise = null;

                reject(e);
            };

            try {
                this.#chatIframe = embedChat(
                    this.#chatNode,
                    this.#chatUrl!,
                    {
                        style: this.#chatNodeStyle,
                        onbeforeload: this.#onBeforeChatLoad,
                        onready: () => {
                            this.#onChatLoadedCallback?.();

                            this.#readyPromise?.resolve(true);
                            this.#readyPromise = null;

                            resolve(true);
                        },
                        onerror: onError,
                    }
                );
            }
            catch (e) {
                onError(e);
            }
        });
    }

    rpc<T = any>(method: string, params?: Record<string, any>, timeout: number = 5000): Promise<T> {
        return new Promise((resolve, reject) => {

            const execute = (): void => {
                let to: number | undefined;

                const uuid: Nullable<string> = iframeRPC(this.#chatIframe!, method, params);
                if (uuid) {
                    onMessage('response.' + uuid, (e: any, data: any) => {
                        clearTimeout(to);
                        resolve(data?.data);
                        return -1; // to unsubscribe the listener
                    }, this.#chatIframe);

                    if (timeout > 0) {
                        to = window.setTimeout(() => reject(`RPC ${method} Timeout exceeded`), timeout);
                    }
                }
            };

            // chat loaded state
            if( this.#loadingState === 2 && this.#chatIframe) {
                execute();
            }
            // any case but not error state
            else if (this.#loadingState !== -1) {
                this.whenReady().then(() => {
                    if (this.#chatIframe) {
                        execute();
                    }
                    else {
                        reject(new Error('Chat is loaded, but iframe is not available'));
                    }
                }).catch(reject);
            }
            // error state
            else {
                reject(this.#loadingError ?? new Error('Chat cannot be loaded, current state: -1'));
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
    async initWebPushNotification(options: InitWebPushNotificationsOptions = {}): Promise<NotificationPermissionResult> {

        const { onNotificationClicked, iosStandalonePWALink, welcomeMessage } = options;

        if (isPlainObject(welcomeMessage)) {
            this.#welcomeMessage = welcomeMessage;
        }

        const { config: fcmConfig } = await this.rpc('getchat.messenger.getFCMConfig');
        if (!fcmConfig) {
            throw new Error('FCM config is not available, cannot initialize web push notifications');
        }

        const { vapidKey } = await this.rpc('getchat.messenger.getVapidKey');
        if (!vapidKey) {
            throw new Error('FCM Vapid Key is not available, cannot initialize web push notifications');
        }

        // this.#fcmManager = new FcmManager(fcmConfig, vapidKey);
        this.#fcmManager = new (await loadFcm())(fcmConfig, vapidKey, true) as InstanceType<typeof FcmManager>;

        let permission: NotificationPermissionResult = localStorage.getItem(WEBPUSH_DISABLED_STORAGE_KEY) === 'true'
            ? { status: this.#fcmManager.getNotificationPermission(), token: null }
            : await this.#fcmManager.getNotificationPermissionAndToken();

        if (permission.token) {
            const { id: userId } = await this.rpc('getchat.messenger.actor.getId');
            const prevTokenData = safeJSONParse(localStorage.getItem(FCM_TOKEN_STORAGE_KEY));

            // this is the case when the token was changed, but, i faced with safari for macos and ios
            // here is github thread that some user faced when safari can change the token spontaneously
            // https://github.com/firebase/firebase-js-sdk/issues/8010
            // maybe it is a bug in safari https://bugs.webkit.org/show_bug.cgi?id=279277
            if (! prevTokenData || (prevTokenData?.token !== permission.token && prevTokenData?.userId === userId)) {
                // we need to save new token to getchat
                if (await this.#putTokenToGetchat(permission.token, this.#welcomeMessage ? { welcomeMessage: this.#welcomeMessage } : undefined)) {
                    localStorage.setItem(FCM_TOKEN_STORAGE_KEY, JSON.stringify({ token: permission.token, userId }));
                }
            }
            // in case when the token wasn't changed but the user was changed
            else if (prevTokenData?.token === permission.token && prevTokenData?.userId !== userId) {
                if (await this.#fcmManager.deleteToken()) {
                    permission.token = null;
                    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
                }
            }
        }

        // let's know getchat about the permission status
        await this.rpc('getchat.messenger.webpush.permission.set', permission);

        if (isString(iosStandalonePWALink, true)) {
            try {
                await this.rpc('getchat.messenger.webpush.ios-pwa-link.set', { link: iosStandalonePWALink });
            }
            catch (e: any) {
                console.warn('Failed to set ios PWA link:', e.message);
            }
        }

        if (permission.status !== 'denied') {
            this.addEventListener('getchat.webpush.request', async (_e, data) => {
                const response: any = { status: false };
                try {
                    const p = await this.requestNotificationPermission();
                    response.permission = p;
                    if (p?.status === 'granted' && p?.token) response.status = true;
                } catch (e: any) {
                    response.error = e.message;
                }
                if (data?.cbId) {
                    iframeRPC(this.#chatIframe!, 'response.' + data.cbId, { type: 'response.' + data.cbId, data: response });
                }
                return response.status ? -1 : undefined;
            });

            this.addEventListener('getchat.webpush.reset', async (_e, data) => {
                const response: any = { status: true };
                try {
                    await this.disableNotifications();
                } catch (e: any) {
                    response.error = e.message;
                }
                if (data?.cbId) {
                    iframeRPC(this.#chatIframe!, 'response.' + data.cbId, { type: 'response.' + data.cbId, data: response });
                }
                return response.status ? -1 : undefined;
            });

            if (typeof onNotificationClicked === 'function') {
                navigator.serviceWorker.addEventListener('message', (e: MessageEvent) => {
                    if (e.data?.type === 'notification-clicked') {
                        onNotificationClicked(e.data);
                    }
                });
            }
        }

        return permission;
    }

    async requestNotificationPermission(_event?: MouseEvent | PointerEvent): Promise<NotificationPermissionResult> {
        if (! this.#fcmManager) {
            throw new Error('FCM manager is not initialized, call initWebPushNotifications() first');
        }

        let response: Nullable<NotificationPermissionResult> = await this.#fcmManager.loadToken();

        if (!(response?.status === 'granted' && response?.token)) {
            await this.rpc('getchat.messenger.webpush.permission.set', response as NotificationPermissionResult);
            return response as NotificationPermissionResult;
        }

        const { id: userId } = await this.rpc('getchat.messenger.actor.getId');
        const prevTokenData = safeJSONParse(localStorage.getItem(FCM_TOKEN_STORAGE_KEY));

        if (prevTokenData?.token === response.token) {
            if (prevTokenData?.userId !== userId) {
                await this.#fcmManager.deleteToken();
                localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
                response = await this.#fcmManager.loadToken();
            } else {
                await this.rpc('getchat.messenger.webpush.permission.set', response);
                return response;
            }
        }

        await this.rpc('getchat.messenger.webpush.permission.set', response);

        if (response.status === 'granted' && response.token) {
            localStorage.removeItem(WEBPUSH_DISABLED_STORAGE_KEY);
            if (await this.#putTokenToGetchat(response.token, this.#welcomeMessage ? { welcomeMessage: this.#welcomeMessage } : undefined)) {
                localStorage.setItem(FCM_TOKEN_STORAGE_KEY, JSON.stringify({ token: response.token, userId }));
                response.persisted = true;
            }
        }

        return response;
    }

    async disableNotifications(): Promise<boolean> {
        if (!this.#fcmManager) throw new Error('FCM manager is not initialized');

        const status = await this.#fcmManager.deleteToken();
        if (status) {
            await this.rpc('getchat.messenger.webpush.permission.set', { status: this.#fcmManager.getNotificationPermission(), token: null });
            localStorage.setItem(WEBPUSH_DISABLED_STORAGE_KEY, 'true');
            localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
        }
        return status;
    }

    async #putTokenToGetchat(token: string, payload: Record<string, any> = {}): Promise<boolean> {
        payload.token = token;
        const { status } = await this.rpc('getchat.messenger.fcm_token.register', payload);
        return status ?? false;
    }
}
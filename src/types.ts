export interface ChatOptions {
    /**
     * The unique identifier for the chat instance.
     */
    id?: string;
    /**
     * The URL of the chat service.
     * If the node parameter is an HTMLIframeElement, the src attribute of the iframe will be used as the chat URL.
     * default: null
     */
    url?: string;

    /**
     * The HTML element or selector where the chat will be embedded.
     * If a string is provided, it will be used as a CSS selector to find the element.
     * If an HTMLElement is provided, it will be used directly.
     * If an HTMLIframeElement is provided, it will be used as the chat iframe.
     * default: null
     * @example
     * Using a CSS selector
     * node: '#chat-container'
     * @example
     * Using an HTMLElement
     * node: document.getElementById('chat-container')
     */
    node?: HTMLElement | string;

    /**
     * The style only to apply to the passed HTMLElement passed through the node option.
     * This should be a record of CSS properties and values.
     * default: { width: '100%', height: '100%' }
     */
    nodeStyle?: Record<string, string>;

    /**
     * Callback function to call before the chat is loaded.
     * @param iframe The iframe element used for the chat.
     * @returns void
     */
    onBeforeLoad?: (iframe: HTMLIFrameElement) => void;
    /**
     * Callback function to call when the chat is loaded.
     */
    onLoaded?: (iframe?: HTMLIFrameElement | null) => void;

    /**
     * Smart handle opening/closing keyboard on touch devices.
     */
    handleKeyboardOnTouchDevices?: boolean;
}

export type NotificationPermissionStatus = "granted" | "denied" | "default" | "unsupported";

export type BrowserNotificationPermissionAndToken = {
    status: NotificationPermissionStatus;
    token: Nullable<string>;
};

export type NotificationPermissionResult = BrowserNotificationPermissionAndToken & {
    persisted?: boolean;
};

export type Notification = {
    title?: string;
    body: string;
    icon?: string;
}

export type InitWebPushNotificationsOptions = {
    onNotificationClicked?: (event: MessageEvent) => void;
    iosStandalonePWALink?: string | null;
    welcomeMessage?: Notification;
}

export type UnreadSummary = {
    chats: {
        [chatId: string]: number; // always > 0 (by convention)
    };
    total: {
        messages: number;
        chats: number;
    };
}
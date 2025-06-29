export interface ChatOptions {
    /**
     * The unique identifier for the chat instance.
     */
    id: string;
    /**
     * The URL of the chat service.
     */
    url: string;
    /**
     * The HTML element representing the button, or null if not applicable.
     * If null, the button will be automatically created within document.body.
     * default: null
     */
    button?: HTMLElement | null;
    /**
     * Whether to autoload the chat. Default is false.
     * default: false
     */
    autoload?: boolean;
    /**
     * Whether to autoopen the chat. Default is false.
     * default: false
     */
    autoopen?: boolean;
    /**
     * Delay in milliseconds before open the chat automatically.
     */
    autoopenDelay?: number;
    /**
     * Whether to close the chat on escape press.
     * default: true
     */
    closeOnEscape?: boolean;
    /**
     * Callback function to call before embedding the chat to page.
     */
    onBeforeEmbedChat?: () => void;
    /**
     * Callback function to call when the chat is loaded.
     */
    onChatLoaded?: () => void;
    /**
     * Callback function to call before opening the chat.
     */
    onBeforeOpenChat?: () => Promise<void> | void;
    /**
     * Callback function to call after opening the chat.
     */
    onAfterOpenChat?: () => Promise<void> | void;;
    /**
     * Callback function to call before closing the chat.
     */
    onBeforeCloseChat?: () => Promise<void> | void;;
    /**
     * Callback function to call after closing the chat.
     */
    onAfterCloseChat?: () => Promise<void> | void;;
}

export type NotificationPermissionResult = {
    status: "granted" | "denied" | "default" | "unsupported";
    token: string | null;
    persisted?: boolean;
};

export type InitWebPushNotificationsOptions = {
    onNotificationClicked?: (event: NotificationEvent) => void;
}

export declare class Chat {
    constructor(options: ChatOptions);

    whenReady(): Promise<void>;

    load(showLoader?: boolean): Promise<void>;

    isLoaded(): boolean;

    isOpened(): boolean;

    toggle(): Promise<void>;

    open(): Promise<void>;

    close(): Promise<void>;

    addEventListener(event: string, listener: EventListenerOrEventListenerObject): void;

    getButton(): HTMLElement | null;

    getChatNode(): HTMLElement | null;

    getChatIframeNode(): HTMLElement | null;

    rpc(method: string, params: any[], timeout?: number): Promise<any>;

    initWebPushNotifications(options?: InitWebPushNotificationsOptions): Promise<NotificationPermissionResult>;

    requestNotificationPermission(event?: MouseEvent | PointerEvent): Promise<NotificationPermissionResult>;

    disableNotifications(): Promise<boolean>;
}
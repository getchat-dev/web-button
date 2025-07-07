import Chat from '@/Chat.d.ts';

export type State = 'loaded' | 'loading';

interface setChatInstanceOptions {
    toggleOnClick?: boolean;
}

export type GetChatButtonCallback = 'onBeforeOpenChat' | 'onAfterOpenChat' | 'onBeforeCloseChat' | 'onAfterCloseChat';

export declare class GetChatButton extends HTMLElement {
    // Constructor for the class
    constructor();

    // Lifecycle callbacks for custom elements
    connectedCallback(): void;
    disconnectedCallback(): void;

    // Getter and setter for the chat instance
    setChatInstance(chatInstance: Chat, options: setChatInstanceOptions): void;
    getChatInstance(): Chat;

    // Method to set the state
    setState(state: State): void;

    // Method to set the badge value
    setBadge(value: number): void;

    // Method to set the icon
    // it accepts only svg string or url
    setCustomIcon(icon: string, catchError: boolean): boolean

    // Method to set styles
    setStyles(styles: object): void;

    // Render method
    render(): void;

    /**
     * Registers a callback for getchat button events.
     *
     * Supported events:
     *   - 'onBeforeOpenChat'
     *   - 'onAfterOpenChat'
     *   - 'onBeforeCloseChat'
     *   - 'onAfterCloseChat'
     *
     * Callback signature: (chatInstance: Chat) => Promise<void> | void
     *
     * @param event - The event name.
     * @param callback - The callback function.
     */
    addCallback(event: GetChatButtonCallback, callback: Function): void;

    // Method to load the chat
    loadChat(showLoader?: boolean): Promise<void>;

    // Methods to open, close, or toggle the chat
    toggleChat(): Promise<void>;

    // Method to open the chat
    openChat(): Promise<void>;

    // Method to close the chat
    closeChat(): Promise<void>;

    isOpened(): boolean;
}

// Registration of the custom element
declare global {
    interface HTMLElementTagNameMap {
        'getchat-button': GetChatButton;
    }
}
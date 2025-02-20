import Chat from '@/Chat.d.ts';

export type State = 'loaded' | 'loading';

export declare class GetChatButton extends HTMLElement {
    // Constructor for the class
    constructor();

    // Lifecycle callbacks for custom elements
    connectedCallback(): void;
    disconnectedCallback(): void;

    // Getter and setter for the chat instance
    setChatInstance(chatInstance: Chat): void;
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
}

// Registration of the custom element
declare global {
    interface HTMLElementTagNameMap {
        'getchat-button': GetChatButton;
    }
}
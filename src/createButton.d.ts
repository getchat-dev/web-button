export interface CreateButtonOptions {
    /**
     * The class name to apply to the button.
     */
    className?: string;
    /**
     * Whether to show unread messages count.
     */
    showUnread?: boolean | 'messages' | 'chats';
    /**
     * Whether to autoload the chat. Default is false.
     */
    autoload?: boolean; // default: false

    /**
     * If true, it will show a loader on the button while the chat is loading.
     */
    autoloadLoader?: boolean; // default: false
    /**
     * Whether to open the chat widget automatically. Default is false.
     */
    autoopen?: boolean; // default: false
    /**
     * Delay in milliseconds before auto open. Default is 5000ms.
     * default: 5000ms
     */
    autoopenDelay?: number;
    /**
     * Whether to close the chat on escape press.
     * default: true
     */
    closeOnEscape?: boolean;
    /**
     * Background color of the button.
     */
    bgcolor?: string;
    /**
     * Border radius of the button.
     */
    bdradius?: string;
    /**
     * Border width of the button.
     */
    bdwidth?: string;
    /**
     * Border color of the button.
     */
    bdcolor?: string;
    /**
     * Background color of badge on the button.
     */
    badgebg?: string;
    /**
     * Color of badge on the button.
     */
    badgecolor?: string;
    /**
     * Text color of the button.
     */
    color?: string;
    /**
     * The HTML element to insert the button into.
     */
    insertButtonTo?: HTMLElement | (() => HTMLElement) | null;
    /**
     * Custom styles to apply to the button.
     */
    buttonStyle?: Partial<CSSStyleDeclaration>;
    /**
     * Class name to apply to the chat window.
     */
    chatClassName?: string;
    /**
     * The parent HTML element of the chat window.
     */
    chatParent?: HTMLElement | null;
    /**
     * Custom styles to apply to the chat window.
     */
    chatStyle?: Partial<CSSStyleDeclaration>;
    /**
     * The HTML element representing the chat node.
     */
    chatNode?: HTMLElement | null;
    /**
     * The HTML element representing the node.
     */
    node?: HTMLElement | null;
    /**
     * The URI for the chat service.
     */
    uri?: string;
}

export declare function exportButton({
    className,
    showUnread = false,
    autoload = false,
    autoopen = false,
    autoopenDelay = 5000,
    bgcolor,
    bdradius,
    bdwidth,
    bdcolor,
    color,
    insertButtonTo,
    buttonStyle,
    chatClassName,
    chatParent,
    chatStyle,
    chatNode,
    node,
    uri,
}: CreateButtonOptions): Promise<void>;
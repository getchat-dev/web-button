import { uuid, addClassName, unescapeHTML, compartmentalizeCssValue, isPlainObject, parseClassNames } from '@/utils'
import escapeHandler from '@/escapeHandler';

import GetchatButton from '@/GetchatButton';

import Chat from '@/Chat';

import styles from '@/outer.module.css';

/**
 * Options for creating a chat button.
 * 
 * @typedef {Object} CreateButtonOptions
 * @property {string} [uri] - The URI for the chat service.
 * @property {string} [className] - The class name to apply to the button.
 * @property {boolean | 'messages' | 'chats'} [showUnread] - Whether to show unread messages or chats count.
 * @property {boolean} [autoload=false] - Whether to autoload the chat. Default is false.
 * @property {boolean} [autoloadLoader=true] - Whether to show a loader while autoloading the chat. Default is true.
 * @property {boolean} [autoopen=false] - Whether to open the chat widget automatically. Default is false.
 * @property {number} [autoopenDelay=5000] - Delay in milliseconds before auto open. Default is 5000ms.
 * @property {boolean} [closeOnEscape=true] - Whether to close the chat on escape press.
 * @property {number} [mobileModeMaxWidth=460] - The maximum width of window when chat is in mobile mode.
 * @property {string} [bgcolor] - Background color of the button.
 * @property {string} [bdradius] - Border radius of the button.
 * @property {string} [bdwidth] - Border width of the button.
 * @property {string} [bdcolor] - Border color of the button.
 * @property {string} [badgecolor] - Border color of the button.
 * @property {string} [badgebg] - Border color of the button.
 * @property {string} [color] - Text color of the button.
 * @property {HTMLElement|function(): HTMLElement} [insertButtonTo] - The HTML element to insert the button into.
 * @property {Partial<CSSStyleDeclaration>} [buttonStyle] - Custom styles to apply to the button.
 * @property {string} [chatClassName] - Class name to apply to the chat window.
 * @property {HTMLElement|null} [chatParent] - The parent HTML element of the chat window.
 * @property {Partial<CSSStyleDeclaration>} [chatStyle] - Custom styles to apply to the chat window.
 * @property {HTMLElement|null} [chatNode] - The HTML element representing the chat node.
 */
export default async function ({
    uri,
    className,
    showUnread = false,
    autoload = false,
    autoloadLoader = true,
    autoopen = false,
    autoopenDelay = 5,
    closeOnEscape = true,
    color,
    mobileModeMaxWidth = 460,
    insertButtonTo,
    buttonStyle,
    chatClassName,
    chatParent,
    chatStyle,
    chatNode,
    ...options
}) {
    const id = (__JS_GLOBAL_SCOPE__).toLowerCase() + uuid();

    if (typeof insertButtonTo === 'function') {
        insertButtonTo = insertButtonTo();
    };

    if (insertButtonTo instanceof HTMLElement) {
        if (!document.body.contains(insertButtonTo)) {
            throw new Error('insertButtonTo is HTMLElement but not yet in DOM, please insert it first');
        }
    }
    else {
        insertButtonTo = document.body;
    }

    const button = document.createElement('getchat-button');
    button.id = id;

    if (!className) {
        className = styles['button'];
    }
    className = parseClassNames(className);
    if (className) {
        addClassName(button, className);
    }

    if (isPlainObject(buttonStyle)) {
        Object.assign(button.style, buttonStyle);
    }

    if (GetchatButton.supportedAttributes?.length) {
        for (let attr of GetchatButton.supportedAttributes) {
            if (options[attr]) {
                button.setAttribute('data-'+attr, options[attr]);
            }
        }
    }

    if(showUnread) {
        button.setAttribute('data-show-unread', showUnread === true ? 'messages' : showUnread);
    }

    let beforeOpenTopScroll;
    let beforeOpenBodyPositionProperty;
    let thingsForChatMode = false;

    button.addCallback('onBeforeOpen', function() {
        if (window.innerWidth <= mobileModeMaxWidth) {
            beforeOpenTopScroll = window.scrollY || window.pageYOffset;
            beforeOpenBodyPositionProperty = getComputedStyle(document.body).position;
            thingsForChatMode = true;
        }
    });

    button.addCallback('onAfterOpen', function() {
        if (thingsForChatMode) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.body.style.position = 'fixed';
        }

        if (closeOnEscape === true) {
            escapeHandler.bind(button.closeChat);
        }
    });

    button.addCallback('onAfterClose', function() {
        if (thingsForChatMode) {

            if (beforeOpenBodyPositionProperty) {
                document.body.style.position = beforeOpenBodyPositionProperty
            }

            if (beforeOpenTopScroll) {
                window.scrollTo({ top: beforeOpenTopScroll, left: 0, behavior: 'instant' });
            }
        }

        thingsForChatMode = false;

        if (closeOnEscape) {
            escapeHandler.unbind(button.closeChat);
        }
    });

    const initChat = () => {

        // prepare the chat container
        let doesElementOnPage = true;
        if (!(chatNode instanceof HTMLElement)) {
            chatNode = document.createElement('div');
            doesElementOnPage = false;
        }

        chatNode.className = styles['chat']

        if (chatClassName) {
            addClassName(chatNode, parseClassNames(chatClassName));
        }

        if (isPlainObject(chatStyle)) {
            Object.assign(chatNode.style, chatStyle);
        }

        if (!doesElementOnPage || !document.body.contains(chatNode)) {
            if (!(chatParent instanceof HTMLElement)) {
                chatParent = document.body;
            }

            chatParent.appendChild(chatNode);
        }
        // end prepare the chat container

        const chat = new Chat({
            url: unescapeHTML(uri),
            node: chatNode,
            handleKeyboardOnTouchDevices: false,

            onLoaded: function () {
                // exactly here, on loading and before opening.
                // set a flag in the session that the chat was opened for us
                window.localStorage.setItem(`getchat_opened`, '1');

                button.setState('loaded');

                const wh = window.innerHeight;

                const chatNode = chat.getChatNode();
                if (chatNode) {
                    let { position, top, bottom } = getComputedStyle(chatNode);

                    const newStyle = {}

                    requestAnimationFrame(() => {
                        // if our chat is inside the element with a positional fix.
                        // we need to calculate the height intelligently
                        if (position === 'fixed') {

                            bottom = compartmentalizeCssValue(bottom, 'auto');
                            top = compartmentalizeCssValue(top, 'auto');

                            if (bottom !== 'auto' && bottom?.value) {
                                if (top === 'auto') {
                                    newStyle.top = bottom.value + bottom.unit;
                                    newStyle.height = 'auto';
                                }
                            }
                            else if(top !== 'auto' && top.value) {
                                if (bottom === 'auto') {
                                    newStyle.bottom = top.value + top.unit;
                                    newStyle.height = 'auto';
                                }
                            }
                        }
                        else {
                            newStyle.height = `${Math.min(wh - 20, 500)}px`;
                        }

                        Object.assign(chatNode.style, newStyle);
                    });
                }

                if (autoopen) {
                    if (autoopen !== 'once' || !window.localStorage.getItem(`getchat_opened`)) {
                        !isNaN(autoopenDelay)
                            ? setTimeout(button.openChat, autoopenDelay * 1000)
                            : button.openChat()
                        ;
                    }
                }
            },
        });

        button.setChatInstance(chat);
        button.loadChat(autoloadLoader);

        chat.addEventListener('getchat.close', function (data) {
            button.closeChat();
        });

        return chat;
    }

    // initializing the chat instance
    if(autoload) {
        initChat();
    }
    else {
        button.addEventListener('click', initChat, {once: true});
    }

    // adding the button to the DOM
    insertButtonTo.appendChild(button);

    return button;
}
import { addClassName, getAttr, removeClassName, toDecimal, cssTransitionBasedAnimate, singletonPromise, dispatchEvent } from '@/utils';
import { startObservViewport, finishObservViewport } from '@/viewportObserver';
import Chat from '@/Chat';

import styles from '@/outer.module.css';

const transformAttributeToCss = function (node, attrbite, type) {
    let value = getAttr(node, attrbite, type);

    if (value) {
        node.style.setProperty(`--${attrbite.replace('data-', '')}`, value);
    }
}

const supportedAttributes = ['bgcolor', 'color', 'bdradius', 'bdwidth', 'bdcolor', 'badgebg', 'badgecolor'];

const defaultIcon = `
<svg class="button-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <path fill="inherit"
        d="M7 14h6a.968.968 0 0 0 .713-.288A.964.964 0 0 0 14 13a.968.968 0 0 0-.288-.713A.964.964 0 0 0 13 12H7a.968.968 0 0 0-.713.288A.964.964 0 0 0 6 13c0 .283.096.521.288.713.192.192.43.288.712.287Zm0-3h10a.968.968 0 0 0 .713-.288A.964.964 0 0 0 18 10a.968.968 0 0 0-.288-.713A.964.964 0 0 0 17 9H7a.968.968 0 0 0-.713.288A.964.964 0 0 0 6 10c0 .283.096.521.288.713.192.192.43.288.712.287Zm0-3h10a.968.968 0 0 0 .713-.288A.964.964 0 0 0 18 7a.968.968 0 0 0-.288-.713A.964.964 0 0 0 17 6H7a.968.968 0 0 0-.713.288A.964.964 0 0 0 6 7c0 .283.096.521.288.713.192.192.43.288.712.287ZM6 18l-2.3 2.3c-.317.317-.68.388-1.088.213-.409-.175-.613-.487-.612-.938V4c0-.55.196-1.021.588-1.413A1.922 1.922 0 0 1 4 2h16c.55 0 1.021.196 1.413.588.392.392.588.863.587 1.412v12c0 .55-.196 1.021-.588 1.413A1.922 1.922 0 0 1 20 18H6Zm-.85-2H20V4H4v13.125L5.15 16Z" />
</svg>
`;

const validateSvg = function (svg) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');

    if (doc.querySelector('parsererror')) {
        return false;
    }

    return true;
}

const validateUrl = function (url) {
    if(! window.URL) {
        // URL is not supported, but i don't want to throw an error
        return true;
    }

    const parsed = URL.parse(url);
    if(parsed) {
        if(! (parsed.protocol === 'http:' || parsed.protocol === 'https:')) {
            return false;
        }
        if(parsed.pathname === '' && parsed.searchParams.size < 1) {
            return false;
        }

        return true;
    }

    return false;
}

const registeredCallbacks = ['onBeforeOpen', 'onAfterOpen', 'onBeforeClose', 'onAfterClose'];
export default class GetchatButton extends HTMLElement {

    #chatInstance;
    #rendered = false;
    #observer;
    #icon = defaultIcon;

    #isChatOpened = false;
    #animationState = false;

    #callbacks = {};

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        this.loadChat = singletonPromise(this.#loadChat.bind(this));
        this.toggleChat = singletonPromise(this.#toggleChat.bind(this));
        this.openChat = singletonPromise(this.#openChat.bind(this));
        this.closeChat = singletonPromise(this.#closeChat.bind(this));
    }

    connectedCallback() {
        this.render();

        supportedAttributes.forEach(attr => {
            if (this.hasAttribute('data-' + attr)) {
                transformAttributeToCss(this, 'data-'+attr, 'string');
            }
        });

        // add listeners to listen changing attrivutes
        this.#observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    // check if it is data attribute remove data-
                    let attrName = mutation.attributeName;
                    if (attrName.startsWith('data-')) {
                        attrName = attrName.replace('data-', '');
                    }

                    if (supportedAttributes.includes(attrName.replace('data-', ''))) {
                        transformAttributeToCss(this, mutation.attributeName, 'string');
                    }
                }
            }
        });

        this.#observer.observe(this, { attributes: true });
    }

    disconnectedCallback() {
        this.#observer.disconnect();
    }

    setChatInstance(chatInstance, {toggleOnClick = true} = {}) {
        if(this.#chatInstance) {
            console.error('Chat instance is already set. Use getChatInstance() to access it.');
            return;
        }
        if(! (chatInstance instanceof Chat)) {
            console.error('Invalid chat instance provided. It must be an instance of Chat class.');
            return;
        }

        this.#chatInstance = chatInstance;
        this.#chatInstance.whenReady().then(() => {
            const unread = getAttr(this, 'data-show-unread', 'string');
            if(unread && ['chats', 'messages'].includes(unread)) {
                this.#chatInstance.rpc('getchat.messenger.getUnreads').then(unreads => {
                    this.setBadge(unreads?.total?.[unread] ?? 0);
                });
            }
        });

        if (toggleOnClick) {
            this.addEventListener('click', this.toggleChat);
        }
    }

    getChatInstance() {
        return this.#chatInstance;
    }

    addCallback(name, callback) {
        if (registeredCallbacks.includes(name) && typeof callback === 'function') {
            if (!this.#callbacks[name]) {
                this.#callbacks[name] = [];
            }
            this.#callbacks[name].push(callback);
        }
    }

    setState(state) {

        state = state.toLowerCase();
        if (state === 'loading') {
            addClassName(this, 'loading');
        }
        else {
            removeClassName(this, 'loading');

            if (state === 'loaded') {
                this.shadowRoot.querySelector('.loader').remove();
            }
        }
    }

    setBadge(value) {
        value = toDecimal(value);

        const badge = this.shadowRoot.querySelector('.unreads');
        if (badge) {
            if (value > 0) {
                if(value > 999) {
                    value = Math.floor(value / 1000) + 'K'
                }
                badge.textContent = value;
                addClassName(badge, 'unreads--visible');
            }
            else {
                removeClassName(badge, 'unreads--visible');
            }
        }
    }

    isOpened() {
        return this.#isChatOpened;
    }

    #loadChat = (showLoader = true) => {
        return new Promise(async (resolve, reject) => {
            if (!this.#chatInstance) {
                reject('Chat instance is not set');
                return;
            }

            if(this.#chatInstance.loadingState === 2) {
                resolve();
                return;
            }

            try {
                if(showLoader) {
                    this.setState('loading');
                }

                await this.#chatInstance.load();

                resolve(this.#chatInstance);
            }
            catch (error) {
                reject(error);
            }
        });
    }

    #toggleChat() {
        return new Promise(async (resolve, reject) => {

            if (!this.#chatInstance) {
                reject('Chat instance is not set');
                return;
            }

            if (this.#chatInstance.loadingState !== 2) {
                resolve();
                return;
            }

            if (this.#isChatOpened) {
                await this.closeChat();
            }
            else {
                await this.openChat();
            }

            resolve();
        });
    }

    #openChat = () => {
        return new Promise(async (resolve, reject) => {

            if(! this.#chatInstance) {
                reject('Chat instance is not set');
                return;
            }

            if (! this.#chatInstance.isLoaded()) {
                await this.loadChat();
            }

            if (this.#isChatOpened && !this.#animationState) {
                resolve();
                return;
            }

            try {
                this.#animationState = true;

                await this.#callCallbacks('onBeforeOpen', this);

                await cssTransitionBasedAnimate(
                    this,
                    styles['button-animation-preclose'],
                    styles['button-animation-close'],
                );

                await cssTransitionBasedAnimate(
                    this.#chatInstance?.getChatNode(),
                    styles['chat-animation-preopen'],
                    styles['chat-animation-opened']
                );

                await this.#callCallbacks('onAfterOpen', this);

                this.#chatInstance.rpc('getchat.messenger.repaint')

                startObservViewport(this.#chatInstance.getChatNode());

                this.#animationState = false;
                this.#isChatOpened = true;

                this.#chatInstance.rpc('getchat.chat.input.focus');
            }
            catch (e) {
                reject(e);
            }

            resolve();
        });
    }

    #closeChat = () => {
        return new Promise(async (resolve, reject) => {

            if (!this.#isChatOpened && !this.#animationState) {
                resolve();
                return;
            }

            try {
                this.#animationState = true;

                finishObservViewport(this.#chatInstance.getChatNode());

                await this.#callCallbacks('onBeforeClose', this);

                await cssTransitionBasedAnimate(
                    this.#chatInstance.getChatNode(),
                    styles['chat-animation-opened'],
                    styles['chat-animation-close']
                );

                removeClassName(this.#chatInstance.getChatNode(), styles['chat-animation-close']);
                removeClassName(this, styles['button-animation-close']);

                await cssTransitionBasedAnimate(
                    this,
                    styles['button-animation-preopen'],
                    styles['button-animation-open'],
                );

                removeClassName(this, styles['button-animation-open']);

                this.#animationState = true;
                this.#isChatOpened = false;

                await this.#callCallbacks('onAfterClose', this);

                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
    }

    async #callCallbacks(name, ...args) {
        const callbacks = this.#callbacks[name] || [];
        try {
            for (const callback of callbacks) {
                await callback(...args);
            }
        }
        catch (error) {
            console.error(`Error in callback ${name}:`, error);
        }
    }

    #setCustomIcon(icon) {
        if(this.#rendered) {
            const $node = this.shadowRoot.querySelector('.button-icon');
            if($node && $node instanceof HTMLElement) {
                $node.innerHTML = icon;
            }
        }
        else {
            this.#icon = icon;
        }
    }

    setCustomIcon(icon, catchError = false) {

        if (typeof icon !== 'string') {
            if(catchError) {
                throw new Error('Icon must be a string');
            }
            return false;
        }

        icon = icon.trim();

        let isUrl = false;
        let isDataUrl = false;

        if (icon.startsWith('<svg')) {
            if(validateSvg(icon)) {
                this.#setCustomIcon(icon);
                return true;
            }
        }
        else if ((isUrl = icon.startsWith('http')) || (isDataUrl = icon.startsWith('data:image/'))) {
            if((isUrl && validateUrl(icon)) || isDataUrl) {
                this.#setCustomIcon(`<img src="${icon}" alt="icon" />`);
                return true;
            }
        }

        if(catchError) {
            throw new Error('Icon must be a valid SVG or URL');
        }

        return false;
    }

    setStyles(styles) {
        const styleElement = this.shadowRoot.getElementById('dynamic-styles');
        let cssString = '';
        for (const [key, value] of Object.entries(styles)) {
            cssString += `${key} { ${value} } `;
        }
        styleElement.textContent = cssString;
    }

    render() {
        if (this.#rendered) {
            return;
        }

        // Initial inner HTML without styles
        this.shadowRoot.innerHTML = `
            <style id="dynamic-styles"></style>
            <button class="button">
                <div class="button-icon">
                    ${this.#icon}
                </div>
                <div class="unreads"></div>
                <div class="loader"></div>
            </button>
        `;

        this.setStyles({
            ':host': `
                background: none;
                -webkit-font-smoothing: antialiased;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                cursor: pointer;
            `,
            ':host(.loading)': `
                cursor: wait;
                pointer-events: none;
            `,
            '.button': `
                position: relative;
                display: block;
                margin: 0;
                padding: 0;
                width: 100%;
                background: var(--bgcolor, #000);
                border: 0;
                border-radius: var(--bdradius, 50%);
                border-width: var(--bdwidth, 0);
                border-color: var(--bdcolor, currentColor);
                outline: none;
                cursor: inherit;

                -webkit-transition: background .3s ease;
                -moz-transition: background .3s ease;
                -o-transition: background .3s ease;
                transition: background .3s ease;
            `,
            '.button:before': `
                display: block;
                padding-top: 100%;
                content: '';
            `,
            '.button-icon': `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 50%;
                fill-rule: nonzero;
                fill: var(--color, #FFF);
                transition: opacity .3s ease;
            `,
            '.button-icon > svg': `
                width: 100%;
            `,
            '.button-icon > img': `
                display: block;
                width: 100%;
            `,
            '.unreads': `
                position: absolute;
                top: 0;
                right: 0;
                transform: translate(50%, -50%) scale(0.95);
                display: block;
                box-sizing: border-box;
                padding: 0 4px;
                min-width: 16px;
                height: 16px;
                line-height: 16px;
                background: var(--badgebg, #F16843);
                border-radius: 8px;
                color: var(--badgecolor, #FFF);
                opacity: 0;
                transition: opacity .15s ease, transform .15s ease;
            `,
            '.unreads--visible': `
                transform: translate(50%, -50%) scale(1);
                opacity: 1;
            `,
            '.loader': `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                opacity: 0;
                display: block;
                width: 80%;
                height: 80%;
                border: .2rem solid rgba(255, 255, 255, .7);
                border-top-color: currentColor;
                border-radius: 50%;
                animation: spin 1s infinite;
                transition: opacity .3s ease;
            `,
            ':host(.loading) .button-icon': `
                opacity: 0;
            `,
            ':host(.loading) .loader': `
                opacity: 1;
            `,
            '@keyframes spin': `
                0% {
                    transform: translate(-50%, -50%) rotate(0deg);
                }
                100% {
                    transform: translate(-50%, -50%) rotate(360deg);
                }
            `
        });

        this.#rendered = true;
    }
}

GetchatButton.supportedAttributes = supportedAttributes;

customElements.define('getchat-button', GetchatButton);
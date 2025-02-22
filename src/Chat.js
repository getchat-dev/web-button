import { cssTransitionBasedAnimate, removeClassName, iframeRPC } from '@/utils.js'
import { startObservViewport, finishObservViewport } from '@/viewportObserver';
import embedChat from '@/embedChat';
import onMessage from '@/onMessage';
import escapeHandler from '@/escapeHandler';

import styles from '@/outer.module.css';

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

    constructor({ id, url, button, closeOnEscape = true, autoload, autoopen = false, autoopenDelay, onBeforeEmbedChat, onChatLoaded, onBeforeOpen, onAfterOpen, onBeforeClose, onAfterClose }) {
        this.#chatUrl = url;
        this.#closeOnEscape = closeOnEscape;

        if (button instanceof Element) {
            this.#button = button;
        }

        if(typeof onBeforeEmbedChat !== 'function') {
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
            catch(e) {
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
            catch(e) {
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
                if(timeout > 0) {
                    to = setTimeout(() => {
                        reject('Timeout');
                    }, timeout);
                }
            }
        });
    }
}
import onMessage from "@/onMessage";
import { isTouchDevice } from '@/utils';

const nodes = new Set();

const handlingNode = new Map();

let DelayedVKResizeHandler = null;

let isInited = false;

const initVirtualkeyboardAPI = function() {
    navigator.virtualKeyboard.overlaysContent = true;

    lastVKHeight = null;

    navigator.virtualKeyboard.addEventListener('geometrychange', (event) => {
        const { x, y, width, height } = event.target.boundingRect;

        if(lastVKHeight === height) {
            return;
        }

        for(const $node of nodes) {
            const _lastViewport = Object.assign({}, lastViewport);
            setTimeout(() => {
                handleNode($node, _lastViewport, newViewport);
            }, 0);
        }

        lastVKHeight = height;
    });
}

const init = function() {

    if(! isTouchDevice()) {
        return;
    }
    /*
    if ('virtualKeyboard' in navigator) {
        initVirtualkeyboardAPI();
    }
    else */if(! window.visualViewport) {
        console.error('window.visualViewport is not supported');
        return;
    }

    let lastViewport = {height: window.visualViewport.height, width: window.visualViewport.width};

    const handleNode = function(event, $node, oldViewport, newViewport) {

        const now = Date.now();
        const $iframe = $node.querySelector('iframe');

        if(! handlingNode.has($iframe?.contentWindow)) {
            return;
        }

        // DELAY is different for focus and unfocus, the time after unfocus event and triggering resize event is longer
        let DELAY = handlingNode.get($iframe?.contentWindow).action === 'unfocus' ? 1000 : 300;

        if((now - handlingNode.get($iframe?.contentWindow).timestamp) > DELAY) {
            // for scroll event and focus state
            if(event.type === 'scroll' && handlingNode.get($iframe?.contentWindow).action === 'focus') {
                $node.style.setProperty('--chat-node-top-offset', `${window.visualViewport.pageTop}px`);
            }

            return;
        }

        // in case of unfocus
        if(handlingNode.get($iframe?.contentWindow).action === 'unfocus') {
            $node.style.removeProperty('--chat-node-top-offset');
            $node.style.removeProperty('--chat-node-height');
            return;
        }

        // check if the node is in the viewport
        const rect = $node.getBoundingClientRect();
        const heightDiff = newViewport.height - oldViewport.height;

        if(rect.top === heightDiff) {
            $node.style.setProperty('--chat-node-top-offset', `${((parseInt($node.style.top) || 0) + (rect.top * -1))}px`);
            $node.style.setProperty('--chat-node-height', `${newViewport.height}px`);
        }
    }

    window.visualViewport.addEventListener('resize', (e) => {
        if(lastViewport.height === window.visualViewport.height) {
            return;
        }

        const newViewport = {height: window.visualViewport.height, width: window.visualViewport.width};

        for(const $node of nodes) {
            const _lastViewport = Object.assign({}, lastViewport);
            // setTimeout(() => {
                handleNode(e, $node, _lastViewport, newViewport);
            // }, 0);
        }

        lastViewport = newViewport;
    });

    /*const onscroll = function(e) {

        const newViewport = {height: window.visualViewport.height, width: window.visualViewport.width};

        for(const $node of nodes) {
            const _lastViewport = Object.assign({}, lastViewport);
            handleNode(e, $node, _lastViewport, newViewport);
        }
    };

    let _onscroll = null;
    let onScrollBindingTimeout = null;*/

    onMessage('getchat.input.focused', function (event, data) {
        handlingNode.set(event.source.window, {
            action: 'focus',
            timestamp: Date.now()
        });

        /*onScrollBindingTimeout = setTimeout(() => {
            if(typeof _onscroll !== 'function') {
                _onscroll = onscroll.bind(event.source.window);
                window.addEventListener('scroll', _onscroll);
            }
        }, 500);*/
    });

    onMessage('getchat.input.unfocused', function (event, data) {
        handlingNode.set(event.source.window, {
            action: 'unfocus',
            timestamp: Date.now()
        });

        /*clearTimeout(onScrollBindingTimeout);
        if(typeof _onscroll === 'function') {
            window.visualViewport.removeEventListener('scroll', _onscroll);
            _onscroll = null;
        }*/
    });

    isInited = true;
}

const startObservViewport = function($node) {
    if($node instanceof Element) {
        if(! isInited) {
            init();
        }

        nodes.add($node);
    }
}

const finishObservViewport = function($node) {
    if($node instanceof Element) {
        nodes.delete($node);
    }
}

export { startObservViewport, finishObservViewport };
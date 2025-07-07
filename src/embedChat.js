import onMessage from '@/onMessage';
import { isSafari, isTouchDevice, isPlainObject } from '@/utils';

export default function (rootElement, src, { style = { width: '100%', height: '100%' }, onbeforeload, onready, onload, onerror } = {}) {
    if(!(rootElement instanceof HTMLElement)) {
        rootElement = document.body;
    }

    let frame;
    if(rootElement instanceof HTMLIFrameElement) {
        frame = rootElement;
    }
    else {
        frame = document.createElement('iframe');

        if(isPlainObject(style)) {
            Object.assign(frame.style, style);
        }
    }

    if(typeof onbeforeload === 'function') {
        onbeforeload(frame);
    }

    if(typeof onload === 'function') {
        frame.onload = onload;
    }
    if(typeof onerror === 'function') {
        frame.onerror = onerror;
    }

    if(src && ! frame.src) {
        frame.src = src;
    }

    frame.setAttribute('frameborder', '0');
    frame.setAttribute('seamless', 'seamless');

    onMessage('getchat.loaded', function () {
        if(typeof onready === 'function') {
            onready(frame);
        }

        return -1;
    }, frame);

    if(rootElement !== frame) {
        rootElement.appendChild(frame);
    }

    if(! (isTouchDevice() || isSafari())) {
        // for some browser chrome, maybe firefox it wiil prevent back gesture
        // unfortunately, it will not work on safari defenetly, because safari capture back gesture on OS level
        const defaultOverscrollBehaviorX = window.getComputedStyle(document.body)?.overscrollBehaviorX ?? 'auto';
        frame.addEventListener('mouseenter', function () {
            document.body.style.overscrollBehaviorX = 'contain';
        });
        frame.addEventListener('mouseleave', function () {
            document.body.style.overscrollBehaviorX = defaultOverscrollBehaviorX;
        });
    }

    return frame;
}
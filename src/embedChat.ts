import onMessage from '@/onMessage';
import { isSafari, isTouchDevice, isPlainObject } from '@/utils';

type IFrameStyle = Partial<CSSStyleDeclaration>;

type CreateIFrameOptions = {
    style?: IFrameStyle;
    onbeforeload?: (frame: HTMLIFrameElement) => void;
    onready?: (frame: HTMLIFrameElement) => void;
    onload?: (this: GlobalEventHandlers, ev: Event) => any;
    onerror?: OnErrorEventHandler;
}

export default function createIFrame(
    rootElement: HTMLElement | HTMLIFrameElement | null | undefined,
    src?: string,
    {
        style = { width: '100%', height: '100%' },
        onbeforeload,
        onready,
        onload,
        onerror
    }: CreateIFrameOptions = {}
): HTMLIFrameElement {

    if (!(rootElement instanceof HTMLElement)) {
        rootElement = document.body;
    }

    let frame: HTMLIFrameElement;

    if (rootElement instanceof HTMLIFrameElement) {
        frame = rootElement;
    } else {
        frame = document.createElement('iframe');

        if (isPlainObject(style)) {
            Object.assign(frame.style, style);
        }
    }

    if (typeof onbeforeload === 'function') {
        onbeforeload(frame);
    }

    if (typeof onload === 'function') {
        frame.onload = onload;
    }
    if (typeof onerror === 'function') {
        frame.onerror = onerror;
    }

    frame.setAttribute('frameborder', '0');
    frame.setAttribute('seamless', 'seamless');

    // must be set before src, otherwise the container policy may be computed
    // for a navigation that already started
    if(! frame.hasAttribute('allow')) {
        frame.setAttribute('allow', 'microphone; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
    }

    if (src && !frame.src) {
        frame.src = src;
    }

    onMessage('getchat.loaded', function () {
        if (typeof onready === 'function') {
            onready(frame);
        }
        return -1;
    }, frame);

    if (rootElement !== frame) {
        rootElement.appendChild(frame);
    }

    if (!(isTouchDevice() || isSafari())) {
        // for some browsers like Chrome, maybe Firefox, it will prevent back gesture
        // unfortunately, it will not work on Safari definitely, because Safari captures back gesture on OS level
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

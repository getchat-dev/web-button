import type { SharedWorkerTimer } from '@/createTimerWorker';

type TimerHandle = string | number | null | undefined;

// Only the SharedWorker-backed facade exposes the wall-clock-aligned variants;
// plain `window` gets the ordinary ones.
const supportsSyncTimers = (timers: SharedWorkerTimer | Window): timers is SharedWorkerTimer =>
    'setSyncTimeout' in timers;

type BadgeNumber = number | string;

interface FavicoOptions {
    bgColor?: string;
    textColor?: string;
    fontFamily?: string;
    fontStyle?: string;
    borderRadius?: number;
    win?: Window;
    dataUrl?: (url: string) => void;
}

interface BadgeData {
    number: BadgeNumber;
    opts: FavicoOptions;
}

interface FavicoAPI {
    setBadge: (number: BadgeNumber, opts?: FavicoOptions) => void;
    clean: () => void;
}

// --- Constants ---
const BLINK_DURATION_MS = 1000;
const FONT_SIZE_LARGE_NUMBER_RATIO = 0.55;
const FONT_SIZE_DEFAULT_RATIO = 0.8;
const MAX_FOUR_DIGITS = 9999;
const K_PLUS_THRESHOLD = 1000;

const hexToRgba = function (hex: string, alpha: number = 1): string {
    if (typeof hex !== 'string') {
        hex = '#000000';
    }
    const hexClean = hex.startsWith('#') ? hex.slice(1) : hex;
    let r: number, g: number, b: number, a: number = alpha;

    if (hexClean.length === 3) {
        [r, g, b] = hexClean.split('').map(c => parseInt(c + c, 16));
    } else if (hexClean.length === 6) {
        [r, g, b] = [0, 2, 4].map(offset => parseInt(hexClean.slice(offset, offset + 2), 16));
    } else if (hexClean.length === 8) {
        [r, g, b] = [0, 2, 4].map(offset => parseInt(hexClean.slice(offset, offset + 2), 16));
        a = parseInt(hexClean.slice(6, 8), 16) / 255;
    } else {
        return `rgba(0,0,0,0)`;
    }
    return `rgba(${r},${g},${b},${a})`;
}

const formatBadgeNumber = function(number: BadgeNumber): string {
    if (typeof number !== 'number') return String(number);
    if (number > MAX_FOUR_DIGITS) return '9k+';
    if (number >= K_PLUS_THRESHOLD) return `${Math.floor(number / K_PLUS_THRESHOLD)}k+`;
    return String(number);
}

const loadImage = function(img: HTMLImageElement, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
        img.src = src;
    });
}

export function createFaviconBadgeManager(options: FavicoOptions = {}, timers: SharedWorkerTimer | Window = window): FavicoAPI {
    // --- Internal State ---
    let ready: boolean = false;
    let canvas: HTMLCanvasElement = document.createElement('canvas');
    let img: HTMLImageElement = document.createElement('img');
    img.crossOrigin = 'anonymous';
    let doc: Document;
    let origIcons: HTMLLinkElement[] = [];
    let context: CanvasRenderingContext2D | null = null;
    let blinkTimeout: TimerHandle = null;
    let setBadgeTimeout: TimerHandle;
    let isBadgeVisible: boolean = false;
    let currentBadgeData: BadgeData | null = null;

    const setTimer = (callback: () => void, ms: number): TimerHandle =>
        supportsSyncTimers(timers)
            ? timers.setSyncTimeout(callback, ms)
            : timers.setTimeout(callback, ms);

    const clearTimer = (id: TimerHandle): void => {
        if (id === null || id === undefined) return;

        if (supportsSyncTimers(timers)) {
            timers.clearSyncTimeout(id);
        }
        else {
            timers.clearTimeout(id as number);
        }
    };

    // Merge user options with defaults
    const opts: FavicoOptions = {
        bgColor: '#d00',
        textColor: '#fff',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        borderRadius: 0,
        win: window,
        ...options
    };

    if(! timers) {
        timers = window;
    }

    function getIcons(): HTMLLinkElement[] {
        const icons = Array.from(doc.querySelectorAll('link[rel~="icon"]')) as HTMLLinkElement[];
        if (!icons.length) {
            const link = doc.createElement('link');
            link.rel = 'icon';
            doc.head.appendChild(link);
            return [link];
        }
        return icons;
    }

    function setIcon(canvas: HTMLCanvasElement) {
        const url = canvas.toDataURL('image/png');
        opts.dataUrl?.(url);
        for (const icon of origIcons) {
            icon.href = url;
        }
    }

    function drawFullBadge(number: BadgeNumber, drawOpts: FavicoOptions) {
        if (!context) return;
        const w = canvas.width, h = canvas.height;
        const label = formatBadgeNumber(number);

        const fontSize = Math.min(
            Math.floor(h * (String(label).length > 2 ? FONT_SIZE_LARGE_NUMBER_RATIO : FONT_SIZE_DEFAULT_RATIO)),
            32
        );

        context.clearRect(0, 0, w, h);

        const radius = drawOpts.borderRadius !== undefined ? drawOpts.borderRadius : opts.borderRadius!;
        const actualRadius = Math.min(radius!, w / 2, h / 2);

        context.beginPath();
        context.fillStyle = hexToRgba(drawOpts.bgColor ?? '#d00');
        context.moveTo(actualRadius, 0);
        context.lineTo(w - actualRadius, 0);
        context.quadraticCurveTo(w, 0, w, actualRadius);
        context.lineTo(w, h - actualRadius);
        context.quadraticCurveTo(w, h, w - actualRadius, h);
        context.lineTo(actualRadius, h);
        context.quadraticCurveTo(0, h, 0, h - actualRadius);
        context.lineTo(0, actualRadius);
        context.quadraticCurveTo(0, 0, actualRadius, 0);
        context.closePath();
        context.fill();

        context.font = `${drawOpts.fontStyle ?? 'bold'} ${fontSize}px ${drawOpts.fontFamily ?? 'sans-serif'}`;
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.fillStyle = hexToRgba(drawOpts.textColor ?? '#fff');
        context.fillText(label, Math.floor(w / 2), Math.floor((h - (fontSize * 0.8)) / 2));
        setIcon(canvas);
    }

    function stopBlinkAnimation() {
        if (blinkTimeout) {
            clearTimer(blinkTimeout);
            blinkTimeout = null;
        }
    }

    let lastSharpBlinkTime = Date.now();

    function toggleSharpBlink() {

        if (!currentBadgeData) {
            api.clean();
            return;
        }
        if (!context) return;

        if (isBadgeVisible) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            setIcon(canvas);
            isBadgeVisible = false;
        } else {
            drawFullBadge(currentBadgeData.number, currentBadgeData.opts);
            isBadgeVisible = true;
        }

        lastSharpBlinkTime = Date.now();
        blinkTimeout = setTimer(toggleSharpBlink, BLINK_DURATION_MS);
    }

    function startSharpBlink() {
        stopBlinkAnimation();
        lastSharpBlinkTime = Date.now();
        toggleSharpBlink();
    }

    // --- API methods ---

    async function init() {
        doc = opts.win!.document;
        origIcons = getIcons();
        const lastIcon = origIcons[origIcons.length - 1];

        if (!lastIcon || !lastIcon.hasAttribute('href') || !lastIcon.href) {
            canvas.width = canvas.height = 32;
            context = canvas.getContext('2d');
            ready = true;
            return;
        }

        try {
            await loadImage(img, lastIcon.href);
            canvas.width = img.width;
            canvas.height = img.height;
            context = canvas.getContext('2d');
            ready = true;
            api.clean();
        } catch {
            canvas.width = canvas.height = 32;
            context = canvas.getContext('2d');
            ready = true;
            api.clean();
        }
    }

    function setBadge(number: BadgeNumber, badgeOpts: FavicoOptions = {}) {
        clearTimer(setBadgeTimeout);

        if (!ready) {
            setBadgeTimeout = setTimer(() => setBadge(number, badgeOpts), 0);
            return;
        }

        stopBlinkAnimation();

        if ((typeof number === 'number' && number > 0) || (typeof number === 'string' && number !== '')) {
            currentBadgeData = { number, opts: { ...opts, ...badgeOpts } };
            isBadgeVisible = false;
            startSharpBlink();
        } else {
            api.clean();
        }
    }

    function clean() {
        if (!ready || !context) return;

        stopBlinkAnimation();
        currentBadgeData = null;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        setIcon(canvas);
    }

    // --- Public API ---
    const api: FavicoAPI = {
        setBadge,
        clean,
    };

    // Kick off initialization
        void init();

    return api;
}
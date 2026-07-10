import type { Nullable } from '@/types';

const uuid = function () {
    return 'xxxxxxxx-xxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const genId = function getId(): string {
    return Math.random().toString(36).slice(2);
}

const isString = function (value: unknown, notEmpty = false): value is string {
    if (typeof value !== 'string') {
        return false;
    }

    if (notEmpty && value.length === 0) {
        return false;
    }

    return true;
}

const addClassName = function (node: HTMLElement, classNames: string | string[] | null): void {

    if(! (node instanceof HTMLElement)) {
        throw new Error('first argument have to be a DOM Node');
    }


    if (classNames === null || classNames === undefined) {
        return;
    }

    if(typeof(classNames) === 'string') {
        classNames = classNames.trim().replace(/\s{2,}/, ' ').split(' ')
    }

    if(Object.prototype.toString.apply(classNames) !== '[object Array]') {
        throw new Error('classNames arg must be string or array, '+Object.prototype.toString.apply(classNames)+' given')
    }

    if(classNames.length) {
        for(let i = 0, len = classNames.length; i < len; i++) {
            if(node.className.indexOf(classNames[i]) < 0) {
                node.className = (node.className+' '+classNames[i]).trim();
            }
        }
    }
}

const removeClassName = function(el: HTMLElement, classNames: string | string[] | null): void {

    if(!(el instanceof HTMLElement)) {
        throw new Error('el arg must be DOM Node')
    }

    if (classNames === null || classNames === undefined) {
        return;
    }

    if(typeof(classNames) === 'string') {
        classNames = classNames.trim().replace(/\s{2,}/, ' ').split(' ');
    }

    if(Object.prototype.toString.apply(classNames) !== '[object Array]') {
        throw new Error('classNames arg must be string or array')
    }

    if(classNames.length) {
        for(let i = 0, len = classNames.length; i < len; i++) {
            while(el.className.indexOf(classNames[i]) > -1) {
                el.className = el.className.replace(classNames[i], '').trim();
            }
        }
    }
}

const dispatchEvent = function(node: Node, name: string, opts: Nullable<Record<string, any>> = null)
{
    if(!(node instanceof Node)) {
        throw new Error('first argument must be a DOM Node')
    }

    opts = Object.assign({canBubble: true, cancelable: true, detail: {}}, opts);
    let event;
    if(window.CustomEvent && typeof(window.CustomEvent) === 'function') {
        event = new window.CustomEvent(name, {bubbles: opts.canBubble, detail: opts.detail});
    }
    else {
        event = document.createEvent('CustomEvent');
        event.initCustomEvent(name, opts.canBubble, opts.cancelable, opts.detail);
    }

    node.dispatchEvent(event);
}

export default dispatchEvent;

const unescapeHTML = function (str: string | unknown): string | unknown {
    if (typeof (str) !== 'string') {
        return str;
    }

    var div = document.createElement('div');
    div.innerHTML = str;
    return div.firstChild?.nodeValue ?? null;
}

const scalarToBoolean = function (str: any, defaultVal: boolean = false): boolean {
    switch (typeof (str)) {
        case 'boolean':
            return str;
        case 'string':
            return ['true', 'yes', 'on', '1'].indexOf(str.toLowerCase()) > -1;
        case 'number':
            return str === 1;
    }

    return defaultVal;
}

const toDecimal = function (str: string): number {
    return parseInt(str, 10);
}

const toColor = function (str: string, defaultVal: unknown = null): unknown {
    // check that var is a look like a color
    if (/^#[0-9A-F]{6}$/i.test(str)) {
        return str;
    }

    // check that var is a look like a rgb ot rgba color
    if (/^rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,(\d(?:\.\d+)?))?\)$/i.test(str)) {
        return str;
    }

    return defaultVal;
}

const toPercent = function (str: string, defaultVal: unknown = null): unknown {
    if (/^\d+(\.\d+)?%$/.test(str)) {
        return str;
    }

    return defaultVal;
}

const toUrl = function (str: string, defaultVal: unknown = null): unknown {
    if (typeof (str) === 'string' && str.length === 0) {
        try {
            URL.parse(str);

            return str;
        }
        catch(e) {
            return defaultVal;
        }
    }

    return defaultVal;
}

const doCast = function (fnCast: Function, val: unknown): unknown {
    if (val === null || val === undefined) {
        return null;
    }

    return fnCast(val);
}

export type CompartmentalizedCssValue = {
    value: number;
    integer: number;
    fraction: number;
    unit: string;
};

const compartmentalizeCssValue = function (str: string, defaultVal: unknown = null): CompartmentalizedCssValue | string | unknown {
    if (typeof (str) === 'string' && str.length > 0) {
        // try to find numberic value and after that unit
        let match = str.match(/^((\d+)(\.(\d)+)?)(.*)$/);
        if (match) {
            return {
                value: parseFloat(match[1]),
                integer: parseInt(match[2], 10),
                fraction: parseInt(match[4], 10),
                unit: match[5]
            };
        }
        else {
            return str;
        }
    }

    return defaultVal;
}

const getAttrSupportedTypesHandlersMap: Record<string, Function> = {
    'string': String,
    'decimal': toDecimal,
    'number': Number,
    'boolean': scalarToBoolean,
    'bool': scalarToBoolean,
    'color': toColor,
    'url': toUrl,
    'percent': toPercent
};

type supportedAttributeTypes = keyof typeof getAttrSupportedTypesHandlersMap;

const getAttr = function (el: HTMLElement, name: string, ...args: any[]): string | number | boolean | null {
    let fnCast: Function = String;
    let defaultVal = null;

    if (args.length > 1) {
        const type: supportedAttributeTypes = args[0] as supportedAttributeTypes;
        if (! getAttrSupportedTypesHandlersMap.hasOwnProperty(type)) {
            throw new Error('3rd arg must be one of the following types: '+Object.keys(getAttrSupportedTypesHandlersMap).join(', '));
        }
        fnCast = getAttrSupportedTypesHandlersMap[type];
        defaultVal = args[1] ?? null;
    }
    else if (args.length === 1) {
        defaultVal = args[0] ?? null;
    }

    if (el instanceof HTMLElement) {
        if ('getAttribute' in el) {
            return doCast(fnCast, unescapeHTML(el.getAttribute(name))) ?? defaultVal;
        }
        else {
            let attrs = Array.prototype.slice.call(el['attributes'] ?? []);

            for(let i = 0, len = attrs.length; i < len; i++) {
                if(attrs[i].nodeName === name) {
                    return doCast(fnCast, unescapeHTML(attrs[i].nodeValue)) ?? defaultVal;
                }
            }
        }
    }

    return null;
}

const isPlainObject = function(obj: unknown): obj is Record<string, any> {
    return Object.prototype.toString.apply(obj) === '[object Object]'
}

const buildQueryString = function(params: Record<string, any>): string {
    let queryString = '';
    let availableTypes = ['string', 'number', 'boolean']

    if(isPlainObject(params)) {
        for(let key in params) {

            if(availableTypes.indexOf(typeof(params[key])) > -1) {
                queryString+= '&'+key+'='+params[key];
            }
        }

        if(queryString.length) {
            queryString = queryString.substr(1)
        }
    }

    return queryString;
}

const parseClassNames = function (classNames: string | string[] | Record<string, boolean>): Nullable<string> {
    if (typeof (classNames) === 'string' && classNames.length) {
        return classNames;
    }
    else if (isPlainObject(classNames)) {
        // only to avoid a ts error
        const record = classNames as Record<string, boolean>;
        return Object.keys(record).filter(function (className: string) {
            return record[className] !== false;
        }).join(' ');
    }
    else if(Array.isArray(classNames)) {
        return classNames.join(' ');
    }

    return null;
}

const addStyleToDocument = function(cssText = '', parent: Nullable<Element> = null) {
    const styleNode: HTMLStyleElement = document.createElement('style');


    styleNode.textContent = cssText;

    if(!(parent instanceof Element)) {
        parent = document.head || document.getElementsByTagName('head')[0]
    }

    parent.appendChild(styleNode)
}

const transitionEnd: string = (function() {

    const transitions: Record<string, string> = {
        "transition"      : "transitionend",
        "OTransition"     : "oTransitionEnd",
        "MozTransition"   : "transitionend",
        "WebkitTransition": "webkitTransitionEnd"
    };

    let fakeEl: HTMLDivElement = document.createElement('div');

    for(let t in transitions) {
        if((t as keyof CSSStyleDeclaration) in fakeEl.style) {
            return transitions[t];
        }
    }

    return transitions['transition'];
})();

/**
 * Sends a message to an iframe using postMessage.
 *
 * @param {HTMLIFrameElement} iframe
 * @param {string} event
 * @param {Record<string, any>} [data]
 *
 * @returns {string|null} rpcId
 */
const iframeRPC = function (iframe: HTMLIFrameElement, event: string, data: Nullable<Record<string, any>> = null): Nullable<string> {

    let payload = {
        rpcId: uuid(),
        type: event
    };

    if (data) {
        if (typeof (data) === 'string') {
            data = safeJSONParse(data)!;
        }

        if (! isPlainObject(data)) {
            throw new Error('data argument must be an object, ' + typeof (data) + ' given');
        }

        payload = Object.assign({}, data, payload);
    }

    if(iframe instanceof HTMLIFrameElement) {
        iframe.contentWindow?.postMessage(JSON.stringify(payload), '*')

        return payload.rpcId;
    }

    return null;
}

type embedIframeOptions = {
    rootElement?: Nullable<Element>,
    url: string,
    onload?: () => void,
    onerror?: () => void,
    className?: string,
    inlineStyles?: Record<string, string>
}

const embedIframe = function ({ rootElement, url, onload, onerror, className, inlineStyles }: embedIframeOptions) : HTMLIFrameElement
{
    if(!(rootElement instanceof Element) || rootElement === document.documentElement)
    {
        rootElement = document.body
    }

    var frame = document.createElement('iframe');
    frame.src = url;
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('frameborder', '0');
    frame.setAttribute('seamless', 'seamless');

    if (className) {
        addClassName(frame, className);
    }

    if (isPlainObject(inlineStyles)) {
        Object.assign(frame.style, inlineStyles);
    }

    if(typeof(onload) === 'function')
    {
        frame.onload = onload;
    }
    if (typeof (onerror) === 'function') {
        frame.onerror = onerror;
    }

    rootElement.appendChild(frame);

    return frame;
}

const callbackFuncToAsync = function (fn: Function, resolveCallback: string, rejectCallback: Nullable<string> = null) {
    if (typeof (resolveCallback) !== 'string') {
        throw new Error('resolveCallback argument must be a string, ' + typeof (resolveCallback) + ' given');
    }

    if (rejectCallback && typeof (rejectCallback) !== 'string') {
        throw new Error('rejectCallback argument must be a string or null, ' + typeof (rejectCallback) + ' given');
    }

    const _checkParameter = function(obj: unknown, key: string) {
        if (! isPlainObject(obj)) {
            throw new Error('First argument must be an object');
        }
        if (obj.hasOwnProperty(key) && obj[key] && typeof (obj[key]) !== 'function') {
            throw new Error(`${key} property must be a function, ${typeof (obj[key])} given`);
        }
    }

    return function () {
        const args: any[] = Array.prototype.slice.call(arguments);

        _checkParameter(args[0], resolveCallback);
        if(isString(rejectCallback, true)) {
            _checkParameter(args[0], rejectCallback);
        }

        return new Promise((resolve, reject) => {
            try {
                type Result = {
                    current: Nullable<HTMLIFrameElement>
                }
                const result: Result = {
                    current: null
                };

                const callback: Function = (args[0][resolveCallback]);
                args[0][resolveCallback] =
                    typeof (callback) === 'function'
                        ? function () {
                            callback.apply(null, Array.prototype.slice.call(arguments));
                            resolve(result.current);
                        }
                        : function () {
                            resolve(result.current);
                        }

                result.current = fn.apply(null, args);
            }
            catch (e) {
                reject(e);
            }
        });
    }
};

const ANIMATION_FALLBACK_TIMEOUT: number = 1000;

const cssTransitionBasedAnimate = function(node: HTMLElement, beforeClass: string, animationClass: string) : Promise<void> {

    return new Promise((resolve, reject) => {
        const displayValue = node.style.display === 'none' ? 'block' : 'none';

        let fallbackTimeout: number | undefined = setTimeout(() => {
            resolve();
        }, ANIMATION_FALLBACK_TIMEOUT);

        const onTransitionEnd = function () {

            clearTimeout(fallbackTimeout);

            node.removeEventListener(transitionEnd, onTransitionEnd);

            removeClassName(node, [
                beforeClass,
            ]);

            resolve();
        }

        const prefferedAnimation = animationPreference();

        if(prefferedAnimation) {
            node.addEventListener(
                transitionEnd,
                onTransitionEnd
            );
        }

        addClassName(node, beforeClass);

        setTimeout(function () {
            addClassName(node, animationClass)

            if(! prefferedAnimation) {
                onTransitionEnd();
            }
        }, 40);
    });
};

const safeJSONParse = function (str: Nullable<string>): Nullable<Record<string, any>> {
    if (typeof (str) !== 'string') {
        return str;
    }

    try {
        return JSON.parse(str);
    }
    catch (e) {
        console.error('Error parsing JSON string:', e);
        return null;
    }
}

function isSafari(): boolean {
    const ua: string = navigator.userAgent;
    const isSafariBrowser: boolean =
        /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua);
    return isSafariBrowser;
}


const isMobileScreenMq: string = getComputedStyle(document.documentElement).getPropertyValue("--is-mobile-screen-mq").trim();
function isMobileScreen(): boolean {
    return window.matchMedia(isMobileScreenMq).matches;
}

let _touchDevice!: boolean;
const isTouchDevice = function(): boolean {
    if(_touchDevice === undefined) {
        const mq: string = getComputedStyle(document.documentElement)
            .getPropertyValue("--is-touch-device-mq")
            .trim();

        _touchDevice = window.matchMedia(mq).matches;
    }

    return _touchDevice;
}

let preferAnimation:Nullable<boolean> = null;

function checkReducedMotionPreference(): void {
    if (window.matchMedia) {
        const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
        preferAnimation = !mediaQueryList.matches;

        mediaQueryList.addEventListener('change', (event) => {
            preferAnimation = !event.matches;
        });
    }
}

const animationPreference = function(): boolean {
    if(preferAnimation === null) {
        checkReducedMotionPreference();
    }

    return Boolean(preferAnimation);
}

const dedupePromise = function<F extends (...args: any[]) => Promise<any>>(fn: F, once: boolean = false): F {
    let currentPromise: Nullable<Promise<any>> = null;
    let isResolved: boolean = false;
    let promiseResult: unknown;

    return function (this: any, ...args: Parameters<F>): ReturnType<F> {
        if (! currentPromise) {

            if(once && isResolved) {
                return Promise.resolve(promiseResult) as ReturnType<F>;
            }

            const result: Promise<any> = fn.apply(this, args);

            if(result instanceof Promise) {
                currentPromise = result;
            }
            else {
                currentPromise = new Promise((resolve) => {
                    resolve(result);
                });
            }

            result
                .then((result: unknown) => {
                    if (once) {
                        isResolved = true;
                        promiseResult = result;
                    }

                    return result;
                })
                .finally(() => {
                    currentPromise = null;
                });
        }

        return currentPromise as ReturnType<F>;
    } as unknown as F;
}

type CallbackFunction<T1 = void> = (value: T1 | PromiseLike<T1>) => void;

export type PromiseWithResolve<T> = {
    promise: Promise<T>;
    resolve: CallbackFunction<T>;
    reject: CallbackFunction<any>;
};

const promiseWithResolversPolyfill = function <T = any>(): PromiseWithResolve<T> {
    let resolve!: CallbackFunction<T>;
    let reject!: CallbackFunction<any>;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

const promiseWithResolve = function <T = any>(): PromiseWithResolve<T> {
    if (typeof Promise.withResolvers === 'function') {
        return Promise.withResolvers<T>();
    }

    return promiseWithResolversPolyfill<T>();
};

const asyncEmbedIframe = callbackFuncToAsync(embedIframe, 'onload', 'onerror');

export {
    uuid,
    genId,
    isString,
    addClassName,
    removeClassName,
    dispatchEvent,
    getAttr,
    unescapeHTML,
    isPlainObject,
    buildQueryString,
    addStyleToDocument,
    scalarToBoolean,
    toDecimal,
    isSafari,
    isMobileScreen,
    isTouchDevice,
    safeJSONParse,
    transitionEnd,
    compartmentalizeCssValue,
    parseClassNames,
    embedIframe,
    cssTransitionBasedAnimate,
    iframeRPC,
    asyncEmbedIframe,
    animationPreference,
    dedupePromise,
    promiseWithResolve
}
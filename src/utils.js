const uuid = function () {
    return 'xxxxxxxx-xxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const isString = function (value, notEmpty = false) {
    if (typeof value !== 'string') {
        return false;
    }

    if (notEmpty && value.length === 0) {
        return false;
    }

    return true;
}

const addClassName = function (node, classNames) {

    if(! (node instanceof Node)) {
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

const removeClassName = function(el, classNames) {
        
    if(!el instanceof Node) {
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

const dispatchEvent = function(node, name, opts = {})
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

const stringToJSON = function (str, error = false) {
    if (typeof (str) !== 'string') {
        if (error) {
            throw new Error('str argument must be a string, ' + typeof (str) + ' given');
        }
        return null;
    }

    try {
        return JSON.parse(str);
    }
    catch (e) {
        if (error) {
            throw e;
        }
    }

    return null;
}

const unescapeHTML = function (str) {
    if (typeof (str) !== 'string') {
        return str;
    }

    var div = document.createElement('div');
    div.innerHTML = str;
    return div.firstChild.nodeValue;
}

const scalarToBoolean = function (str, defaultVal = false) {
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

const toDecimal = function (str) {
    return parseInt(str, 10);
}

const toColor = function (str, defaultVal = null) {
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

const toPercent = function (str, defaultVal = null) {
    if (/^\d+(\.\d+)?%$/.test(str)) {
        return str;
    }

    return defaultVal;
}

const toUrl = function (str, defaultVal = null) {
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

const doCast = function (fnCast, val) {
    if (val === null || val === undefined) {
        return null;
    }

    return fnCast(val);
}

const compartmentalizeCssValue = function (str, defaultVal = null) {
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

const getAttr = function (el, name) {
    let fnCast = String;
    let defaultVal = null;

    if (arguments.length > 2) {
        const supportedTypes = {'string': String, 'decimal': toDecimal, 'number': Number, 'boolean': scalarToBoolean, 'bool': scalarToBoolean, 'color': toColor, 'url': toUrl};
        if (! supportedTypes.hasOwnProperty(arguments[2])) {
            throw new Error('3rd arg must be one of the following types: '+Object.keys(supportedTypes).join(', '));
        }
        fnCast = supportedTypes[arguments[2]];
        defaultVal = arguments[3];
    }
    else if (arguments.length === 3) {
        defaultVal = arguments[2];
    }

    if (el instanceof Element) {
        if ('getAttribute' in el) {
            return doCast(fnCast, unescapeHTML(el.getAttribute(name))) ?? defaultVal;
        }
        else {
            let attrs = Array.prototype.slice.call(el.attributes);

            for(let i = 0, len = attrs.length; i < len; i++) {
                if(attrs[i].nodeName === name) {
                    return doCast(fnCast, unescapeHTML(attrs[i].nodeValue)) ?? defaultVal;
                }
            }
        }
    }

    return null;
}

const isPlainObject = function(obj) {
    return Object.prototype.toString.apply(obj) === '[object Object]'
}

const buildQueryString = function(params) {
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

const parseClassNames = function (classNames) {
    if (typeof (classNames) === 'string' && classNames.length) {
        return classNames;
    }
    else if (isPlainObject(classNames)) {
        return Object.keys(classNames).filter(function (className) {
            return classNames[className] !== false;
        }).join(' ');
    }
    else if(Array.isArray(classNames)) {
        return classNames.join(' ');
    }

    return null;
}

const addStyleToDocument = function(cssText = '', parent = null) {
    let styleNode = document.createElement('STYLE');

    styleNode.type = 'text/css';

    if(styleNode.styleSheet) {
        styleNode.styleSheet.cssText = cssText
    }
    else {
        styleNode.appendChild(document.createTextNode(cssText))
    }

    if(!(parent instanceof Element)) {
        parent = document.head || document.getElementsByTagName('head')[0]
    }

    parent.appendChild(styleNode)
}

const transitionEnd = (function() {

    var transitions = {
        "transition"      : "transitionend",
        "OTransition"     : "oTransitionEnd",
        "MozTransition"   : "transitionend",
        "WebkitTransition": "webkitTransitionEnd"
    };

    var fakeEl = document.createElement('div');

    for(var t in transitions) {
        if(fakeEl.style[t] !== undefined) {
            return transitions[t]
        }
    }

    return null;
})();

const iframeRPC = function (iframe, event, data = null) {

    let payload = {
        rpcId: uuid(),
        type: event
    };

    if (data) {
        if (typeof (data) === 'string') {
            data = stringToJSON(data);
        }

        if (typeof (data) !== 'object') {
            throw new Error('data argument must be an object, ' + typeof (data) + ' given');
        }

        payload = Object.assign({}, data, payload);
    }

    if(iframe instanceof HTMLIFrameElement) {
        iframe.contentWindow.postMessage(JSON.stringify(payload), '*')

        return payload.rpcId;
    }

    return null;
}

const sanitizeOnMessageEvent = function(e) {
    let data = {}

    if(e.data) {
        if(typeof(e.data) === 'string') {
            try {
                data = JSON.parse(e.data);
            }
            catch(e) {
                console.error(e);
            }
        }
        else {
            data = e.data;
        }
    }

    return data;
}

const embedIframe = function ({ rootElement, url, onload, onerror, className, inlineStyles })
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

const callbackFuncToAsync = function (fn, resolveCallback, rejectCallback) {
    if (typeof (resolveCallback) !== 'string') {
        throw new Error('resolveCallback argument must be a string, ' + typeof (resolveCallback) + ' given');
    }

    if (rejectCallback && typeof (rejectCallback) !== 'string') {
        throw new Error('rejectCallback argument must be a string or null, ' + typeof (rejectCallback) + ' given');
    }

    const _checkParameter = function(obj, key) {
        if (! isPlainObject(obj)) {
            throw new Error('First argument must be an object');
        }
        if (obj.hasOwnProperty(key) && obj[key] && typeof (obj[key]) !== 'function') {
            throw new Error(`${key} property must be a function, ${typeof (obj[key])} given`);
        }
    }

    return function () {
        const args = Array.prototype.slice.call(arguments);

        _checkParameter(args[0], resolveCallback);
        _checkParameter(args[0], rejectCallback);

        return new Promise((resolve, reject) => {
            try {
                const result = {
                    current: null
                };

                const callback = (args[0][resolveCallback]);
                args[0][resolveCallback] =
                    typeof (callback) === 'function'
                        ? function () {
                            callback.apply(null, Array.prototype.slice.call(arguments));
                            resolve(result.current);
                        }
                        : function () {
                            resolve(result.current);
                        }

                result.current = embedIframe.apply(null, args);
            }
            catch (e) {
                reject(e);
            }
        });
    }
};

const ANIMATION_FALLBACK_TIMEOUT = 1000;

const cssTransitionBasedAnimate = function(node, beforeClass, animationClass) {

    return new Promise((resolve, reject) => {
        const displayValue = node.style.display === 'none' ? 'block' : 'none';

        let fallbackTimeout = setTimeout(() => {
            resolve();
        }, ANIMATION_FALLBACK_TIMEOUT);

        const onTransitionEnd = function (e) {

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

const safeJSONParse = function (str) {
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

function isSafari() {
    const ua = navigator.userAgent;
    const isSafariBrowser =
        /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua);
    return isSafariBrowser;
}


const isMobileScreenMq = getComputedStyle(document.documentElement).getPropertyValue("--is-mobile-screen-mq").trim();
function isMobileScreen() {
    return window.matchMedia(isMobileScreenMq).matches;
}

let _touchDevice = null;
const isTouchDevice = function() {
    if(_touchDevice === null) {
        const mq = getComputedStyle(document.documentElement)
            .getPropertyValue("--is-touch-device-mq")
            .trim();

        _touchDevice = window.matchMedia(mq).matches;
    }

    return _touchDevice;
}

let preferAnimation = null;

function checkReducedMotionPreference() {
    if (window.matchMedia) {
        const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
        preferAnimation = !mediaQueryList.matches;

        mediaQueryList.addEventListener('change', (event) => {
            preferAnimation = !event.matches;
            console.info('somebody change preferAnimation', preferAnimation);
        });
    }
}

const animationPreference = function() {
    if(preferAnimation === null) {
        checkReducedMotionPreference();
    }

    return preferAnimation;
}

const singletonPromise = function(fn) {
    let currentPromise = null;

    return function (...args) {
        if (!currentPromise) {
            const tempPromise = fn.apply(this, args);
            if(! (tempPromise instanceof Promise)) {
                throw new Error('Function must return a Promise');
            }

            currentPromise = tempPromise
                .finally(() => {
                    currentPromise = null;
                });
        }
        return currentPromise;
    };
}

const asyncEmbedIframe = callbackFuncToAsync(embedIframe, 'onload', 'onerror');

export {
    uuid,
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
    sanitizeOnMessageEvent,
    parseClassNames,
    embedIframe,
    cssTransitionBasedAnimate,
    iframeRPC,
    asyncEmbedIframe,
    animationPreference,
    singletonPromise
}
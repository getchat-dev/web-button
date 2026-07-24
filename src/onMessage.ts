import { safeJSONParse, isPlainObject } from './utils';

let _events: Record<string, Function[]> = {};

/**
 * True when the string could be a JSON object — an opening brace after optional whitespace.
 */
const looksLikeJSONObject = function (str: string): boolean {
    return /^\s*\{/.test(str);
}

window.addEventListener('message', function (e: MessageEvent): void {
    var data: Record<string, any> | null = {};

    if(e.data) {
        if(typeof(e.data) === 'string') {
            // This listener sees every message posted to the host page, including those from
            // analytics scripts, other widgets and browser extensions, which use string
            // protocols of their own (Yandex Metrika, for one, sends `__ym__…` markers).
            // Strings that cannot be our payload are dropped without parsing — running them
            // through safeJSONParse would log a JSON error for each foreign message.
            data = looksLikeJSONObject(e.data) ? safeJSONParse(e.data)! : null;
        }
        else {
            data = e.data;
        }
    }

    if (data?.type) {
        if (Array.isArray(_events?.[data.type]) && _events[data.type].length) {
            _events[data.type] = _events[data.type].filter(handler => {
                try {
                    return (handler(e, data) !== -1);
                } catch (handlerError) {
                    console.error("Error in onMessage handler:", handlerError);
                    return true;
                }
            });
        }
    }
});

const addHandler = function (key: string, handler: Function) {
    if(typeof(key) === 'string' && typeof(handler) === 'function') {
        if(!_events.hasOwnProperty(key)) {
            _events[key] = [];
        }

        _events[key].push(handler);
    }
}

export default function(...args: unknown[]): void {
    let events: Record<string, Function[]> = {};

    // we have a smart function that can be passed to as a single object
    // onMessage({'EventName': () => {}, 'EventName2': [() => {}, () => {}]});
    if (args.length === 1) {
        if(isPlainObject(args[0])) {
            events = args[0];
        }
    }
    // as well as the event name and function sequence
    // onMessage('EventName', () => {}, () => {});
    else if(args.length > 1) {
        if(typeof(args[0]) === 'string') {
            events[args[0]] = [];

            let callbacks = Array.prototype.slice.call(args, 1);

            const sourceFrame =
                (callbacks[callbacks.length - 1] instanceof HTMLIFrameElement)
                    ? callbacks.pop()
                    : null

            if(callbacks.length) {
                for(let i = 0, end = callbacks.length; i < end; i++) {
                    if (typeof (callbacks[i]) === 'function') {
                        if (sourceFrame) {
                            const fn: Function = callbacks[i];
                            callbacks[i] = function (event: MessageEvent, data: Record<string, any> | null): unknown {
                                if (event.source && 'window' in event.source && sourceFrame.contentWindow === event.source?.window) {
                                    return fn(event, data);
                                }
                            }
                        }
                        events[args[0]].push(callbacks[i]);
                    }
                }
            }
        }
    }

    if(Object.keys(events).length) {
        for(let key in events) {
            if(typeof(events[key]) === 'function') {
                addHandler(key, events[key]);
            }
            else if(typeof(events[key]) === 'object' && Object.prototype.toString.call(events[key]) === '[object Array]') {
                for(let i in events[key]) {
                    addHandler(key, events[key][i]);
                }
            }
        }
    }
}
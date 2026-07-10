import { genId } from '@/utils';

import type { HandshakeMessageRequest, ProtocolMessageRequest } from './timer-worker';
import type { Nullable } from '@/types';

export interface CreatedSharedWorker {
    sendMessage: (message: ProtocolMessageRequest) => Promise<any>;
    addMessageListener: (event: string, handler: (event: MessageEvent) => void, options?: Nullable<AddMessageListenerOptions>) => void;
    removeMessageListener: (event: string, handler: Nullable<(event: MessageEvent) => void>) => void;
}

type AddMessageListenerOptions = {
    once?: boolean;
};

type ListenerTuple = [(event: MessageEvent) => void, Nullable<AddMessageListenerOptions>];
type MessageListeners = Map<MessagePort, Record<string, ListenerTuple[]>>;
const messageListeners: MessageListeners = new Map();

const addMessageListener = (port: MessagePort, event: string, handler: (event: MessageEvent) => void, options?: Nullable<AddMessageListenerOptions>) => {
    if (!messageListeners.has(port)) {
        messageListeners.set(port, {});
    }
    if( !messageListeners.get(port)![event]?.length ) {
        messageListeners.get(port)![event] = [];
    }

    const tuple: ListenerTuple = [handler, options];
    messageListeners.get(port)![event].push(tuple);
};

const removeMessageListener = (port: MessagePort, event: string, handler: Nullable<(event: MessageEvent) => void> = null) => {
    if (!messageListeners.has(port)) return;
    const listeners = messageListeners.get(port);
    if (!listeners || !listeners[event]) return;

    if(typeof handler !== 'function') {
        delete listeners[event];
        return;
    }

    if (listeners[event].length === 0) {
        delete listeners[event];
    }
    else {
        listeners[event] = listeners[event].filter(([h]) => h !== handler);
    }
};

export type createSharedWorkerFn = (options?: WorkerOptions) => SharedWorker;

const callMessageListener = async(port: MessagePort, event: string) => {
    const listeners = messageListeners.get(port)?.[event];
    if (listeners?.length) {
        const _listeners: ListenerTuple[] = [];
        for(let i = 0; i < listeners.length; i++) {
            const [handler, options] = listeners[i];
            try {
                const result: unknown = await handler(new MessageEvent(event, { data: port }));
                if (! (options?.once === true || result === -1)) {
                    _listeners.push(listeners[i]); // Keep the listener if it should not be removed
                }
            } catch (e) {
                console.error(`[SharedWorker] Error in message listener for event "${event}":`, e);
            }
        }

        if( _listeners.length > 0 ) {
            messageListeners.get(port)![event] = _listeners;
        }
        else {
            delete messageListeners.get(port)![event];
        }
    }
}

export async function createSharedWorker(workerUrl: string | createSharedWorkerFn, options?: WorkerOptions): Promise<Nullable<CreatedSharedWorker>> {
    return new Promise((resolve, reject) => {
        let worker: SharedWorker;
        let port!: MessagePort;

        try {
            if (typeof workerUrl === 'string') {
                worker = new SharedWorker(workerUrl, options);
            }
            else if(workerUrl instanceof Function) {
                worker = workerUrl(options);
            }
            else {
                console.error('[SharedWorker] Invalid worker URL:', workerUrl);
                reject(new Error('[SharedWorker] Invalid worker URL'));
                return;
            }

            worker.onerror = (e) => {
                console.error(`[SharedWorker] Error in SharedWorker${options?.name ? ` "${options.name}"` : ''}:`, e);
                reject(e);
            }

            port = worker.port;
            port.start();
        }
        catch (e) {
            console.error(`[SharedWorker] Failed to create SharedWorker${options?.name ? ` "${options.name}"` : ''}:`, e);
            // return fallbackTimers();
            reject(e);
        }

        const sendMessage = (message: ProtocolMessageRequest) => {
            return new Promise<void>((resolve, reject) => {
                try {
                    if(! (typeof(message?.requestId) === 'string' && message.requestId.length > 0)) {
                        message.requestId = genId();
                    }

                    addMessageListener(port, message.requestId, (event) => {
                        resolve(event?.data?.value);
                    }, { once: true });

                    port.postMessage(message);
                } catch (e) {
                    console.error('[SharedWorker] Failed to post message:', e);
                    reject(e);
                }
            });
        };

        const handshakeRequest: HandshakeMessageRequest = {
            type: 'handshake',
            requestId: Math.random().toString(36).slice(2),
            url: location.href,
            visible: true
        };

        let timeout = setTimeout(() => {
            console.error('[SharedWorker] Handshake timed out');
            reject(new Error('[SharedWorker] Handshake timed out'));

            port?.close();
        }, 2_000);

        sendMessage(handshakeRequest)
            .then((response) => {
                clearTimeout(timeout);

                resolve({
                    sendMessage,
                    addMessageListener: addMessageListener.bind(null, port),
                    removeMessageListener: removeMessageListener.bind(null, port)
                });
            })
            .catch((error) => {
                console.error('[SharedWorker] Handshake failed:', error);
                reject(error);
            });

        port.onmessage = (event: MessageEvent) => {
            const id = event.data as number;
            const { requestId, type } = event.data;

            if(requestId && typeof(requestId) === 'string') {
                callMessageListener(port, requestId);
            }
        };
    });
}

// timers.ts
// export const workerUrl = new URL('./timer-worker.ts', import.meta.url).toString();
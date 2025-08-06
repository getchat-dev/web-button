declare var onconnect: (event: MessageEvent & { ports: MessagePort[] }) => void;

// import { genId } from '@/utils?inline';

type TimerId = ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>;

const innerIdsByOuterIds = new Map<string | number, TimerId>();

const syncTimeouts = new Map<
    number,
    {
        timerId: ReturnType<typeof setTimeout>,
        listeners: { port: MessagePort, id: string | number }[]
    }
>();

type ClientInfo = {
    clientId: string;
    port: MessagePort;
    url: string;
    connectTs: number;
    lastMessageTs: number;
    visible: boolean;
    lastVisibilityTs: number;
}

const clients = new Map<string, ClientInfo>();

const PROTOCOL_MESSAGE_ERRORS = ['UnknownRequest', 'requestIdMissing', 'invalidRequestId', 'clientNotFound', 'invalidParameters'] as const;
export type ProtocolMessagesErrorCode = typeof PROTOCOL_MESSAGE_ERRORS[number];

export type ProtocolMessageResponseError = {
    type: 'error';
    requestId: string | number;
    code: ProtocolMessagesErrorCode;
    message: string;
    data?: any;
};

export type ProtocolMessageRequest = {
    requestId: string | number;
    type: string;
};

export type HandshakeMessageRequest = ProtocolMessageRequest & {
    type: 'handshake';
    clientId?: string;
    url?: string;
    visible?: boolean;
};

export type ClientInfoMessageRequest = ProtocolMessageRequest & {
    type: 'getClientData';
    clientId: string;
};

export type HandleClientVisibilityMessageRequest = ProtocolMessageRequest & {
    type: 'visibilityChanged';
    clientId: string;
    visible: boolean;
};

export type SetTimeoutMessageRequest = ProtocolMessageRequest & {
    type: 'setTimeout' | 'setSyncTimeout';
    id?: string | number;
    timeout: number;
};

export type SetIntervalMessageRequest = ProtocolMessageRequest & {
    type: 'setInterval';
    id?: string | number;
    timeout: number;
};

export type ClearTimeoutMessageRequest = ProtocolMessageRequest & {
    type: 'clearTimeout' | 'clearSyncTimeout';
    id: string | number;
};

export type ClearIntervalMessageRequest = ProtocolMessageRequest & {
    type: 'clearInterval';
    id: string | number;
};

export type MessageRequest = HandshakeMessageRequest | ClientInfoMessageRequest | HandleClientVisibilityMessageRequest | SetTimeoutMessageRequest | SetIntervalMessageRequest | ClearTimeoutMessageRequest | ClearIntervalMessageRequest;

export type MessageResponse = {
    requestId: string | number;
    type: 'response';
    value: unknown;
} | ProtocolMessageResponseError;

type Handler = (port: MessagePort, data: any) => void;

const genId = function getId(): string {
    return Math.random().toString(36).slice(2);
}

const handleHanshake: Handler = (port, data: HandshakeMessageRequest) => {
    const clientId = data.clientId || crypto.randomUUID?.() || genId();

    clients.set(clientId, {
        clientId,
        port: port,
        url: data.url || '',
        connectTs: Date.now(),
        lastMessageTs: Date.now(),
        visible: data.visible ?? false,
        lastVisibilityTs: Date.now()
    });

    const response: MessageResponse = {
        requestId: data.requestId,
        type: 'response',
        value: {
            clientId,
            workerTime: Date.now(),
            workerVersion: process.env.VERSION
        }
    };

    port.postMessage(response);
}

const handleClientData: Handler = (port, data: ClientInfoMessageRequest) => {
    if (data.clientId && clients.has(data.clientId)) {
        const client: ClientInfo = clients.get(data.clientId)!;
        type ClientInfoResult = Omit<ClientInfo, 'port'>;

        const response: MessageResponse = {
            requestId: data.requestId,
            type: 'response',
            value: {
                clientId: client.clientId,
                url: client.url,
                connectTs: client.connectTs,
                lastMessageTs: client.lastMessageTs,
                visible: client.visible,
                lastVisibilityTs: client.lastVisibilityTs
            } as ClientInfoResult
        };

        port.postMessage(response);

        return;
    }

    const notFoundResponse: ProtocolMessageResponseError = {
        type: 'error',
        requestId: data.requestId,
        code: 'clientNotFound',
        message: `Client with ID "${data.clientId}" not found`
    };

    port.postMessage(notFoundResponse);
}

const handleClientVisibilityChange: Handler = (port, data: HandleClientVisibilityMessageRequest) => {
    if (data.clientId && clients.has(data.clientId)) {

        const client: ClientInfo = clients.get(data.clientId)!;
        clients.set(data.clientId, {
            ...client,
            visible: data.visible ?? client.visible,
            lastVisibilityTs: Date.now()
        });

        const response: MessageResponse = {
            requestId: data.requestId,
            type: 'response',
            value: true
        };

        port.postMessage(response);

        return;
    }

    const notFoundResponse: ProtocolMessageResponseError = {
        type: 'error',
        requestId: data.requestId,
        code: 'clientNotFound',
        message: `Client with ID "${data.clientId}" not found`
    };

    port.postMessage(notFoundResponse);
}

const handlers: Record<string, Handler> = {
    handshake: handleHanshake,
    getClientData: handleClientData,
    visibilityChanged: handleClientVisibilityChange,

    setSyncTimeout: (port, data: SetTimeoutMessageRequest) => {
        if (typeof data.timeout !== 'number' || !Number.isFinite(data.timeout) || data.timeout <= 0) {
            const errorResponse: ProtocolMessageResponseError = {
                type: 'error',
                requestId: data.requestId,
                code: 'invalidParameters',
                message: `Invalid timeout value "${data.timeout}"`
            };
            port.postMessage(errorResponse);
            return;
        }

        const id = data?.id ?? genId();
        port.postMessage({ type: 'response', requestId: data.requestId, value: id });

        const timeoutValue = data.timeout;
        let syncEntry = syncTimeouts.get(timeoutValue);

        if (!syncEntry) {
            // Align to the next multiple of timeoutValue from now
            const now = Date.now();
            const remainder = now % timeoutValue;
            const delay = timeoutValue - remainder;

            syncEntry = { timerId: null as any, listeners: [] };
            syncTimeouts.set(timeoutValue, syncEntry);

            syncEntry.timerId = setTimeout(() => {
                // Notify all waiting listeners
                console.info('[TimerWorker] Sync timeout triggered for', timeoutValue, 'ms', {...syncEntry});
                syncEntry!.listeners.forEach(({ port, id }) => {
                    port.postMessage({ type: 'timeout', requestId: `timeout_${id}` });
                });
                syncTimeouts.delete(timeoutValue);
            }, delay);
        }

        // Register this tab’s listener
        syncEntry.listeners.push({ port, id });
    },

    clearSyncTimeout: (port, data: ClearTimeoutMessageRequest) => {
        const { id } = data;
        let foundTimeoutValue: number | undefined;

        for (const [timeoutValue, entry] of syncTimeouts.entries()) {
            const beforeLen = entry.listeners.length;
            entry.listeners = entry.listeners.filter(listener => listener.id !== id);

            if (entry.listeners.length !== beforeLen) {
                foundTimeoutValue = timeoutValue;
                // If no listeners remain, cancel the timer entirely
                if (entry.listeners.length === 0) {
                    clearTimeout(entry.timerId);
                    syncTimeouts.delete(timeoutValue);
                }

                break;
            }
        }

        // Send confirmation
        port.postMessage({
            requestId: data.requestId,
            type: 'response',
            value: foundTimeoutValue !== undefined
        });
    },

    setTimeout: (port, data: SetTimeoutMessageRequest) => {

        if (typeof data.timeout !== 'number' || !Number.isFinite(data.timeout) || data.timeout < 0) {
            const errorResponse: ProtocolMessageResponseError = {
                type: 'error',
                requestId: data.requestId,
                code: 'invalidParameters',
                message: `Invalid timeout value "${data.timeout}"`
            };

            port.postMessage(errorResponse);

            return;
        }

        const id = data?.id ?? genId();

        port.postMessage({ type: 'response', requestId: data.requestId, value: id });

        innerIdsByOuterIds.set(id, setTimeout(() => {
            port.postMessage({ type: 'timeout', requestId: `timeout_${id}` });
            innerIdsByOuterIds.delete(id);
        }, data.timeout));
    },

    setInterval: (port, data: SetIntervalMessageRequest) => {

        if (typeof data.timeout !== 'number' || !Number.isFinite(data.timeout) || data.timeout < 0) {
            const errorResponse: ProtocolMessageResponseError = {
                type: 'error',
                requestId: data.requestId,
                code: 'invalidParameters',
                message: `Invalid timeout value "${data.timeout}"`
            };

            port.postMessage(errorResponse);

            return;
        }

        const id = data?.id ?? genId();

        port.postMessage({ type: 'response', requestId: data.requestId, value: id });

        innerIdsByOuterIds.set(data.requestId, setInterval(() => {
            port.postMessage({ type: 'interval', requestId: `interval_${id}` });
        }, data.timeout));
    },

    clearTimeout: (port, data: ClearTimeoutMessageRequest) => {
        const timer = innerIdsByOuterIds.get(data.id);
        if (timer) clearTimeout(timer as ReturnType<typeof setTimeout>);
        innerIdsByOuterIds.delete(data.id);
    },

    clearInterval: (port, data: ClearIntervalMessageRequest) => {
        const timer = innerIdsByOuterIds.get(data.id);
        if (timer) clearInterval(timer as ReturnType<typeof setInterval>);
        innerIdsByOuterIds.delete(data.id);
    },
};

const handleMessage = (port: MessagePort, event: MessageEvent) => {
    const data = event.data as MessageRequest;

    console.info('[TimerWorker] Received message:', data);

    if (data && typeof data.type === 'string' && handlers[data.type]) {
        if (!(typeof data?.requestId === 'string')) {
            const errorResponse: ProtocolMessageResponseError = {
                type: 'error',
                requestId: data?.requestId,
                code: 'requestIdMissing',
                message: 'Request ID is missing or invalid',
                data
            };

            port.postMessage(errorResponse);

            return;
        }

        handlers[data.type](port, data);
    }
    else {
        port.postMessage({
            requestId: data?.requestId,
            code: 'UnknownRequest',
            message: `Unknown or missing type "${data?.type}"`
        });
    }
};

self.onconnect = (event: MessageEvent & { ports: MessagePort[] }) => {
    console.info('[TimerWorker] Connection established with port:', event.ports[0]);
    const port = event.ports[0];
    port.onmessage = (event: MessageEvent) => handleMessage(port, event);
};

console.info('[TimerWorker] Timer worker initialized and ready to handle messages.');
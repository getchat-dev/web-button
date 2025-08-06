import { genId } from '@/utils';

import type { CreatedSharedWorker } from '@/createSharedWorker';

import type { SetTimeoutMessageRequest, SetIntervalMessageRequest, ClearTimeoutMessageRequest, ClearIntervalMessageRequest } from './timer-worker';

export type TimerCallback = () => void;


export interface SharedWorkerTimer {
    setSyncTimeout: (cb: TimerCallback, ms: number) => string | number | undefined;
    clearSyncTimeout: (id: string | number) => void;
    setTimeout: (cb: TimerCallback, ms: number) => string | number | undefined;
    clearTimeout: (id: string | number) => void;
    setInterval: (cb: TimerCallback, ms: number) => string | number | undefined;
    clearInterval: (id: string | number) => void;
}

export function createTimerWorker(
    worker: CreatedSharedWorker
): SharedWorkerTimer {

    return {
        setSyncTimeout: (cb: TimerCallback, ms: number): string | number | undefined => {
            if (typeof cb !== 'function') {
                throw new Error('setSyncTimeout requires a callback function');
            }

            const id = genId();

            worker.sendMessage({
                requestId: genId(),
                type: 'setSyncTimeout',
                timeout: ms,
                id
            } as SetTimeoutMessageRequest).then((_id: any) => {

                worker.addMessageListener(`timeout_${_id ?? id}`, () => {
                    try {
                        cb();
                    }
                    catch (err) {
                        console.error('[SharedWorker] Error in timeout callback:', err);
                    }
                }, {once: true});
            })
            .catch((error: Error | string) => {
                console.error(error);
            });

            return id;
        },

        clearSyncTimeout: (id: string | number) => {
            worker.sendMessage({
                requestId: genId(),
                type: 'clearSyncTimeout',
                id
            } as ClearTimeoutMessageRequest);

            worker.removeMessageListener(`timeout_${id}`, null);
        },

        setTimeout: (cb: TimerCallback, ms: number): string | number | undefined => {
            if (typeof cb !== 'function') {
                throw new Error('setTimeout requires a callback function');
            }

            const id = genId();

            worker.sendMessage({
                requestId: genId(),
                type: 'setTimeout',
                timeout: ms,
                id
            } as SetTimeoutMessageRequest).then((_id: any) => {

                worker.addMessageListener(`timeout_${_id ?? id}`, () => {
                    try {
                        cb();
                    }
                    catch (err) {
                        console.error('[SharedWorker] Error in timeout callback:', err);
                    }
                }, {once: true});
            })
            .catch((error: Error | string) => {
                console.error(error);
            });

            return id;
        },
        clearTimeout: (id: string | number) => {
            worker.sendMessage({
                requestId: genId(),
                type: 'clearTimeout',
                id
            } as ClearTimeoutMessageRequest);

            worker.removeMessageListener(`timeout_${id}`, null);
        },
        setInterval: (cb: TimerCallback, ms: number) => {
            if (typeof cb !== 'function') {
                throw new Error('setTimeout requires a callback function');
            }

            const id = genId();

            worker.sendMessage({
                requestId: genId(),
                type: 'setInterval',
                timeout: ms,
                id
            } as SetIntervalMessageRequest).then((_id: any) => {

                worker.addMessageListener(`interval_${_id ?? id}`, () => {
                    try {
                        cb();
                    }
                    catch (err) {
                        console.warn('[SharedWorker] Error in interval callback:', err);
                    }
                });

                return id;
            })
            .catch((error: Error | string) => {
                console.error(error);
            });

            return id;
        },
        clearInterval: (id: string | number) => {
            worker.sendMessage({
                requestId: genId(),
                type: 'clearInterval',
                id
            } as ClearIntervalMessageRequest);

            worker.removeMessageListener(`interval_${id}`, null);
        }
    };
}

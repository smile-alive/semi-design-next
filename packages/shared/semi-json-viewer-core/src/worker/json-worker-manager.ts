import type { FormattingOptions } from 'jsonc-parser';
import type { IModelContentChangeEvent } from '../common/emitter-events';
import { getCurrentNameSpaceId } from '../common/name-space';

type WorkerService = {
    init: { value: string };
    updateModel: {
        op: IModelContentChangeEvent | IModelContentChangeEvent[];
    };
    format: { options: FormattingOptions };
    foldRange: Record<string, never>;
    validate: Record<string, never>;
    undo: Record<string, never>;
    redo: Record<string, never>;
};

const workerManagerMap = new Map<string, JsonWorkerManager>();

export class JsonWorkerManager {
    #worker: Worker;
    #callbacks: Map<number, { resolve: (result: any) => void; reject: (error: Error) => void }>;
    // A counter, not Date.now() + Math.random(): at epoch-ms magnitude a double keeps only ~4096 distinct
    // fractions per millisecond, so concurrent requests could share an id and get each other's replies
    #nextMessageId = 0;

    constructor() {
        // Replaced at build time by semiInlineJsonWorker with the worker source as a string literal.
        const workerRaw: string = '%WORKER_RAW%';
        const blob = new Blob([workerRaw], { type: 'application/javascript' });
        const workerURL = URL.createObjectURL(blob);
        this.#worker = new Worker(workerURL);
        // the Worker fetched the blob at construction, so the URL can be revoked now
        URL.revokeObjectURL(workerURL);
        this.#callbacks = new Map();

        this.#worker.onmessage = this.#handleWorkerMessage.bind(this);
        this.#worker.onerror = (event) => this.#rejectAll(new Error(event.message || 'JSON worker error'));
        this.#worker.onmessageerror = () => this.#rejectAll(new Error('JSON worker message could not be deserialized'));
    }

    #sendRequest<T extends keyof WorkerService>(method: T, params: WorkerService[T]): Promise<any> {
        return new Promise((resolve, reject) => {
            const messageId = this.#nextMessageId++;
            this.#callbacks.set(messageId, { resolve, reject });
            this.#worker.postMessage({ messageId, method, params });
        });
    }

    #handleWorkerMessage(event: MessageEvent) {
        const { messageId, result, error } = event.data;
        const callback = this.#callbacks.get(messageId);
        if (callback) {
            this.#callbacks.delete(messageId);
            if (error) {
                callback.reject(new Error(error));
            } else {
                callback.resolve(result);
            }
        }
    }

    #rejectAll(error: Error) {
        for (const { reject } of this.#callbacks.values()) {
            reject(error);
        }
        this.#callbacks.clear();
    }

    async init(value: string) {
        await this.#sendRequest('init', { value });
    }

    updateModel(op: IModelContentChangeEvent | IModelContentChangeEvent[]) {
        return this.#sendRequest('updateModel', { op });
    }

    undo() {
        return this.#sendRequest('undo', {});
    }

    redo() {
        return this.#sendRequest('redo', {});
    }

    formatJson(options: FormattingOptions) {
        return this.#sendRequest('format', { options });
    }

    foldRange() {
        return this.#sendRequest('foldRange', {});
    }

    validate() {
        return this.#sendRequest('validate', {});
    }

    dispose() {
        this.#worker.terminate();
        // Pending callbacks are dropped, not rejected: controlled updates dispose and rebuild, so rejecting would only
        // raise unhandled AbortErrors.
        this.#callbacks.clear();
    }
}

export function getJsonWorkerManager() {
    const currentNameSpaceId = getCurrentNameSpaceId();
    if (!currentNameSpaceId) {
        throw new Error('No active worker ID set');
    }

    let workerManager = workerManagerMap.get(currentNameSpaceId);
    if (!workerManager) {
        workerManager = new JsonWorkerManager();
        workerManagerMap.set(currentNameSpaceId, workerManager);
    }
    return workerManager;
}

export function disposeWorkerManager(id: string) {
    const workerManager = workerManagerMap.get(id);
    if (workerManager) {
        workerManagerMap.delete(id);
        workerManager.dispose();
    }
}

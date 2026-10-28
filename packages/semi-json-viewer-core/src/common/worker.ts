const isWebWorker = typeof self === 'object' && self.constructor && self.constructor.name === 'DedicatedWorkerGlobalScope';

export function isInWorkerThread() {
    return isWebWorker;
}

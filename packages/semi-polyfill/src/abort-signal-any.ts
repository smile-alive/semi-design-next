// AbortSignal.any: Safari 17.4. Shim for Safari 17.2 and 17.3.
export {};

// lib.dom declares `any`, so `in` would narrow the constructor to never; the loosened view keeps the check meaningful.
const abortSignal: Partial<typeof AbortSignal> | undefined = typeof AbortSignal === 'undefined' ? undefined : AbortSignal;

if (abortSignal && !('any' in abortSignal)) {
    abortSignal.any = (signals: AbortSignal[]) => {
        const controller = new AbortController();
        const aborted = signals.find((signal) => signal.aborted);
        if (aborted) {
            controller.abort(aborted.reason);
            return controller.signal;
        }
        // the listeners hold only the controller, so an unreachable result stays collectable with its sources alive
        const listeners = signals.map((signal) => {
            const listener = () => {
                signals.forEach((other, index) => other.removeEventListener('abort', listeners[index]));
                controller.abort(signal.reason);
            };
            signal.addEventListener('abort', listener);
            return listener;
        });
        return controller.signal;
    };
}

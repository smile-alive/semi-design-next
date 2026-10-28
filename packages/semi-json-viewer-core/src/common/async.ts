/** Based on https://github.com/microsoft/vscode-json-languageservice with modifications for custom requirements */

export interface IDisposable {
    dispose(): void;
}
type IdleApi = Pick<typeof globalThis, 'requestIdleCallback' | 'cancelIdleCallback'>;

// Safari has no requestIdleCallback; like VS Code, run on a timer and report a 15ms budget
function runOnTimer(runner: (idle: IdleDeadline) => void, timeout?: number): IDisposable {
    const handle = setTimeout(() => {
        const end = performance.now() + 15;
        runner({ didTimeout: true, timeRemaining: () => Math.max(0, end - performance.now()) });
    }, timeout ?? 0);
    return { dispose: () => clearTimeout(handle) };
}

export function _runWhenIdle(targetWindow: IdleApi, runner: (idle: IdleDeadline) => void, timeout?: number): IDisposable {
    if (typeof targetWindow.requestIdleCallback !== 'function') {
        return runOnTimer(runner, timeout);
    }
    const handle = targetWindow.requestIdleCallback(runner, typeof timeout === 'number' ? { timeout } : undefined);
    let disposed = false;
    return {
        dispose() {
            if (disposed) {
                return;
            }
            disposed = true;
            targetWindow.cancelIdleCallback(handle);
        },
    };
}

export function runWhenGlobalIdle(runner: (idle: IdleDeadline) => void, timeout?: number): IDisposable {
    return _runWhenIdle(globalThis, runner, timeout);
}

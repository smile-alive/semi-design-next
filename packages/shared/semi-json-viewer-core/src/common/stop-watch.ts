/** reference from https://github.com/microsoft/vscode */
const hasPerformanceNow = globalThis.performance && typeof globalThis.performance.now === 'function';

export class StopWatch {
    #startTime: number;
    #stopTime: number;
    readonly #now: () => number;

    constructor(highResolution?: boolean) {
        this.#now = hasPerformanceNow && highResolution === false ? Date.now : globalThis.performance?.now.bind(globalThis.performance);
        this.#startTime = this.#now();
        this.#stopTime = -1;
    }

    static create(highResolution?: boolean) {
        return new StopWatch(highResolution);
    }

    stop() {
        this.#stopTime = this.#now();
    }

    reset() {
        this.#startTime = this.#now();
        this.#stopTime = -1;
    }

    elapsed() {
        if (this.#stopTime !== -1) {
            return this.#stopTime - this.#startTime;
        }
        return this.#now() - this.#startTime;
    }
}

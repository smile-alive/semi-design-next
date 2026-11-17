const WIDTH = 30;

/**
 * Counts finished items on one stderr line; does nothing when stderr is not a terminal (CI, pipes, pnpm's parallel
 * prefixes), so logs never carry escape codes. Nothing else may print while it runs: each redraw overwrites the line.
 * Hand-written because @clack/prompts' progress puts stdin in raw mode and exits 0 on Ctrl+C.
 */
export function progress(label: string, total: number) {
    const stream = process.stderr;
    const active = stream.isTTY && !process.env.CI && total > 0;
    const started = performance.now();
    let finished = 0;
    const draw = () => {
        const filled = Math.round((finished / total) * WIDTH);
        const elapsed = ((performance.now() - started) / 1000).toFixed(0);
        const line = `${label} [${'#'.repeat(filled)}${'-'.repeat(WIDTH - filled)}] ${finished}/${total} ${elapsed}s`;
        stream.write(`\r${line.slice(0, stream.columns - 1)}\x1b[K`);
    };
    if (active) draw();
    return {
        track<T, R>(run: (item: T) => Promise<R>) {
            return async (item: T) => {
                const result = await run(item);
                finished++;
                if (active) draw();
                return result;
            };
        },
        done() {
            if (active) stream.write('\r\x1b[K');
        },
    };
}

import { availableParallelism } from 'node:os';

/** Results keep the order of `items` */
export async function mapConcurrent<T, R>(items: readonly T[], run: (item: T) => Promise<R>, concurrency = availableParallelism()) {
    const results: R[] = [];
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await run(items[index]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
    return results;
}

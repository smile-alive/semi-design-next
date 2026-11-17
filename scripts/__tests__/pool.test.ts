import { describe, expect, it } from 'vitest';
import { mapConcurrent } from '../lib/pool.ts';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('mapConcurrent', () => {
    it('returns results in the order of the items, not of completion', async () => {
        const results = await mapConcurrent([30, 10, 20], async (ms) => {
            await sleep(ms);
            return ms;
        });
        expect(results).toEqual([30, 10, 20]);
    });

    it('never runs more than the given number at once', async () => {
        let active = 0;
        let peak = 0;
        await mapConcurrent(
            [1, 2, 3, 4, 5, 6],
            async () => {
                active++;
                peak = Math.max(peak, active);
                await sleep(5);
                active--;
            },
            2
        );
        expect(peak).toBe(2);
    });

    it('resolves to an empty array for no items', async () => {
        expect(await mapConcurrent([], async () => 1)).toEqual([]);
    });
});

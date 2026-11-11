import { beforeEach, vi } from 'vite-plus/test';

// Freeze Date only; re-applied per test because vi.useRealTimers() also drops this mock.
function freezeDate() {
    vi.setSystemTime(new Date('2019-08-08 12:00:00'));
}

export function setupDeterminism() {
    freezeDate();
    beforeEach(freezeDate);

    // Seeded Math.random (mulberry32); assigned, not spied, so restoreMocks keeps it as the baseline.
    let randomSeed = 20190808;
    Math.random = () => {
        randomSeed = (randomSeed + 0x6d2b79f5) | 0;
        let t = Math.imul(randomSeed ^ (randomSeed >>> 15), 1 | randomSeed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

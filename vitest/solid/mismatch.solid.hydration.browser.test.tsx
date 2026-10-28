import { expect, it } from 'vite-plus/test';
import { hydrateServerCase } from './hydration.solid';
import { ssrCases } from './mismatch.solid';

const casesUrl = new URL('./mismatch.solid.tsx', import.meta.url).href;

// Every hydration case passes as well when the client runs a production build, which never reports a mismatch
it.each(ssrCases.map((ssrCase) => [ssrCase.name, ssrCase] as const))('%s 报出 Hydration Mismatch', async (_, ssrCase) => {
    const { report } = await hydrateServerCase(ssrCase.name, casesUrl);
    expect(report.errors.some((error) => error.includes('Hydration Mismatch'))).toBe(true);
});

import { it } from 'vite-plus/test';
import { expectHydratedCase } from '@test/solid/hydration.solid';
import { ssrCases } from './ssr-cases';

const casesUrl = new URL('./ssr-cases.tsx', import.meta.url).href;

it.each(ssrCases.map((ssrCase) => [ssrCase.name, ssrCase] as const))('%s', async (_, ssrCase) => {
    await expectHydratedCase(ssrCase, casesUrl);
});

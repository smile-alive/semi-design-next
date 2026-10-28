import { generateHydrationScript } from 'solid-js/web';
import { ssrCases as aiCases } from '@fibrae/semi-ai-solid/__tests__/ssr-cases';
import { ssrCases as uiCases } from '@fibrae/semi-ui-solid/__tests__/ssr-cases';
import type { ServerCase, SolidSsr } from './hydration-context';
import { ssrCases as mismatchCases } from './mismatch.solid';
import { renderServer, summarizeError } from './ssr.solid';

export async function renderCases(): Promise<SolidSsr> {
    const cases: Record<string, ServerCase> = {};
    for (const ssrCase of [...uiCases, ...aiCases, ...mismatchCases]) {
        const { html, errors } = await renderServer(ssrCase);
        cases[ssrCase.name] = { html, errors: errors.map(summarizeError) };
    }
    return { script: generateHydrationScript(), cases };
}

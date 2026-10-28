import { describe, expect, inject, it } from 'vite-plus/test';
import { expectHydratedCase } from '@test/solid/hydration.solid';
import { crossMidnightPrefix, ssrCases } from './ssr-cases';

const casesUrl = new URL('./ssr-cases.tsx', import.meta.url).href;

const crossMidnightCases = ssrCases.filter((ssrCase) => ssrCase.name.startsWith(crossMidnightPrefix));

it.each(ssrCases.filter((ssrCase) => !crossMidnightCases.includes(ssrCase)).map((ssrCase) => [ssrCase.name, ssrCase] as const))('%s', async (_, ssrCase) => {
    await expectHydratedCase(ssrCase, casesUrl);
});

// The cases hide the markers from the DOM comparison, so this is where "only after hydration" is checked: the server
// HTML, rendered a second before midnight, has none, and the hydrated DOM marks the day the browser is on
describe('calendar/跨日', () => {
    const caseNamed = (mode: string) => {
        const ssrCase = crossMidnightCases.find((item) => item.name === `${crossMidnightPrefix} ${mode}`);
        if (!ssrCase) {
            throw new Error(`no cross-midnight case for ${mode}`);
        }
        return ssrCase;
    };

    it.each(['month', 'week'])('%s 视图的今天标记只在 hydration 后落在客户端的今天', async (mode) => {
        const ssrCase = caseNamed(mode);
        const { html } = inject('solidSsr').cases[ssrCase.name];
        expect(html).not.toContain('aria-current');
        // `-today-date` sits on every date; `-today` alone marks the current one
        expect(html).not.toMatch(/-today(?!-date)/);
        const { mounted } = await expectHydratedCase(ssrCase, casesUrl);
        const marked = new DOMParser().parseFromString(mounted, 'text/html').querySelectorAll('[aria-current="date"]');
        expect(marked).toHaveLength(1);
        expect(marked[0].className).toMatch(/-today(?!-date)/);
        // the server's day is the 1st, the browser's the 2nd
        expect(marked[0].textContent).toMatch(/(?<!\d)2(?!\d)/);
    });

    it('day 视图的当前时间线只在 hydration 后出现', async () => {
        const ssrCase = caseNamed('day');
        expect(inject('solidSsr').cases[ssrCase.name].html).not.toContain('curr-line');
        const { mounted } = await expectHydratedCase(ssrCase, casesUrl);
        expect(mounted).toContain('semi-calendar-grid-curr-line');
    });
});

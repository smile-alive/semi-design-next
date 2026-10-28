// Shared host assertions, ported from the SSR host probes. Page checks run in list order on one hydrated page, so put
// `idsStable()` before the checks that open overlays.
import assert from 'node:assert';
import type { Page } from 'playwright';
// A function passed to evaluate() would need the DOM lib, which tsconfig.node.json lacks, and a string is not called
import { expect } from 'playwright/test';
import type { PageCheck, ServerCheck } from './types.ts';

const SEMI_PRIMARY = 'rgb(0, 100, 250)';
const TIMEOUT = 10_000;
const ID_ATTRIBUTES = ['id', 'for', 'aria-controls', 'aria-labelledby', 'aria-describedby', 'aria-owns'];

const REQUEST_TIMEOUT = 30_000;
const FIRST_PAINT_TIMEOUT = 60_000;

function assertNone(found: string[], message: string) {
    assert.equal(found.length, 0, `${message}: ${found.join('; ')}`);
}

// Hosts serialize their state into scripts; only rendered markup counts as server-rendered
function markup(html: string) {
    return html.slice(Math.max(html.indexOf('<body'), 0)).replaceAll(/<script[\s\S]*?<\/script>/g, '');
}

// The runner appends this to every page
export const consoleClean: PageCheck = {
    name: 'console',
    run: async ({ problems }) => assertNone(problems, 'console errors, pageerrors or hydration warnings'),
};

export function ssrText(name: string, texts: string[]): PageCheck {
    return {
        name,
        run: async ({ html }) =>
            assertNone(
                texts.filter((text) => !markup(html).includes(text)),
                'missing from the server HTML'
            ),
    };
}

// `selector` names a `type="primary" theme="solid"` Button; the class check covers prefixCls variants
export function primaryButton(selector: string, prefixCls = 'semi'): PageCheck {
    return {
        name: 'primary-button',
        run: async ({ page }) => {
            const button = page.locator(selector).first();
            assert.ok((await button.getAttribute('class', { timeout: TIMEOUT }))?.split(' ').includes(`${prefixCls}-button`), `${selector} lacks class ${prefixCls}-button`);
            await expect(button).toHaveCSS('background-color', SEMI_PRIMARY, { timeout: TIMEOUT });
        },
    };
}

// Reads the alpha channel of a computed color. Chrome serializes a Tailwind `/50` color as `color(srgb r g b / 0.5)` or
// `oklab(l a b / 0.5)`, and a plain one as `rgba(r, g, b, 0.5)`; a color without an alpha part, including legacy
// `rgb(r, g, b)`, is opaque
function alphaOf(color: string) {
    const [, inner = ''] = /\((.*)\)$/.exec(color) ?? [];
    const [channels, slashAlpha] = inner.split('/');
    const numbers = (slashAlpha ?? channels).match(/[\d.]+(?:e-?\d+)?%?/g) ?? [];
    const alpha = slashAlpha == null ? (numbers.length === 4 ? numbers[3] : undefined) : numbers[0];
    return alpha == null ? 1 : Number.parseFloat(alpha) / (alpha.endsWith('%') ? 100 : 1);
}

function backgroundOf(page: Page, selector: string) {
    return page.evaluate<string>(`getComputedStyle(document.querySelector(${JSON.stringify(selector)})).backgroundColor`);
}

// Page contract, written as the Tailwind page of the docs prescribes: the layer order declaration comes first, then
// `@import 'tailwindcss'` and the framework's `tailwind.css`, and `@custom-variant dark (&:where([theme-mode='dark'],
// [theme-mode='dark'] *))`. The page renders:
//   #tw-padding  a `type="primary" theme="solid"` Button with class `p-0`
//   #tw-alpha    a block with class `bg-semi-color-primary/50`
//   #tw-dark     an element with classes `bg-white dark:bg-black`, inside an element with `theme-mode="dark"`
// With Preflight present the docs promise that Semi keeps its own button background (Preflight sits in a lower layer),
// that a single utility class overrides a Semi property without `!important`, that the token map supports alpha
// modifiers, and that `dark:` follows `theme-mode`.
export function tailwindCoexist(prefixCls = 'semi'): PageCheck {
    return {
        name: 'tailwind',
        run: async ({ page }) => {
            const button = page.locator('#tw-padding');
            assert.ok((await button.getAttribute('class', { timeout: TIMEOUT }))?.split(' ').includes(`${prefixCls}-button`), `#tw-padding lacks class ${prefixCls}-button`);
            const background = await backgroundOf(page, '#tw-padding');
            assert.notEqual(alphaOf(background), 0, `Preflight reset the button background to ${background}`);
            await expect(button).toHaveCSS('background-color', SEMI_PRIMARY, { timeout: TIMEOUT });
            // The shorthand serializes as one value only when all four sides are equal
            await expect(button).toHaveCSS('padding', '0px', { timeout: TIMEOUT });

            const alpha = alphaOf(await backgroundOf(page, '#tw-alpha'));
            assert.ok(Math.abs(alpha - 0.5) < 0.01, `bg-semi-color-primary/50 has alpha ${alpha}, expected 0.5`);

            assert.equal(await page.locator('[theme-mode="dark"] #tw-dark').count(), 1, '#tw-dark is not inside a [theme-mode="dark"] element');
            await expect(page.locator('#tw-dark')).toHaveCSS('background-color', 'rgb(0, 0, 0)', { timeout: TIMEOUT });
        },
    };
}

// tailwindCoexist runs after hydration, when client-side styles have already settled; a wrong layer order in the
// server-rendered HTML (the stylesheet links of the first response) is only visible with scripts off. The same URL is
// loaded, not setContent(), so relative stylesheet links resolve
export function tailwindFirstPaint(): PageCheck {
    return {
        name: 'tailwind-first-paint',
        run: async ({ url, page }) => {
            const browser = page.context().browser();
            assert.ok(browser != null, 'the page has no browser to open a script-less context in');
            const context = await browser.newContext({ javaScriptEnabled: false });
            try {
                const bare = await context.newPage();
                await bare.goto(url, { waitUntil: 'load', timeout: FIRST_PAINT_TIMEOUT });
                const button = bare.locator('#tw-padding');
                await expect(button).toHaveCSS('padding', '0px', { timeout: TIMEOUT });
                await expect(button).toHaveCSS('background-color', SEMI_PRIMARY, { timeout: TIMEOUT });
            } finally {
                await context.close();
            }
        },
    };
}

// Page contract: the page imports the UI and AI packages with `import * as` and renders `Object.keys(...).length` into
// `selector`, so a server-rendered export is never tree-shaken away. The count only has to be a positive integer and
// the same before and after hydration; the exact number would break on every added export.
export function allExports(selector: string): PageCheck {
    return {
        name: 'all-exports',
        run: async ({ html, page }) => {
            // Only the rendered markup is parsed: the server HTML's own scripts would start hydrating a second app
            const server = await page.context().newPage();
            let serverText: string | null;
            try {
                await server.setContent(markup(html), { waitUntil: 'domcontentloaded' });
                serverText = await server.locator(selector).first().textContent({ timeout: TIMEOUT });
            } finally {
                await server.close();
            }
            const count = serverText?.trim() ?? '';
            assert.match(count, /^[1-9]\d*$/, `${selector} in the server HTML is not a positive integer: ${serverText}`);
            await expect(page.locator(selector).first()).toHaveText(count, { timeout: TIMEOUT });
        },
    };
}

export function selectOpens(trigger: string, option: string): PageCheck {
    return {
        name: 'select',
        run: async ({ page }) => {
            await page.locator(trigger).click();
            await page.getByRole('option', { name: option }).waitFor({ state: 'visible', timeout: TIMEOUT });
            await page.keyboard.press('Escape');
        },
    };
}

export function tooltipHover(trigger: string, text: string): PageCheck {
    return {
        name: 'tooltip-hover',
        run: async ({ page }) => {
            await page.locator(trigger).hover();
            await page.getByText(text).waitFor({ state: 'visible', timeout: TIMEOUT });
            await page.mouse.move(0, 0);
        },
    };
}

// Default-open overlays appear after hydration (A3), so this waits instead of reading the server HTML
export function tooltipOpen(text: string): PageCheck {
    return {
        name: 'tooltip-open',
        run: async ({ page }) => page.getByText(text).waitFor({ state: 'visible', timeout: TIMEOUT }),
    };
}

export function modalOpens(trigger: string, text: string): PageCheck {
    return {
        name: 'modal',
        run: async ({ page }) => {
            await page.locator(trigger).click();
            await page.getByRole('dialog').getByText(text).waitFor({ state: 'visible', timeout: TIMEOUT });
            await page.keyboard.press('Escape');
        },
    };
}

export function toastShows(trigger: string, text: string): PageCheck {
    return {
        name: 'toast',
        run: async ({ page }) => {
            await page.locator(trigger).click();
            await page.getByText(text).waitFor({ state: 'visible', timeout: TIMEOUT });
        },
    };
}

// Streaming placeholders (`<template id="B:0">`, `<div hidden id="S:0">`) are removed by the stream's own completion
// script, so they are never expected after hydration
const STREAM_PLACEHOLDER = /^[BS]:\d+$/;

function serverIds(html: string) {
    const body = markup(html);
    return ID_ATTRIBUTES.flatMap((attribute) => [...body.matchAll(new RegExp(`\\s${attribute}="([^"]*)"`, 'g'))].filter((match) => !STREAM_PLACEHOLDER.test(match[1])).map((match) => `${attribute}=${match[1]}`));
}

// Browser-side code is an expression string: tsconfig.node.json has no DOM lib, so DOM APIs do not typecheck here
function domIds(page: Page) {
    const attributes = JSON.stringify(ID_ATTRIBUTES);
    return page.evaluate<string[]>(`${attributes}.flatMap((name) => [...document.querySelectorAll('body [' + name + ']:not(script)')].map((element) => name + '=' + element.getAttribute(name)))`);
}

// Fails only when a server-rendered id is gone after hydration; portals add ids of their own
export function idsStable(): PageCheck {
    return {
        name: 'ids',
        run: async ({ html, page }) => {
            const hydrated = new Set(await domIds(page));
            assertNone(
                serverIds(html).filter((id) => !hydrated.has(id)),
                'server ids missing after hydration'
            );
        },
    };
}

// 20 concurrent requests alternating `?lang=en` and `?lang=zh`; each response carries only its own locale's marker
export function langIsolation(pathname: string, markers: { en: string; zh: string }): ServerCheck {
    return {
        name: 'lang',
        run: async ({ baseUrl }) => {
            const langs = Array.from({ length: 20 }, (_, index): 'en' | 'zh' => (index % 2 === 0 ? 'en' : 'zh'));
            const responses = await Promise.all(
                langs.map(async (lang, index) => {
                    const url = new URL(pathname, baseUrl);
                    url.searchParams.set('lang', lang);
                    url.searchParams.set('n', String(index));
                    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT) });
                    return { status: response.status, body: await response.text() };
                })
            );
            const failed = langs.flatMap((lang, index) => (responses[index].status === 200 ? [] : [`#${index} ?lang=${lang} HTTP ${responses[index].status}`]));
            assertNone(failed, 'failed responses');
            const crossed = langs.flatMap((lang, index) => {
                const other = lang === 'en' ? 'zh' : 'en';
                const { body } = responses[index];
                return body.includes(markers[lang]) && !body.includes(markers[other]) ? [] : [`#${index} ?lang=${lang}`];
            });
            assertNone(crossed, 'responses with the wrong or mixed locale');
        },
    };
}

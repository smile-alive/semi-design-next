// Post-build smoke test: no browser errors, demos have content, axe violations stay within
// scripts/a11y-baseline.json, and keyboard focus on Semi elements never shows the browser's default ring.
// usage: astro build (page list comes from dist) and a running `astro dev` server, then
// `node scripts/check-pages.ts [baseUrl] [pathFilter]`. Use dev for SSR checks: production builds silently keep
// hydration mismatches.
// `--update-a11y-baseline` rewrites the baseline from one full run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { AxeBuilder } from '@axe-core/playwright';
import { chromium, type Page } from 'playwright';
import { additionsOverReact, knownRules } from './a11y-baseline.ts';

const {
    values: { 'update-a11y-baseline': updateBaseline },
    positionals: [baseUrl = 'http://localhost:4321', filter = ''],
} = parseArgs({
    options: { 'update-a11y-baseline': { type: 'boolean', default: false } },
    allowPositionals: true,
});
if (updateBaseline && filter) {
    throw new Error('--update-a11y-baseline needs a full run; drop the path filter');
}
const distDir = fileURLToPath(new URL('../dist', import.meta.url));
const baselineFile = fileURLToPath(new URL('./a11y-baseline.json', import.meta.url));
// demo key -> known violated rules
const baseline: Record<string, string[]> = fs.existsSync(baselineFile) ? JSON.parse(fs.readFileSync(baselineFile, 'utf8')) : {};
const CONCURRENCY = 6;

type Violation = { rule: string; impact?: string | null; nodes: number };

const pages = fs
    .readdirSync(distDir, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('index.html'))
    .map((file) => '/' + path.dirname(file).split(path.sep).join('/'))
    .filter((url) => url !== '/.' && url.includes(filter))
    .sort();

const browser = await chromium.launch();
const failures: { url: string; emptyDemos: string[]; errors: string[] }[] = [];
// `${page}#${demo}` -> axe violations of that demo
const violations: Record<string, Violation[]> = {};
// `${page}#${demo}` -> Semi elements showing the browser's default focus ring on keyboard focus
const userAgentFocusRings: Record<string, string[]> = {};
let demoCount = 0;
const MAX_TABS_PER_DEMO = 100;
// 400 days, 7 hours and 13 minutes: a different year, month, weekday, hour and minute
const CLOCK_SHIFT = ((400 * 24 + 7) * 60 + 13) * 60 * 1000;

// Tabs through the preview; only the Tab key enables :focus-visible. outline-style `auto` means the component lacks
// the themed focus ring (focus-ring in base/mixin.scss). A focus-opened popup rendered into body ends the demo early.
// Only semi- class elements count.
async function findUserAgentFocusRings(page: Page, demoId: string) {
    const preview = `[id="${demoId}"] .demo-preview`;
    await page.$eval(preview, (el) => {
        (el as HTMLElement).tabIndex = -1;
        (el as HTMLElement).focus();
    });
    const found = new Set<string>();
    const visited = await page.evaluateHandle(() => new WeakSet<Element>());
    for (let i = 0; i < MAX_TABS_PER_DEMO; i++) {
        await page.keyboard.press('Tab');
        const step = await page.evaluate(
            ([selector, seen]) => {
                const el = document.activeElement;
                if (!el || !document.querySelector(selector)?.contains(el) || seen.has(el)) {
                    return null;
                }
                seen.add(el);
                const semiClasses = [...el.classList].filter((name) => name.startsWith('semi-'));
                // Visually hidden native inputs get their ring from the visible element that draws them
                const rect = el.getBoundingClientRect();
                let hidden = rect.width <= 1 || rect.height <= 1;
                for (let node: Element | null = el; node && !hidden; node = node.parentElement) {
                    const style = getComputedStyle(node);
                    hidden = style.opacity === '0' || style.clipPath !== 'none';
                }
                return {
                    name: [el.tagName.toLowerCase(), ...semiClasses.slice(0, 2)].join('.'),
                    flagged: semiClasses.length > 0 && !hidden && getComputedStyle(el).outlineStyle === 'auto',
                };
            },
            [preview, visited] as const
        );
        if (!step) {
            break;
        }
        if (step.flagged) {
            found.add(step.name);
        }
    }
    return [...found];
}

async function check(url: string) {
    // AxeBuilder needs its own context; reduced motion keeps transitions from racing the scan
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    // The server renders with the real clock, so a browser clock this far ahead turns any first frame that shows the
    // current time into a hydration mismatch. A dev server renders and hydrates within the same second and would
    // never show it, while the static site is built on one day and hydrated on another. Only Date moves: faking
    // timers as page.clock does would change what the scan observes.
    await context.addInitScript((shift) => {
        const RealDate = Date;
        globalThis.Date = new Proxy(RealDate, {
            construct: (target, args, newTarget) => Reflect.construct(target, args.length ? args : [target.now() + shift], newTarget),
            apply: (target) => new target(target.now() + shift).toString(),
            get: (target, key) => (key === 'now' ? () => target.now() + shift : Reflect.get(target, key)),
        });
    }, CLOCK_SHIFT);
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    // Failed resource loads are not code errors; the Image failure demo triggers one on purpose.
    // Vue reports hydration mismatches with console.warn, so warnings count too when they mention hydration.
    page.on('console', (msg) => {
        const text = msg.text();
        const type = msg.type();
        if ((type === 'error' && !text.startsWith('Failed to load resource')) || (type === 'warning' && /hydrat/i.test(text))) {
            errors.push(text);
        }
    });
    // Vite's HMR client full-reloads the first page that connects after a file edit, which drops the scroll that
    // hydrates client:visible islands; scanned pages need no live updates.
    await page.routeWebSocket(
        (socketUrl) => socketUrl.host === new URL(baseUrl).host,
        () => {}
    );
    try {
        // Not networkidle: pages with video or polling never go idle.
        await page.goto(baseUrl + url, { waitUntil: 'load', timeout: 60000 });
        // A client:visible island starts observing the viewport only after Astro has imported its before-hydration
        // script, which can finish after a quick scroll has passed it, so each demo stays in view until its island
        // hydrates. Astro removes the `ssr` attribute once hydration finishes (client:only islands carry it too).
        await page.evaluate(async () => {
            for (const demo of document.querySelectorAll('.demo')) {
                demo.scrollIntoView({ block: 'center' });
                const island = demo.querySelector('.demo-preview astro-island');
                const deadline = performance.now() + 15000;
                while (island?.hasAttribute('ssr') && performance.now() < deadline) {
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }
            }
        });
    } catch (err) {
        // page.goto throws only Error
        errors.push(`navigation: ${(err as Error).message.split('\n')[0]}`);
    }
    // Demos still animating differ on every run: wait up to 5 s for them to settle
    await page
        .evaluate(
            () =>
                new Promise<void>((resolve) => {
                    const done = () => {
                        observer.disconnect();
                        resolve();
                    };
                    let timer = setTimeout(done, 500);
                    const observer = new MutationObserver(() => {
                        clearTimeout(timer);
                        timer = setTimeout(done, 500);
                    });
                    for (const preview of document.querySelectorAll('.demo-preview')) {
                        observer.observe(preview, {
                            subtree: true,
                            childList: true,
                            attributes: true,
                            characterData: true,
                        });
                    }
                    setTimeout(done, 5000);
                })
        )
        .catch(() => {});
    // Empty: no island, hydration unfinished after the wait above, or nothing rendered.
    const demos = await page.$$eval('.demo', (nodes) =>
        nodes.map((d) => {
            const island = d.querySelector('.demo-preview astro-island');
            return { id: d.id, empty: !island || island.hasAttribute('ssr') || !island.children.length };
        })
    );
    demoCount += demos.length;
    // axe scans per demo and misses ids duplicated across demos, which misdirect aria references
    const ids = await page.$$eval('.demo-preview [id]', (nodes) => nodes.map((node) => node.id));
    for (const id of new Set(ids.filter((id, index) => ids.indexOf(id) !== index))) {
        errors.push(`duplicate id in demos: ${id}`);
    }
    for (const { id } of demos) {
        const result = await new AxeBuilder({ page }).include(`[id="${id}"] .demo-preview`).analyze();
        const found = [];
        for (const v of result.violations) {
            let nodes = v.nodes;
            // Shiki theme syntax colors are not Semi's, so contrast is not checked there.
            if (v.id === 'color-contrast') {
                const inShiki = await Promise.all(nodes.map((n) => page.$eval(String(n.target.at(-1)), (el) => el.closest('.shiki') !== null).catch(() => false)));
                nodes = nodes.filter((_, i) => !inShiki[i]);
            }
            if (nodes.length) {
                found.push({ rule: v.id, impact: v.impact, nodes: nodes.length });
            }
        }
        if (found.length) {
            violations[`${url}#${id}`] = found;
        }
    }
    // After axe: Tab opens popups and mutates the DOM axe scans.
    for (const { id, empty } of demos) {
        const rings = empty ? [] : await findUserAgentFocusRings(page, id).catch(() => []);
        if (rings.length) {
            userAgentFocusRings[`${url}#${id}`] = rings;
        }
    }
    const empty = demos.filter((d) => d.empty).map((d) => d.id);
    if (errors.length || empty.length) {
        failures.push({ url, emptyDemos: empty, errors: [...new Set(errors)] });
    }
    await context.close();
}

const queue = [...pages];
await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
        for (let url = queue.shift(); url; url = queue.shift()) {
            await check(url);
        }
    })
);
await browser.close();

const newViolations: (Violation & { demo: string })[] = [];
const fixedViolations: { demo: string; rule: string }[] = [];
if (updateBaseline && failures.length) {
    // Demos on failed pages were not scanned; rewriting would drop their violations from the baseline.
    console.error('a11y baseline left unchanged: some pages failed');
} else if (updateBaseline) {
    const next = Object.fromEntries(
        Object.keys(violations)
            .sort()
            .map((key) => [key, [...new Set(violations[key].map((v) => v.rule))].toSorted()])
    );
    const additions = additionsOverReact(next);
    if (additions.length) {
        console.error('a11y baseline left unchanged: violations on other frameworks exceed the corresponding React demos');
        newViolations.push(...additions.map((entry) => ({ ...entry, nodes: 0 })));
    } else {
        fs.writeFileSync(baselineFile, JSON.stringify(next, null, 4) + '\n');
    }
} else {
    for (const [key, list] of Object.entries(violations)) {
        const known = knownRules(key, baseline);
        newViolations.push(...list.filter((v) => !known.includes(v.rule)).map((v) => ({ demo: key, ...v })));
    }
    for (const [key, rules] of Object.entries(baseline)) {
        if (!pages.includes(key.slice(0, key.indexOf('#')))) {
            continue;
        }
        const seen = (violations[key] || []).map((v) => v.rule);
        // Fixed violations must leave the baseline too: it only shrinks.
        fixedViolations.push(...rules.filter((rule) => !seen.includes(rule)).map((rule) => ({ demo: key, rule })));
    }
}

console.log(
    JSON.stringify(
        {
            pages: pages.length,
            demos: demoCount,
            demosWithA11yViolations: Object.keys(violations).length,
            failures,
            newA11yViolations: newViolations,
            fixedA11yViolationsStillInBaseline: fixedViolations,
            userAgentFocusRings,
        },
        null,
        2
    )
);
process.exitCode = failures.length || newViolations.length || fixedViolations.length || Object.keys(userAgentFocusRings).length ? 1 : 0;

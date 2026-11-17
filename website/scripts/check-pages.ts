// Smoke-tests the docs site: browser errors, empty demos, axe violations, default focus rings.
// Usage: node website/scripts/check-pages.ts [baseUrl] [pathFilter] [--update-a11y-baseline]
// Output: JSON report, exit code 1 on any failure, new or stale a11y baseline entry, or default focus ring
// Needs `astro build` (the page list comes from dist) and a running `astro dev` server: production builds hide hydration mismatches.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { AxeBuilder } from '@axe-core/playwright';
import { chromium, type Browser, type Page } from 'playwright';
import { readJson } from '../../scripts/lib/json.ts';
import { website } from '../../scripts/lib/paths.ts';
import { mapConcurrent } from '../../scripts/lib/pool.ts';
import { additionsOverReact, knownRules } from './lib/a11y-baseline.ts';
import { settle } from './lib/browser.ts';

type Violation = { rule: string; impact?: string | null; nodes: number };
type Entries<T> = [key: string, value: T][];
type PageResult = {
    demoCount: number;
    // Keys are `${page}#${demo}`; `#page` and `#shell-<state>` cover the page outside its demos and the shell overlays
    violations: Entries<Violation[]>;
    focusRings: Entries<string[]>;
    failure?: { url: string; emptyDemos: string[]; errors: string[] };
};

const CONCURRENCY = 6;
const MAX_TABS_PER_DEMO = 100;
// 400 days, 7 hours and 13 minutes: a different year, month, weekday, hour and minute
const CLOCK_SHIFT = ((400 * 24 + 7) * 60 + 13) * 60 * 1000;
const baselineFile = path.join(website, 'scripts/a11y-baseline.json');
// The shell's overlays render closed, so a page scan never reaches them. Narrow-only ones need the phone width.
const SHELL_STATES = [
    { name: 'search', width: 1440, trigger: '#search-toggle', content: '#search-dialog' },
    { name: 'framework-menu', width: 1440, trigger: '[popovertarget="framework-menu"]', content: '#framework-menu' },
    { name: 'locale-menu', width: 1440, trigger: '[popovertarget="locale-menu"]', content: '#locale-menu' },
    { name: 'more-menu', width: 375, trigger: '[popovertarget="more-menu"]', content: '#more-menu' },
    { name: 'drawer', width: 375, trigger: '#nav-toggle', content: '#side-nav' },
];
// Shell markup only varies by locale and framework, so one page of each section stands for the rest
const scannedSections = new Set<string>();

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

const baseline: Record<string, string[]> = fs.existsSync(baselineFile) ? readJson(baselineFile) : {};
const pages = fs
    .readdirSync(path.join(website, 'dist'), { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('index.html'))
    .map((file) => '/' + path.dirname(file).split(path.sep).join('/'))
    .filter((url) => url !== '/.' && url.includes(filter))
    .toSorted();

const browser = await chromium.launch();
const results = await mapConcurrent(pages, (url) => checkPage(browser, url), CONCURRENCY);
await browser.close();

const violations = Object.fromEntries(results.flatMap((result) => result.violations));
const userAgentFocusRings = Object.fromEntries(results.flatMap((result) => result.focusRings));
const failures = results.flatMap((result) => result.failure ?? []);
const { newViolations, fixedViolations } = updateBaseline ? rewriteBaseline() : diffAgainstBaseline();

console.log(
    JSON.stringify(
        {
            pages: pages.length,
            demos: results.reduce((sum, result) => sum + result.demoCount, 0),
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

async function checkPage(browser: Browser, url: string): Promise<PageResult> {
    // AxeBuilder needs its own context; reduced motion keeps transitions from racing the scan
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    // A browser clock far ahead of the server's turns any first frame showing the current time into a hydration
    // mismatch. A dev server renders and hydrates within one second and would never show it, while the static site is
    // built on one day and hydrated on another. Only Date moves: faking timers (page.clock) would change what the scan sees.
    await context.addInitScript(shiftDate, CLOCK_SHIFT);
    const page = await context.newPage();
    const errors = collectErrors(page);
    // Vite's HMR client full-reloads the first page that connects after a file edit, which drops the scroll that
    // hydrates client:visible islands.
    await page.routeWebSocket(
        (socketUrl) => socketUrl.host === new URL(baseUrl).host,
        () => {}
    );
    try {
        // Not networkidle: pages with video or polling never go idle.
        await page.goto(baseUrl + url, { waitUntil: 'load', timeout: 60000 });
        await page.evaluate(waitForHydration);
    } catch (err) {
        errors.push(`navigation: ${(err as Error).message.split('\n')[0]}`);
    }
    // Animating demos would scan differently on every run
    await settle(page, '.demo-preview').catch(() => {});

    const demos = await listDemos(page);
    errors.push(...(await findDuplicateDemoIds(page)).map((id) => `duplicate id in demos: ${id}`));

    const violations: Entries<Violation[]> = [];
    const record = (key: string, found: Violation[]) => {
        if (found.length) {
            violations.push([key, found]);
        }
    };
    for (const { id } of demos) {
        record(`${url}#${id}`, await scan(page, new AxeBuilder({ page }).include(`[id="${id}"] .demo-preview`)));
    }
    record(`${url}#page`, await scan(page, new AxeBuilder({ page }).exclude('.demo-preview').disableRules(['landmark-no-duplicate-main'])));
    // Before the Tab walk: a popup it leaves open can cover the shell's triggers.
    await scanShellStates(page, url, record).catch((err: Error) => errors.push(`shell states: ${err.message.split('\n')[0]}`));

    // After axe: Tab opens popups and mutates the DOM axe scans.
    const focusRings: Entries<string[]> = [];
    for (const { id, empty } of demos) {
        const rings = empty ? [] : await findUserAgentFocusRings(page, id).catch(() => []);
        if (rings.length) {
            focusRings.push([`${url}#${id}`, rings]);
        }
    }
    await context.close();

    const emptyDemos = demos.filter((demo) => demo.empty).map((demo) => demo.id);
    const failure = errors.length || emptyDemos.length ? { url, emptyDemos, errors: [...new Set(errors)] } : undefined;
    return { demoCount: demos.length, violations, focusRings, failure };
}

function collectErrors(page: Page) {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    // Failed resource loads are ignored (the Image failure demo triggers one on purpose); Vue reports hydration mismatches as warnings.
    page.on('console', (msg) => {
        const text = msg.text();
        const type = msg.type();
        if ((type === 'error' && !text.startsWith('Failed to load resource')) || (type === 'warning' && /hydrat/i.test(text))) {
            errors.push(text);
        }
    });
    return errors;
}

// Empty: no island, hydration unfinished after the wait above, or nothing rendered.
function listDemos(page: Page) {
    return page.$$eval('.demo', (nodes) =>
        nodes.map((demo) => {
            const island = demo.querySelector('.demo-preview astro-island');
            return { id: demo.id, empty: !island || island.hasAttribute('ssr') || !island.children.length };
        })
    );
}

// axe scans per demo and misses ids duplicated across demos, which misdirect aria references
async function findDuplicateDemoIds(page: Page) {
    const ids = await page.$$eval('.demo-preview [id]', (nodes) => nodes.map((node) => node.id));
    return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
}

// Shiki theme syntax colors are not Semi's, and palette swatches show a contrast on purpose, so neither is checked.
async function scan(page: Page, builder: AxeBuilder) {
    const { violations } = await builder.analyze();
    const found: Violation[] = [];
    const unchecked = '.shiki, pre[data-language], [data-contrast-sample]';
    for (const { id, impact, nodes } of violations) {
        const intentional = id === 'color-contrast' ? await Promise.all(nodes.map((node) => page.$eval(String(node.target.at(-1)), (el, selector) => el.closest(selector) !== null, unchecked).catch(() => false))) : [];
        const count = nodes.filter((_, index) => !intentional[index]).length;
        if (count) {
            found.push({ rule: id, impact, nodes: count });
        }
    }
    return found;
}

async function scanShellStates(page: Page, url: string, record: (key: string, found: Violation[]) => void) {
    const section = url.split('/').slice(0, 3).join('/');
    if (scannedSections.has(section)) {
        return;
    }
    scannedSections.add(section);
    for (const { name, width, trigger, content } of SHELL_STATES) {
        await page.setViewportSize({ width, height: 900 });
        const button = page.locator(trigger);
        if (!(await button.count())) {
            continue;
        }
        await button.click();
        await page.locator(content).waitFor({ state: 'visible' });
        record(`${url}#shell-${name}`, await scan(page, new AxeBuilder({ page }).include(content)));
        await page.keyboard.press('Escape');
    }
    await page.setViewportSize({ width: 1440, height: 900 });
}

// Tabs through the preview, since only the Tab key enables :focus-visible. outline-style `auto` means the component
// lacks the themed focus ring (focus-ring in base/mixin.scss). A focus-opened popup rendered into body ends the walk early.
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
        const step = await page.evaluate(inspectFocusedElement, [preview, visited] as const);
        if (!step) {
            break;
        }
        if (step.flagged) {
            found.add(step.name);
        }
    }
    return [...found];
}

// Browser-side callbacks are serialized into the page: keep them self-contained and within Chrome 120 / Firefox 125 / Safari 17.2 APIs.

function shiftDate(shift: number) {
    const RealDate = Date;
    globalThis.Date = new Proxy(RealDate, {
        construct: (target, args, newTarget) => Reflect.construct(target, args.length ? args : [target.now() + shift], newTarget),
        apply: (target) => new target(target.now() + shift).toString(),
        get: (target, key) => (key === 'now' ? () => target.now() + shift : Reflect.get(target, key)),
    });
}

// A client:visible island observes the viewport only after Astro imported its before-hydration script, which can
// finish after a quick scroll has passed it, so each demo stays in view until its island hydrates. Astro removes
// the `ssr` attribute once hydration finishes (client:only islands carry it too).
async function waitForHydration() {
    const hydrated = async (island: Element | null) => {
        const deadline = performance.now() + 15000;
        while (island?.hasAttribute('ssr') && performance.now() < deadline) {
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    };
    for (const demo of document.querySelectorAll('.demo')) {
        demo.scrollIntoView({ block: 'center' });
        await hydrated(demo.querySelector('.demo-preview astro-island'));
    }
    // Figures outside demos are in the page scan, which would otherwise see them only when they win the race
    for (const island of document.querySelectorAll('astro-island[ssr]')) {
        await hydrated(island);
    }
}

function inspectFocusedElement([selector, seen]: readonly [string, WeakSet<Element>]) {
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
}

function diffAgainstBaseline() {
    const knownPages = new Set(pages);
    const newViolations = Object.entries(violations).flatMap(([key, list]) => {
        const known = knownRules(key, baseline);
        return list.filter((v) => !known.includes(v.rule)).map((v) => ({ demo: key, ...v }));
    });
    // Fixed violations must leave the baseline too: it only shrinks.
    const fixedViolations = Object.entries(baseline)
        .filter(([key]) => knownPages.has(key.slice(0, key.indexOf('#'))))
        .flatMap(([key, rules]) => {
            const seen = (violations[key] || []).map((v) => v.rule);
            return rules.filter((rule) => !seen.includes(rule)).map((rule) => ({ demo: key, rule }));
        });
    return { newViolations, fixedViolations };
}

function rewriteBaseline() {
    const newViolations: (Violation & { demo: string })[] = [];
    if (failures.length) {
        // Demos on failed pages were not scanned; rewriting would drop their violations from the baseline.
        console.error('a11y baseline left unchanged: some pages failed');
        return { newViolations, fixedViolations: [] };
    }
    const next = Object.fromEntries(
        Object.keys(violations)
            .toSorted()
            .map((key) => [key, [...new Set(violations[key].map((v) => v.rule))].toSorted()])
    );
    const additions = additionsOverReact(next);
    if (additions.length) {
        console.error('a11y baseline left unchanged: violations on other frameworks exceed the corresponding React demos');
        newViolations.push(...additions.map((entry) => ({ ...entry, nodes: 0 })));
    } else {
        fs.writeFileSync(baselineFile, JSON.stringify(next, null, 4) + '\n');
    }
    return { newViolations, fixedViolations: [] };
}

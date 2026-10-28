// Compares the layout of two builds, for CSS changes that must not move anything (physical -> logical properties).
// Per element in each `.demo-preview` and open popup: bounding box relative to the demo (0.5px) plus margin, padding,
// border, radius, inset, text-align, float, transform, including ::before / ::after.
// `rtl` adds `dir="rtl"` plus the direction classes original Semi uses, so either build can be the baseline.
// Not covered: popup placement, keyboard and hover states, popups not open at load.
// usage: build and preview both sides, then
// `node scripts/compare-layout.ts <baseline> <candidate> <path>... [--mode=ltr|rtl|both]`
// Prints JSON and exits 1 on any diff. Compare the baseline with itself first: random data and animations add noise.
import { parseArgs } from 'node:util';
import { chromium, type Browser } from 'playwright';

type Item = Record<string, string | number>;
type Snapshot = Record<string, Item[]>;

const {
    values: { mode },
    positionals: [baselineUrl, candidateUrl, ...paths],
} = parseArgs({ options: { mode: { type: 'string', default: 'both' } }, allowPositionals: true });
if (!baselineUrl || !candidateUrl || !paths.length || !['ltr', 'rtl', 'both'].includes(mode)) {
    throw new Error('usage: compare-layout.ts <baselineUrl> <candidateUrl> <path>... [--mode=ltr|rtl|both]');
}
const modes = mode === 'both' ? ['ltr', 'rtl'] : [mode];
const CONCURRENCY = 4;

function applyRtl() {
    // Elements original Semi marks with a `-rtl` class in an rtl context; `dir` on them covers the `:dir(rtl)` styles.
    // React rewrites className on update, hence the observer.
    const contextClasses = [
        ['.demo-preview', 'semi-rtl'],
        ['body > .semi-portal', 'semi-portal-rtl'],
        ['.semi-tooltip-wrapper', 'semi-tooltip-rtl'],
        ['.semi-popover-wrapper, .semi-popover', 'semi-popover-rtl'],
        ['.semi-popconfirm', 'semi-popconfirm-rtl'],
        ['.semi-notification-notice', 'semi-notification-notice-rtl'],
        ['.semi-toast', 'semi-toast-rtl'],
        ['.semi-cascader-option-lists', 'semi-cascader-option-lists-rtl'],
        ['.semi-sidesheet', 'semi-sidesheet-rtl'],
        ['.semi-modal', 'semi-modal-rtl'],
        ['.semi-modal-confirm', 'semi-modal-confirm-rtl'],
        ['.semi-table-wrapper', 'semi-table-wrapper-rtl'],
    ];
    const mark = () => {
        for (const [selector, cls] of contextClasses) {
            for (const el of document.querySelectorAll(selector)) {
                if (!el.classList.contains(cls)) {
                    el.classList.add(cls);
                }
                if (el.getAttribute('dir') !== 'rtl') {
                    el.setAttribute('dir', 'rtl');
                }
            }
        }
    };
    new MutationObserver(mark).observe(document, { subtree: true, childList: true, attributes: true });
    document.addEventListener('DOMContentLoaded', mark);
}

function snapshot() {
    const PROPS = [
        ...['top', 'right', 'bottom', 'left'].flatMap((side) => [`margin-${side}`, `padding-${side}`, `border-${side}-width`, `border-${side}-style`, `border-${side}-color`, side]),
        ...['top-left', 'top-right', 'bottom-right', 'bottom-left'].map((corner) => `border-${corner}-radius`),
        'text-align',
        'float',
        'clear',
        'transform',
    ];
    const round = (n: number) => Math.round(n * 2) / 2;
    // getComputedStyle keeps start/end and inline-* as written; map them to left/right before comparing.
    const physical = (value: string, dir: string) => value.replace(/^(inline-)?start$/, dir === 'rtl' ? 'right' : 'left').replace(/^(inline-)?end$/, dir === 'rtl' ? 'left' : 'right');
    const styles = (el: Element, pseudo?: string) => {
        const cs = getComputedStyle(el, pseudo);
        if (pseudo && (cs.content === 'none' || cs.content === 'normal')) {
            return null;
        }
        const out: Record<string, string> = {};
        for (const prop of PROPS) {
            out[prop] = physical(cs.getPropertyValue(prop), cs.direction);
        }
        // Offsets written by JS (popup position, measured indicators) are not the CSS under test, nor are the
        // opposite sides they imply. HTML, SVG and MathML elements all have style, but Element does not declare it.
        const { style } = el as Element & ElementCSSInlineStyle;
        const sides = ['top', 'right', 'bottom', 'left'];
        if (!pseudo && sides.some((side) => style.getPropertyValue(side))) {
            for (const side of sides) {
                out[side] = 'inline';
            }
        }
        if (pseudo) {
            out.width = cs.width;
            out.height = cs.height;
        }
        return out;
    };
    const describe = (el: Element) =>
        el.tagName.toLowerCase() +
        [...el.classList]
            .slice(0, 3)
            .map((c) => '.' + c)
            .join('');
    const collect = (root: Element, origin: DOMRect) =>
        [root, ...root.querySelectorAll('*')].map((el, index) => {
            const r = el.getBoundingClientRect();
            const item: Item = {
                index,
                el: describe(el),
                rect: [r.x - origin.x, r.y - origin.y, r.width, r.height].map(round).join(','),
                ...styles(el),
            };
            for (const pseudo of ['::before', '::after']) {
                const ps = styles(el, pseudo);
                if (ps) {
                    for (const [k, v] of Object.entries(ps)) {
                        item[`${pseudo}${k}`] = v;
                    }
                }
            }
            return item;
        });
    const groups: Snapshot = {};
    for (const demo of document.querySelectorAll('.demo')) {
        const preview = demo.querySelector('.demo-preview');
        if (!preview) {
            throw new Error(`#${demo.id} has no .demo-preview`);
        }
        groups[demo.id] = collect(preview, preview.getBoundingClientRect());
    }
    // Popup mount order is unstable, so key by content, not position. Boxes are measured from the popup's own corner
    // because its page position derives from the trigger.
    for (const portal of document.querySelectorAll('body > .semi-portal')) {
        const key = `portal:${portal.querySelectorAll('*').length}:${portal.textContent.slice(0, 60)}`;
        const popup = portal.firstElementChild || portal;
        groups[key in groups ? `${key}#${Object.keys(groups).length}` : key] = collect(popup, popup.getBoundingClientRect());
    }
    return groups;
}

async function load(browser: Browser, url: string, rtl: boolean) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    if (rtl) {
        await context.addInitScript(applyRtl);
    }
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => [...document.querySelectorAll('.demo-preview astro-island')].every((island) => island.children.length), null, { timeout: 10000 }).catch(() => {});
    // Same as check-pages.ts: wait up to 5 s for looping demos
    await page.evaluate(
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
                observer.observe(document.body, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    characterData: true,
                });
                setTimeout(done, 5000);
            })
    );
    // Loading icons still spin under reduced motion; freeze them
    await page.addStyleTag({
        content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
    });
    await page.evaluate(() => document.fonts.ready);
    const result = await page.evaluate(snapshot);
    await context.close();
    return result;
}

type Diff = { group: string; structure: string } | { group: string; index: string | number; el: string | number; changes: Record<string, string> };

function compare(base: Snapshot, cand: Snapshot) {
    const diffs: Diff[] = [];
    for (const group of new Set([...Object.keys(base), ...Object.keys(cand)])) {
        const a = base[group] || [];
        const b = cand[group] || [];
        if (a.length !== b.length) {
            diffs.push({ group, structure: `${a.length} elements -> ${b.length} elements` });
            continue;
        }
        a.forEach((item, i) => {
            const changed = Object.keys(item).filter((key) => item[key] !== b[i][key]);
            if (changed.length) {
                diffs.push({
                    group,
                    index: item.index,
                    el: item.el,
                    changes: Object.fromEntries(changed.map((key) => [key, `${item[key]} -> ${b[i][key]}`])),
                });
            }
        });
    }
    return diffs;
}

const browser = await chromium.launch();
const queue = paths.flatMap((path) => modes.map((m) => ({ path, mode: m })));
const report: { path: string; mode: string; elements: number; diffs: Diff[] }[] = [];
await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
        for (let job = queue.shift(); job; job = queue.shift()) {
            const { path, mode: m } = job;
            const [base, cand] = await Promise.all([load(browser, baselineUrl + path, m === 'rtl'), load(browser, candidateUrl + path, m === 'rtl')]);
            const elements = Object.values(base).reduce((sum, list) => sum + list.length, 0);
            report.push({ path, mode: m, elements, diffs: compare(base, cand) });
        }
    })
);
await browser.close();

report.sort((x, y) => x.path.localeCompare(y.path) || x.mode.localeCompare(y.mode));
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.some((r) => r.diffs.length) ? 1 : 0;

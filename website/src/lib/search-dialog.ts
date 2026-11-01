import { navigate } from 'astro:transitions/client';
import type { Locale } from '#/i18n/locales';
import { searchComponents, type ComponentEntry } from '#/lib/component-search';

// view transitions replace the header and dialog on every navigation, so elements are looked up per use and events delegate to document
const dialog = () => document.getElementById('search-dialog') as HTMLDialogElement;
const input = () => document.getElementById('search-input') as HTMLInputElement;
const list = () => document.getElementById('search-results') as HTMLUListElement;

const indexes = new Map<string, Promise<ComponentEntry[]>>();
let results: ComponentEntry[] = [];
let active = -1;

function loadIndex(framework: string) {
    let index = indexes.get(framework);
    if (index) return index;
    index = fetch(`/search/${framework}.json`).then((response) => {
        if (!response.ok) throw new Error(`Component search index failed to load: ${response.status} ${response.url}`);
        return response.json() as Promise<ComponentEntry[]>;
    });
    // retry on the next open after a failure; the error still propagates
    indexes.set(framework, index);
    index.catch(() => indexes.delete(framework));
    return index;
}

function setActive(next: number) {
    active = next;
    const options = list().children;
    for (let i = 0; i < options.length; i++) options[i].setAttribute('aria-selected', String(i === active));
    const option = options[active];
    if (option) {
        input().setAttribute('aria-activedescendant', option.id);
        option.scrollIntoView({ block: 'nearest' });
    } else {
        input().removeAttribute('aria-activedescendant');
    }
}

// same as the original site: other locales show "<English> <localized>", en-US the English name only
const labelOf = ({ titles }: ComponentEntry, locale: Locale) => (locale === 'en-US' || titles['en-US'] === titles[locale] ? titles[locale] : `${titles['en-US']} ${titles[locale]}`);

// highlights only verbatim matches, not ones that need spaces and hyphens ignored
function highlight(target: HTMLElement, label: string, query: string) {
    const q = query.trim().toLowerCase();
    const at = q ? label.toLowerCase().indexOf(q) : -1;
    if (at === -1) {
        target.textContent = label;
        return;
    }
    const em = document.createElement('em');
    em.textContent = label.slice(at, at + q.length);
    target.append(label.slice(0, at), em, label.slice(at + q.length));
}

// Options are built once and only reordered and relabeled on input: a recreated <img> is often not decoded by the
// next frame, so the list flickers while typing. Keyed by dialog because the dialog is replaced with the page.
const options = new WeakMap<HTMLDialogElement, Map<string, HTMLLIElement>>();

function optionOf(entry: ComponentEntry) {
    let cache = options.get(dialog());
    if (!cache) options.set(dialog(), (cache = new Map()));
    let option = cache.get(entry.page);
    if (!option) {
        option = document.createElement('li');
        option.id = `search-option-${entry.page}`;
        option.className = 'search-option';
        option.setAttribute('role', 'option');
        if (entry.icon) {
            const icon = option.appendChild(document.createElement('img'));
            icon.src = entry.icon;
            icon.alt = '';
        }
        option.appendChild(document.createElement('span'));
        cache.set(entry.page, option);
    }
    return option;
}

function render(entries: ComponentEntry[], query: string) {
    const locale = dialog().dataset.locale as Locale;
    results = searchComponents(entries, query);
    list().replaceChildren(
        ...results.map((entry) => {
            const option = optionOf(entry);
            const label = option.lastElementChild as HTMLElement;
            label.replaceChildren();
            highlight(label, labelOf(entry, locale), query);
            return option;
        })
    );
    input().setAttribute('aria-expanded', String(results.length > 0));
    (document.getElementById('search-clear') as HTMLElement).hidden = !query;
    (document.getElementById('search-empty') as HTMLElement).hidden = !query.trim() || results.length > 0;
    setActive(results.length > 0 ? 0 : -1);
}

function open() {
    const target = dialog();
    if (!target || target.open) return;
    // clear on open, not on close: close fades out, and clearing then empties the list visibly
    input().value = '';
    render([], '');
    target.showModal();
    // prefetch; search() awaits it, and a failure shows up as an unhandled rejection
    void loadIndex(target.dataset.framework as string);
}

function go(entry?: ComponentEntry) {
    if (!entry) return;
    const href = entry.hrefs[dialog().dataset.locale as Locale];
    dialog().close();
    if (href !== location.pathname) void navigate(href);
}

document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('#search-toggle')) open();
    // closedby="any" needs Chrome 134 and Firefox 141 and has not shipped in Safari; delete once the floor has it.
    // The dialog itself is also the target of clicks on its padding, hence the box check
    if (target === dialog() && !('closedBy' in target)) {
        const box = target.getBoundingClientRect();
        const { clientX: x, clientY: y } = event;
        if (x < box.left || x > box.right || y < box.top || y > box.bottom) dialog().close();
    }
    if (target.closest('#search-clear')) {
        input().value = '';
        render([], '');
        input().focus();
    }
    const option = target.closest('#search-results [role="option"]');
    if (option) go(results[[...list().children].indexOf(option)]);
});

document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        open();
        return;
    }
    if (event.target !== input() || results.length === 0) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActive((active + step + results.length) % results.length);
    }
    // Enter during IME composition only confirms the candidate
    if (event.key === 'Enter' && !event.isComposing) {
        event.preventDefault();
        go(results[active]);
    }
});

async function search() {
    const target = dialog();
    const entries = await loadIndex(target.dataset.framework as string);
    if (target !== dialog()) return;
    // input may have changed while the index loaded
    render(entries, input().value);
}

// skip searches during IME composition and search once on compositionend, so the list does not jump with each letter
document.addEventListener('input', (event) => {
    if (event.target === input() && !(event as InputEvent).isComposing) void search();
});
document.addEventListener('compositionend', (event) => {
    if (event.target === input()) void search();
});

document.addEventListener('astro:page-load', () => {
    const shortcut = document.querySelector('#search-toggle kbd');
    if (shortcut instanceof HTMLElement) shortcut.dataset.keys = /Mac/.test(navigator.userAgent) ? '⌘ K' : 'Ctrl K';
});

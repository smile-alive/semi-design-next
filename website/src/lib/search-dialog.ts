import { navigate } from 'astro:transitions/client';
import type { Locale } from '#/i18n/locales';
import { searchComponents, type ComponentEntry } from '#/lib/component-search';

// 页头和对话框每次跳转都换成新节点，元素现取，事件委托到 document（与 DocLayout 的页头脚本一致）
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
    // 失败后下次打开重新请求，错误照常抛出
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

// 同源站：中文页写「Button 按钮」，英文页只写英文名
const labelOf = ({ titles }: ComponentEntry, locale: Locale) => (locale === 'en-US' || titles['en-US'] === titles[locale] ? titles[locale] : `${titles['en-US']} ${titles[locale]}`);

// 输入原样出现在名字里时标出命中部分；靠忽略空格、连字符才命中的不标
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

// 每个组件只建一次选项节点，之后每次输入只调整顺序和文字。重新创建的 <img> 在下一帧前常常还没解码完，
// 图标会空一帧，连续输入时整列闪烁。对话框随页面替换，缓存按对话框节点区分
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
    // 在打开前清空而不是关闭时：关闭有淡出动画，那时清空会看到内容先没了
    input().value = '';
    render([], '');
    target.showModal();
    // 打开时预取，输入时再等它；失败会作为未处理的 rejection 报到控制台
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
    // 输入法选词时的回车只是确认拼音
    if (event.key === 'Enter' && !event.isComposing) {
        event.preventDefault();
        go(results[active]);
    }
});

async function search() {
    const target = dialog();
    const entries = await loadIndex(target.dataset.framework as string);
    if (target !== dialog()) return;
    // 索引首次加载期间可能又输入了几个字，按最新的值渲染
    render(entries, input().value);
}

// 输入法拼写中的「anniu」不搜，选词结束后按汉字搜一次，避免列表随每个字母跳动
document.addEventListener('input', (event) => {
    if (event.target === input() && !(event as InputEvent).isComposing) void search();
});
document.addEventListener('compositionend', (event) => {
    if (event.target === input()) void search();
});

document.addEventListener('astro:page-load', () => {
    const shortcut = document.querySelector('#search-toggle kbd');
    if (shortcut) shortcut.textContent = /Mac/.test(navigator.userAgent) ? '⌘ K' : 'Ctrl K';
});

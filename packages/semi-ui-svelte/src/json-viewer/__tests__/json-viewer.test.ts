import { flushSync, tick } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi, type Mock } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { mockResizeObserverCore } from '@test/utils/dom/resize-observer-core';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { JsonViewerOptions, JsonViewerProps } from '../interface';
import type JsonViewer from '../json-viewer.svelte';
import Fixture, { type FixtureStore } from './json-viewer-fixture.svelte';
import Modes from './json-viewer-modes.svelte';

type FakeFn = Mock<(...args: unknown[]) => void>;
interface FakeViewer {
    container: HTMLElement;
    value: string;
    options: Record<string, unknown>;
    emitter: { emit: (event: string, data: unknown) => void };
    searchWidget: {
        search: FakeFn;
        navigateResults: FakeFn;
        replace: FakeFn;
        replaceAll: FakeFn;
        clear: FakeFn;
        searchResults: { start: number }[];
    };
    layout: FakeFn;
    format: FakeFn;
    resetMeasuredHeights: FakeFn;
    dispose: FakeFn;
}

// the mocked core below keeps every instance it creates
const instances = vi.hoisted((): FakeViewer[] => []);

// jsdom has no Worker, so the editor core is faked; layout, editing and real search are covered by the browser test
vi.mock('@fibrae/semi-json-viewer-core', () => {
    class JsonViewer implements FakeViewer {
        container: HTMLElement;
        value: string;
        options: Record<string, unknown>;
        listeners: Record<string, ((data: unknown) => void)[]> = {};
        emitter = {
            on: (event: string, listener: (data: unknown) => void) => {
                this.listeners[event] = [...(this.listeners[event] ?? []), listener];
            },
            emit: (event: string, data: unknown) => this.listeners[event]?.forEach((listener) => listener(data)),
        };
        searchWidget = {
            search: vi.fn<(...args: unknown[]) => void>(),
            navigateResults: vi.fn<(...args: unknown[]) => void>(),
            replace: vi.fn<(...args: unknown[]) => void>(),
            replaceAll: vi.fn<(...args: unknown[]) => void>(),
            clear: vi.fn<(...args: unknown[]) => void>(),
            searchResults: [{ start: 0 }],
        };
        layout = vi.fn<(...args: unknown[]) => void>();
        format = vi.fn<(...args: unknown[]) => void>();
        resetMeasuredHeights = vi.fn<(...args: unknown[]) => void>();
        dispose = vi.fn<(...args: unknown[]) => void>();

        constructor(container: HTMLElement, value: string, options: Record<string, unknown>) {
            this.container = container;
            this.value = value;
            this.options = options;
            instances.push(this);
        }

        getModel() {
            return { getValue: () => this.value };
        }

        getSearchWidget() {
            return this.searchWidget;
        }
    }
    return { JsonViewer };
});

type CoreRule = { render: (content: string) => unknown };
type Handle = ReturnType<typeof JsonViewer>;

const prefixCls = 'semi-json-viewer';
const zh = zh_CN;
const ariaLabel = zh.JsonViewer.content;
const live = () => instances.filter((instance) => instance.dispose.mock.calls.length === 0);
function current() {
    const instance = instances.at(-1);
    if (!instance) throw new Error('no editor was created');
    return instance;
}
const query = (selector: string) => document.querySelector<HTMLElement>(selector);
function get(selector: string) {
    const element = query(selector);
    if (!element) throw new Error(`missing ${selector}`);
    return element;
}
const trigger = () => query(`.${prefixCls}-search-bar-trigger`);
const searchInput = () => query(`.${prefixCls}-search-bar input`) as HTMLInputElement | null;
const replaceInput = () => query(`.${prefixCls}-replace-bar input`) as HTMLInputElement | null;
const replaceButtons = () => document.querySelectorAll<HTMLElement>(`.${prefixCls}-replace-bar button`);
const optionItems = () => document.querySelectorAll<HTMLElement>(`.${prefixCls}-search-options-item`);
const optionButton = (index: number) => optionItems()[index].querySelector('button') as HTMLElement;
const closeButton = () => get(`.${prefixCls}-search-bar > button:last-child`);

async function settle() {
    await tick();
    await tick();
    flushSync();
}
async function emit(event: string, data: unknown = {}) {
    current().emitter.emit(event, data);
    await settle();
}
async function click(element: Element) {
    await fireEvent.click(element);
    await settle();
}
async function typeText(element: Element, value: string) {
    await fireEvent.input(element, { target: { value } });
    await settle();
}
const openBar = () => click(get(`.${prefixCls}-search-bar-trigger`));
const button = (name: string) => screen.getByRole('button', { name });

function setup(props: JsonViewerProps = {}, init: Partial<Omit<FixtureStore, 'props'>> = {}) {
    const store = createStore<FixtureStore>({ props: { value: '1', ...props }, mode: 'plain', show: 'open', ...init });
    let handle: Handle | undefined;
    const view = render(Fixture, { props: { store, onHandle: (value) => (handle = value) } });
    flushSync();
    return { store, view, handle: () => handle as Handle };
}

function customSpan(map: Map<HTMLElement, unknown>, ruleIndex: number, content: string) {
    const span = document.createElement('span');
    current().container.appendChild(span);
    map.set(span, (current().options.customRenderRule as CoreRule[])[ruleIndex].render(content));
    return span;
}
const pointer = (target: EventTarget, type: string, init: PointerEventInit) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...init }));
function drag(element: Element, pointerType: string) {
    pointer(element, 'pointerdown', { pointerId: 1, pointerType, button: 0, clientX: 0, clientY: 0 });
    pointer(document, 'pointermove', { pointerId: 1, pointerType, clientX: 30, clientY: 30 });
    pointer(document, 'pointerup', { pointerId: 1, pointerType });
}

describe('Svelte JsonViewer', () => {
    beforeEach(() => {
        instances.length = 0;
    });

    afterEach(() => {
        semiGlobal.config = {};
    });

    it('为搜索触发按钮与搜索栏按钮提供名称', async () => {
        setup();
        await click(button(zh.JsonViewer.search));
        for (const name of [zh.JsonViewer.previousMatch, zh.JsonViewer.nextMatch, zh.JsonViewer.close]) {
            expect(button(name)).toBeInTheDocument();
        }
    });

    it('用 value 与默认选项在 editor 容器中创建编辑器，然后进行布局', () => {
        const { view } = setup({ value: '{"a":1}' });
        const editor = view.container.querySelector(`.${prefixCls}`);
        expect(editor).toHaveClass(`${prefixCls}-background`);
        expect(instances).toHaveLength(1);
        expect(current().container).toBe(editor);
        expect(current().value).toBe('{"a":1}');
        expect(current().options).toEqual({ prefixCls, ariaLabel, readOnly: false, autoWrap: true });
        expect(current().layout).toHaveBeenCalledTimes(1);
    });

    it('未传 value 时以空文本创建编辑器', () => {
        setup({ value: undefined });
        expect(current().value).toBe('');
    });

    it('在 prefixCls 之后把 options 传给编辑器', () => {
        setup({ options: { lineHeight: 30, readOnly: true } });
        expect(current().options).toEqual({ prefixCls, ariaLabel, autoWrap: true, lineHeight: 30, readOnly: true });
    });

    it('options 未指定 autoWrap 时仍按默认自动换行，并监听尺寸', () => {
        const resize = mockResizeObserverCore();
        setup({ options: { readOnly: true }, showSearch: false });
        expect(current().options.autoWrap).toBe(true);
        expect(resize.observed()).toContain(current().container);
    });

    it('options 显式传入 autoWrap: false 时关闭自动换行', () => {
        setup({ options: { autoWrap: false } });
        expect(current().options.autoWrap).toBe(false);
    });

    it('options 里值为 undefined 的键回退为默认值', () => {
        setup({ options: { ariaLabel: undefined, autoWrap: undefined, readOnly: undefined } });
        expect(current().options).toEqual({ prefixCls, ariaLabel, readOnly: false, autoWrap: true });
    });

    it('除非 options 指定，否则从语言包获取内容区域名称，并跟随语言切换', async () => {
        const { store } = setup({ options: { ariaLabel: 'Config' } }, { locale: zh });
        expect(current().options.ariaLabel).toBe('Config');
        store.props.options = {};
        await settle();
        expect(current().options.ariaLabel).toBe(ariaLabel);
        store.locale = en_US;
        await settle();
        expect(current().options.ariaLabel).toBe(en_US.JsonViewer.content);
        expect(instances).toHaveLength(3);
        expect(live()).toHaveLength(1);
    });

    it('设置两个 div 的尺寸，根节点合并 class 与 style，并透传 data-*', () => {
        const { view } = setup({ class: 'custom', style: 'top: 1px', 'data-testid': 'jv', value: '', height: 200, width: 600 });
        const root = view.container.firstElementChild;
        expect(root).toHaveClass('custom');
        expect(root).toHaveStyle({ width: '600px', height: '200px', position: 'relative', top: '1px' });
        expect(root).toHaveAttribute('data-testid', 'jv');
        expect(view.container.querySelector(`.${prefixCls}`)).toHaveStyle({ width: '600px', height: '200px' });
    });

    it('默认尺寸为 400 × 400，字符串尺寸原样保留', () => {
        const { view } = setup({ value: undefined });
        expect(view.container.firstElementChild).toHaveStyle({ width: '400px', height: '400px' });
        expect(get(`.${prefixCls}-search-bar-trigger`).parentElement).toHaveStyle({ left: '400px' });
        const percent = setup({ width: '50%', height: '100%' });
        expect(percent.view.container.firstElementChild).toHaveStyle({ width: '50%', height: '100%' });
    });

    it('value 变为与编辑器文本不同的值时重新创建编辑器', async () => {
        const { store } = setup({ value: '1' });
        const first = current();
        store.props.value = '2';
        await settle();
        expect(first.dispose).toHaveBeenCalledTimes(1);
        expect(instances).toHaveLength(2);
        expect(current().value).toBe('2');
        expect(live()).toHaveLength(1);
    });

    it('仅在 options 深层变化时重新创建编辑器', async () => {
        const { store } = setup({ options: { lineHeight: 20 } });
        store.props.options = { lineHeight: 20 };
        await settle();
        expect(instances).toHaveLength(1);
        store.props.options = { lineHeight: 30 };
        await settle();
        expect(instances).toHaveLength(2);
        expect(current().options.lineHeight).toBe(30);
        expect(live()).toHaveLength(1);
    });

    it('options 顶层键的原地修改会重新创建编辑器，嵌套修改不会', async () => {
        const { store } = setup({ options: { readOnly: false, formatOptions: { tabSize: 2 } } });
        (store.props.options as JsonViewerOptions).readOnly = true;
        await settle();
        expect(instances).toHaveLength(2);
        expect(current().options.readOnly).toBe(true);
        ((store.props.options as JsonViewerOptions).formatOptions as { tabSize: number }).tabSize = 4;
        await settle();
        expect(instances).toHaveLength(2);
    });

    it('卸载时销毁编辑器', () => {
        setup().view.unmount();
        expect(current().dispose).toHaveBeenCalledTimes(1);
        expect(live()).toHaveLength(0);
    });

    it('内容变化时调用 onChange，载荷为编辑器文本，只调用最新的监听器', async () => {
        const first = vi.fn<(value: string) => void>();
        const second = vi.fn<(value: string) => void>();
        const { store } = setup({ onChange: first });
        store.props.onChange = second;
        await settle();
        current().value = '12';
        await emit('contentChanged');
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledWith('12');
    });

    describe('value 受控', () => {
        const setupModes = (mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', value: string | undefined = '1', accept = true) => {
            const store = createStore<{ value: string | undefined; accept: boolean; log: string[]; renders: number }>({ value, accept, log: [], renders: 0 });
            render(Modes, { props: { mode, store } });
            flushSync();
            return store;
        };

        it('bind:value：编辑内容回写同值时不重新创建编辑器', async () => {
            const store = setupModes('bind');
            current().value = '12';
            await emit('contentChanged');
            expect(store.value).toBe('12');
            expect(screen.getByRole('status', { name: 'text' })).toHaveTextContent('12');
            expect(instances).toHaveLength(1);
            expect(live()).toHaveLength(1);
        });

        it('bind:value：父级改为不同的值时以新值重新创建编辑器', async () => {
            const store = setupModes('bind');
            const first = current();
            store.value = 'other';
            await settle();
            expect(first.dispose).toHaveBeenCalledTimes(1);
            expect(current().value).toBe('other');
            expect(live()).toHaveLength(1);
        });

        it('bind:value 重置为 undefined 后以空文本重新创建', async () => {
            const store = setupModes('bind');
            store.value = undefined;
            await settle();
            expect(current().value).toBe('');
            expect(live()).toHaveLength(1);
        });

        it('函数绑定：setter 接受时编辑器保持，不重新创建', async () => {
            const store = setupModes('function');
            current().value = '12';
            await emit('contentChanged');
            expect(store.log).toEqual(['set 12', 'change 12']);
            expect(store.value).toBe('12');
            expect(instances).toHaveLength(1);
        });

        it('函数绑定：setter 拒绝时，编辑器按父级的值重新创建', async () => {
            const store = setupModes('function', '1', false);
            current().value = '12';
            await emit('contentChanged');
            expect(store.log).toEqual(['set 12', 'change 12']);
            expect(store.value).toBe('1');
            expect(instances).toHaveLength(2);
            expect(current().value).toBe('1');
            expect(live()).toHaveLength(1);
        });

        it('单向传值：编辑后不被拉回，父级无关重渲染也不重新创建', async () => {
            const store = setupModes('one-way');
            current().value = '12';
            await emit('contentChanged');
            expect(store.log).toEqual(['change 12']);
            await click(screen.getByRole('button', { name: /^render/ }));
            expect(screen.getByRole('button', { name: 'render 1' })).toBeInTheDocument();
            expect(instances).toHaveLength(1);
            expect(current().value).toBe('12');
        });

        it('不传 value：编辑只调用 onChange，不重新创建', async () => {
            const store = setupModes('uncontrolled', undefined);
            current().value = '12';
            await emit('contentChanged');
            expect(store.log).toEqual(['change 12']);
            expect(instances).toHaveLength(1);
        });
    });

    describe('customRender', () => {
        const rules: JsonViewerOptions = { readOnly: true, customRenderRule: [{ name: 'name', match: 'Semi' }, { match: (value) => value === 5 }] };

        it('把 snippet 内容渲染到编辑器 span 中，参数含规则、序号与 token 原文，卸载时移除', async () => {
            const { view } = setup({ options: rules }, { mode: 'custom-render' });
            const map = new Map<HTMLElement, unknown>();
            const name = customSpan(map, 0, '"Semi"');
            const rating = customSpan(map, 1, '5');
            await emit('customRender', { customRenderMap: map });
            expect(name.querySelector('b')).toHaveTextContent('"Semi"');
            expect(name.querySelector('b')).toHaveAttribute('data-name', 'name');
            expect(name.querySelector('b')).toHaveAttribute('data-index', '0');
            expect(rating.querySelector('b')).toHaveTextContent('5');
            expect(rating.querySelector('b')).toHaveAttribute('data-index', '1');
            expect(rating.querySelector('b')).not.toHaveAttribute('data-name');
            view.unmount();
            expect(name).toBeEmptyDOMElement();
            expect(rating).toBeEmptyDOMElement();
        });

        it('编辑器重新布局时沿用同一个映射，旧 span 清空，新 span 有内容', async () => {
            setup({ options: rules }, { mode: 'custom-render' });
            const map = new Map<HTMLElement, unknown>();
            const a = customSpan(map, 0, '"a"');
            await emit('customRender', { customRenderMap: map });
            map.clear();
            const b = customSpan(map, 0, '"b"');
            await emit('customRender', { customRenderMap: map });
            expect(a).toBeEmptyDOMElement();
            expect(b).toHaveTextContent('"b"');
        });

        it('未提供 snippet 或 snippet 不输出内容时 token 保留原文', async () => {
            setup({ options: { readOnly: true, customRenderRule: [{ match: 'Semi' }] } });
            const map = new Map<HTMLElement, unknown>();
            const span = customSpan(map, 0, '"Semi"');
            await emit('customRender', { customRenderMap: map });
            expect(span.textContent).toBe('"Semi"');

            setup({ options: { readOnly: true, customRenderRule: [{ match: 'Semi' }] } }, { mode: 'empty-render' });
            const emptyMap = new Map<HTMLElement, unknown>();
            const empty = customSpan(emptyMap, 0, '"Semi"');
            await emit('customRender', { customRenderMap: emptyMap });
            expect(empty.textContent).toBe('"Semi"');
        });

        it('重新创建编辑器时卸载旧的自定义内容', async () => {
            const { store } = setup({ options: { readOnly: true, customRenderRule: [{ match: 'Semi' }] } }, { mode: 'custom-render' });
            const map = new Map<HTMLElement, unknown>();
            const span = customSpan(map, 0, '"Semi"');
            await emit('customRender', { customRenderMap: map });
            expect(span.querySelector('b')).not.toBeNull();
            store.props.value = '2';
            await settle();
            expect(span).toBeEmptyDOMElement();
        });
    });

    it('打开与关闭搜索栏', async () => {
        setup();
        expect(searchInput()).toBeNull();
        await openBar();
        expect(searchInput()).toBeInTheDocument();
        expect(replaceInput()).toBeInTheDocument();
        expect(trigger()).toBeNull();
        await click(closeButton());
        expect(searchInput()).toBeNull();
        expect(trigger()).toBeInTheDocument();
    });

    it('showSearch 为 false 时隐藏搜索按钮', () => {
        setup({ showSearch: false });
        expect(trigger()).toBeNull();
    });

    it('输入时实时搜索，使用切换后的选项', async () => {
        setup();
        await openBar();
        const { search } = current().searchWidget;
        await typeText(searchInput() as HTMLElement, 'a');
        expect(search).toHaveBeenLastCalledWith('a', false, false, false);

        const [caseSensitive] = optionItems();
        await click(optionButton(0));
        expect(caseSensitive).toHaveClass(`${prefixCls}-search-options-item-active`);
        expect(search).toHaveBeenLastCalledWith('a', true, false, false);
        await click(optionButton(1));
        expect(search).toHaveBeenLastCalledWith('a', true, false, true);
        await click(optionButton(2));
        expect(search).toHaveBeenLastCalledWith('a', true, true, true);
        await click(optionButton(0));
        expect(caseSensitive).not.toHaveClass(`${prefixCls}-search-options-item-active`);
        expect(search).toHaveBeenLastCalledWith('a', false, true, true);
    });

    it('等待输入法组合结束后再搜索', async () => {
        setup();
        await openBar();
        const { search } = current().searchWidget;
        const input = searchInput() as HTMLInputElement;
        await fireEvent.compositionStart(input);
        await typeText(input, 'n');
        await typeText(input, 'ni');
        expect(search).not.toHaveBeenCalled();
        await fireEvent.compositionEnd(input, { target: { value: 'ni' } });
        await settle();
        expect(search).toHaveBeenCalledTimes(1);
        expect(search).toHaveBeenLastCalledWith('ni', false, false, false);
    });

    it('重新打开搜索栏时重置搜索选项', async () => {
        setup();
        await openBar();
        await click(optionButton(0));
        await click(closeButton());
        await openBar();
        expect(optionItems()[0]).not.toHaveClass(`${prefixCls}-search-options-item-active`);
    });

    it('用箭头按钮在搜索结果间切换', async () => {
        setup();
        await openBar();
        const [prev, next] = document.querySelectorAll<HTMLElement>(`.${prefixCls}-search-bar .semi-button-group button`);
        await click(prev);
        expect(current().searchWidget.navigateResults).toHaveBeenLastCalledWith(-1);
        await click(next);
        expect(current().searchWidget.navigateResults).toHaveBeenLastCalledWith(1);
    });

    it('搜索栏打开时内容变化，用输入文本重新搜索', async () => {
        setup();
        await emit('contentChanged');
        expect(current().searchWidget.search).not.toHaveBeenCalled();
        await openBar();
        await typeText(searchInput() as HTMLElement, 'k');
        current().searchWidget.search.mockClear();
        await emit('contentChanged');
        expect(current().searchWidget.search).toHaveBeenCalledWith('k', false, false, false);
    });

    it('searchButton 自建搜索 UI、不渲染默认搜索栏时，内容变化用最近一次搜索重新搜索且不抛错', async () => {
        setup({}, { mode: 'search-button', show: 'never' });
        await click(button('custom'));
        expect(searchInput()).toBeNull();
        current().searchWidget.search.mockClear();
        await expect(emit('contentChanged')).resolves.toBeUndefined();
        expect(current().searchWidget.search).toHaveBeenCalledWith('k', true, false, true);
    });

    it('关闭搜索栏时清除编辑器中的搜索结果', async () => {
        setup();
        await openBar();
        await typeText(searchInput() as HTMLElement, 'k');
        current().searchWidget.clear.mockClear();
        await click(closeButton());
        expect(current().searchWidget.clear).toHaveBeenCalledTimes(1);
    });

    it('showSearch 为 false 时用实例方法 search 搜索，内容变化后同样重新搜索', async () => {
        const { handle } = setup({ showSearch: false });
        handle().search('k');
        current().searchWidget.search.mockClear();
        await emit('contentChanged');
        expect(current().searchWidget.search).toHaveBeenCalledWith('k', false, false, false);
    });

    it('默认搜索栏打开后 showSearch 变为 false，内容变化不抛错', async () => {
        const { store } = setup();
        await openBar();
        await typeText(searchInput() as HTMLElement, 'k');
        store.props.showSearch = false;
        await settle();
        expect(searchInput()).toBeNull();
        current().searchWidget.search.mockClear();
        await expect(emit('contentChanged')).resolves.toBeUndefined();
        expect(current().searchWidget.search).toHaveBeenCalledWith('k', false, false, false);
    });

    it('搜索选项开关是带名称与 aria-pressed 的按钮，可用键盘切换', async () => {
        const user = userEvent.setup();
        setup();
        await openBar();
        const { search } = current().searchWidget;
        await typeText(searchInput() as HTMLElement, 'a');
        const toggle = button(zh.JsonViewer.caseSensitive);
        expect(toggle).toHaveAttribute('aria-pressed', 'false');
        expect(button(zh.JsonViewer.regex)).toBeInTheDocument();
        expect(button(zh.JsonViewer.wholeWord)).toBeInTheDocument();

        toggle.focus();
        await user.keyboard('{Enter}');
        await settle();
        expect(toggle).toHaveAttribute('aria-pressed', 'true');
        expect(search).toHaveBeenLastCalledWith('a', true, false, false);
        await user.keyboard(' ');
        await settle();
        expect(toggle).toHaveAttribute('aria-pressed', 'false');
        expect(search).toHaveBeenLastCalledWith('a', false, false, false);
    });

    it('搜索栏、搜索框与替换框的名称来自语言包', async () => {
        setup({}, { locale: ja_JP });
        await click(button(ja_JP.JsonViewer.search));
        for (const name of [ja_JP.JsonViewer.caseSensitive, ja_JP.JsonViewer.regex, ja_JP.JsonViewer.wholeWord]) {
            expect(button(name)).toBeInTheDocument();
        }
        // jsdom's role table has no implicit role for the search element; the browser test queries the role
        expect(document.querySelector(`search.${prefixCls}-search-bar-container`)).toHaveAttribute('aria-label', ja_JP.JsonViewer.search);
        expect(screen.getByRole('textbox', { name: ja_JP.JsonViewer.search })).toBe(searchInput());
        expect(screen.getByRole('textbox', { name: ja_JP.JsonViewer.replace })).toBe(replaceInput());
    });

    it('使用替换输入框的文本进行替换', async () => {
        setup();
        await openBar();
        await typeText(replaceInput() as HTMLElement, 'x');
        const [replace, replaceAll] = replaceButtons();
        await click(replace);
        expect(current().searchWidget.replace).toHaveBeenCalledWith('x');
        await click(replaceAll);
        expect(current().searchWidget.replaceAll).toHaveBeenCalledWith('x');
    });

    it('readOnly 时禁用替换', async () => {
        const { handle } = setup({ options: { readOnly: true } });
        await openBar();
        for (const replaceButton of replaceButtons()) {
            expect(replaceButton).toBeDisabled();
        }
        handle().replace('x');
        handle().replaceAll('x');
        expect(current().searchWidget.replace).not.toHaveBeenCalled();
        expect(current().searchWidget.replaceAll).not.toHaveBeenCalled();
    });

    it('经 bind:this 暴露命令式方法', () => {
        const { handle } = setup({ value: 'v', height: '50%', width: 300 });
        const widget = current().searchWidget;
        expect(handle().getValue()).toBe('v');
        handle().format();
        expect(current().format).toHaveBeenCalledTimes(1);
        handle().search('a', true);
        expect(widget.search).toHaveBeenLastCalledWith('a', true, false, false);
        handle().search('b');
        expect(widget.search).toHaveBeenLastCalledWith('b', false, false, false);
        expect(handle().getSearchResults()).toBe(widget.searchResults);
        handle().prevSearch();
        expect(widget.navigateResults).toHaveBeenLastCalledWith(-1);
        handle().prevSearch(2);
        expect(widget.navigateResults).toHaveBeenLastCalledWith(-2);
        handle().nextSearch();
        expect(widget.navigateResults).toHaveBeenLastCalledWith(1);
        handle().nextSearch(3);
        expect(widget.navigateResults).toHaveBeenLastCalledWith(3);
        handle().replace('r');
        expect(widget.replace).toHaveBeenCalledWith('r');
        handle().replaceAll('R');
        expect(widget.replaceAll).toHaveBeenCalledWith('R');
        expect(handle().getStyle()).toEqual({ width: 300, height: '50%' });
    });

    describe('searchButton', () => {
        it('参数中的 showSearchBar 随切换更新，搜索控件落到编辑器', async () => {
            setup({}, { mode: 'search-button' });
            const open = screen.getByRole('status', { name: 'open' });
            expect(open).toHaveTextContent('false');
            expect(trigger()).toBeNull();
            await click(button('toggle'));
            expect(open).toHaveTextContent('true');
            expect(searchInput()).toBeInTheDocument();

            const widget = current().searchWidget;
            await click(button('search'));
            expect(widget.search).toHaveBeenLastCalledWith('s', false, true, false);
            await click(button('prev'));
            expect(widget.navigateResults).toHaveBeenLastCalledWith(-1);
            await click(button('next'));
            expect(widget.navigateResults).toHaveBeenLastCalledWith(1);
            await click(button('replace'));
            expect(widget.replace).toHaveBeenCalledWith('x');
            await click(button('replace all'));
            expect(widget.replaceAll).toHaveBeenCalledWith('y');
        });

        it('只渲染 defaultButton 时与默认按钮一致', async () => {
            setup({}, { mode: 'default-button' });
            expect(button(zh.JsonViewer.search)).toBe(trigger());
            await openBar();
            expect(searchInput()).toBeInTheDocument();
        });

        it('showSearch 为 false 时 snippet 也不渲染', () => {
            setup({ showSearch: false }, { mode: 'search-button', show: 'never' });
            expect(screen.queryByText('toggle')).toBeNull();
        });
    });

    describe('焦点', () => {
        it('初次挂载不移动焦点，打开搜索栏后焦点移入搜索框', async () => {
            setup();
            expect(document.activeElement).toBe(document.body);
            await openBar();
            expect(searchInput()).toHaveFocus();
        });

        it('点关闭按钮或在搜索栏内按 Esc 后焦点回到触发按钮', async () => {
            setup();
            await openBar();
            await click(closeButton());
            expect(trigger()).toHaveFocus();
            await openBar();
            await fireEvent.keyDown(searchInput() as HTMLElement, { key: 'Escape' });
            await settle();
            expect(searchInput()).toBeNull();
            expect(trigger()).toHaveFocus();
        });

        it('在搜索栏的每个输入框与按钮上按 Esc 都关闭搜索栏，按键不再冒泡', async () => {
            setup();
            const controls = [searchInput, replaceInput, () => optionButton(0), () => optionButton(1), () => optionButton(2), () => button(zh.JsonViewer.previousMatch), () => button(zh.JsonViewer.nextMatch), closeButton, () => replaceButtons()[0], () => replaceButtons()[1]];
            const outside = vi.fn<(event: KeyboardEvent) => void>();
            document.addEventListener('keydown', outside);
            try {
                for (const control of controls) {
                    await openBar();
                    await fireEvent.keyDown(control() as HTMLElement, { key: 'Escape' });
                    await settle();
                    expect(searchInput()).toBeNull();
                }
                expect(outside).not.toHaveBeenCalled();
            } finally {
                document.removeEventListener('keydown', outside);
            }
        });

        it('搜索栏容器本身不处理按键', async () => {
            setup();
            await openBar();
            await fireEvent.keyDown(get(`.${prefixCls}-search-bar-container`), { key: 'Escape' });
            await settle();
            expect(searchInput()).toBeInTheDocument();
        });

        it('搜索栏外的程序化关闭不移动焦点', async () => {
            setup({}, { mode: 'search-button', show: 'always' });
            const toggle = button('toggle');
            await click(toggle);
            expect(searchInput()).toHaveFocus();
            toggle.focus();
            await click(toggle);
            expect(trigger()).not.toHaveFocus();
            expect(toggle).toHaveFocus();
        });
    });

    describe('拖动搜索按钮', () => {
        it('鼠标拖动只吞掉紧随的 click，之后键盘 Enter 仍能打开搜索栏', async () => {
            const user = userEvent.setup();
            setup();
            const trigger = get(`.${prefixCls}-search-bar-trigger`);
            drag(trigger, 'mouse');
            await click(trigger);
            expect(searchInput()).toBeNull();
            await new Promise((resolve) => setTimeout(resolve));
            trigger.focus();
            await user.keyboard('{Enter}');
            await settle();
            expect(searchInput()).toBeInTheDocument();
        });

        it('触摸拖动后同样只吞掉紧随的 click', async () => {
            setup();
            const trigger = get(`.${prefixCls}-search-bar-trigger`);
            drag(trigger, 'touch');
            await click(trigger);
            expect(searchInput()).toBeNull();
            await new Promise((resolve) => setTimeout(resolve));
            await click(trigger);
            expect(searchInput()).toBeInTheDocument();
        });

        it('limitSearchButtonBounds 为 true 时拖动被限制在容器内', async () => {
            setup({ limitSearchButtonBounds: true });
            const wrapper = get(`.${prefixCls}-search-bar-trigger`).parentElement as HTMLElement;
            const container = wrapper.parentElement as HTMLElement;
            for (const [element, width, height] of [
                [container, 100, 100],
                [wrapper, 20, 20],
            ] as const) {
                Object.defineProperty(element, 'offsetWidth', { configurable: true, value: width });
                Object.defineProperty(element, 'offsetHeight', { configurable: true, value: height });
            }
            vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
                callback(0);
                return 0;
            });

            drag(wrapper, 'mouse');
            pointer(wrapper, 'pointerdown', { pointerId: 2, pointerType: 'mouse', button: 0, clientX: 0, clientY: 0 });
            pointer(document, 'pointermove', { pointerId: 2, pointerType: 'mouse', clientX: 900, clientY: 900 });
            pointer(document, 'pointerup', { pointerId: 2, pointerType: 'mouse' });

            expect(wrapper.style.left).toBe('80px');
            expect(wrapper.style.top).toBe('80px');
        });
    });

    describe('属性落点', () => {
        it('其他 DOM 属性透传到根节点，aria-label 让根节点成为 group，组件自身的属性不透传', async () => {
            const onclick = vi.fn<() => void>();
            const { view } = setup({ id: 'jv', 'aria-label': 'json', onclick, onChange: () => {} });
            const root = view.container.firstElementChild as HTMLElement;
            expect(root).toHaveAttribute('id', 'jv');
            expect(root).toHaveAttribute('aria-label', 'json');
            expect(root).toHaveAttribute('role', 'group');
            expect(root).not.toHaveAttribute('value');
            expect(root).not.toHaveAttribute('options');
            await click(root);
            expect(onclick).toHaveBeenCalledTimes(1);
            await openBar();
            expect(searchInput()).not.toHaveAttribute('id');
        });

        it('aria-labelledby 同样加 role="group"，使用方的 role 优先，无名称时没有 role', () => {
            const labelled = setup({ 'aria-labelledby': 'title' });
            expect(labelled.view.container.firstElementChild).toHaveAttribute('role', 'group');
            const region = setup({ 'aria-label': 'json', role: 'region' });
            expect(region.view.container.firstElementChild).toHaveAttribute('role', 'region');
            const plain = setup();
            expect(plain.view.container.firstElementChild).not.toHaveAttribute('role');
        });
    });

    it('全局 Input 默认值不给搜索栏输入框加清除按钮', async () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        setup();
        await openBar();
        await typeText(searchInput() as HTMLElement, 'k');
        await typeText(replaceInput() as HTMLElement, 'k');
        expect(get(`.${prefixCls}-search-bar-container`).querySelector('.semi-input-clearbtn')).toBeNull();
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，传入值优先', () => {
        semiGlobal.config.overrideDefaultProps = {
            JsonViewer: { width: 321, showSearch: false, options: { readOnly: true } },
        };
        const { view } = setup({ value: undefined });
        expect(view.container.firstElementChild).toHaveStyle({ width: '321px', height: '400px' });
        expect(trigger()).toBeNull();
        expect(current().options).toEqual({ prefixCls, ariaLabel, readOnly: true, autoWrap: true });
        const explicit = setup({ value: undefined, width: 500, showSearch: true, options: { lineHeight: 30 } });
        expect(explicit.view.container.firstElementChild).toHaveStyle({ width: '500px' });
        expect(trigger()).toBeInTheDocument();
        expect(current().options).toEqual({ prefixCls, ariaLabel, readOnly: false, autoWrap: true, lineHeight: 30 });
    });

    describe('使用 ResizeObserver', () => {
        let resize: ReturnType<typeof mockResizeObserverCore>;
        beforeEach(() => {
            resize = mockResizeObserverCore();
            vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
                callback(0);
                return 1;
            });
        });

        const isViewer = (element: Element) => element.classList.contains(prefixCls);
        const liveObservers = () => resize.live().filter((observer) => observer.targets.some(isViewer));

        it('开启 autoWrap 时宽度变化会重新布局编辑器', () => {
            const { view } = setup();
            expect(liveObservers()).toHaveLength(1);
            const viewer = view.container.querySelector(`.${prefixCls}`) as HTMLElement;
            expect(liveObservers()[0].targets).toContain(viewer);
            const editor = current();
            editor.layout.mockClear();

            resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 400.2, blockSize: 400 }] }]);
            expect(editor.layout).not.toHaveBeenCalled();
            resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 120, blockSize: 400 }] }]);
            expect(editor.resetMeasuredHeights).toHaveBeenCalledTimes(1);
            expect(editor.layout).toHaveBeenCalledTimes(1);
            resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 120.3, blockSize: 400 }] }]);
            expect(editor.layout).toHaveBeenCalledTimes(1);

            view.unmount();
            expect(liveObservers()).toHaveLength(0);
        });

        it('高度变化时重新布局，不清除已测量的行高', () => {
            const { view } = setup({ height: 400 });
            const viewer = view.container.querySelector(`.${prefixCls}`) as HTMLElement;
            const editor = current();
            editor.layout.mockClear();
            resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 400, blockSize: 800 }] }]);
            expect(editor.layout).toHaveBeenCalledTimes(1);
            expect(editor.resetMeasuredHeights).not.toHaveBeenCalled();
        });

        it('未开启 autoWrap 时只在高度变化时重新布局', () => {
            const { view } = setup({ options: { autoWrap: false } });
            const viewer = view.container.querySelector(`.${prefixCls}`) as HTMLElement;
            const editor = current();
            editor.layout.mockClear();
            resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 120, blockSize: 400 }] }]);
            expect(editor.layout).not.toHaveBeenCalled();
            resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 120, blockSize: 100 }] }]);
            expect(editor.layout).toHaveBeenCalledTimes(1);
            expect(editor.resetMeasuredHeights).not.toHaveBeenCalled();
        });

        it('重新创建与切换 autoWrap 后只保留一个 observer', async () => {
            const { store } = setup();
            expect(liveObservers()).toHaveLength(1);
            store.props.value = '2';
            await settle();
            expect(liveObservers()).toHaveLength(1);
            store.props.options = { autoWrap: false };
            await settle();
            expect(liveObservers()).toHaveLength(1);
        });
    });

    it('Props 不声明 children 与小写 onchange', () => {
        expectTypeOf<JsonViewerProps>().not.toHaveProperty('children');
        expectTypeOf<JsonViewerProps>().not.toHaveProperty('onchange');
        expectTypeOf<JsonViewerProps>().not.toHaveProperty('renderTooltip');
    });
});

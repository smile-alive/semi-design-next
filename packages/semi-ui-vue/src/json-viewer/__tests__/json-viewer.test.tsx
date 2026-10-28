/** @jsxImportSource vue */
import { KeepAlive, nextTick, reactive, shallowRef } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { beforeEach, describe, expect, expectTypeOf, it, vi, type Mock } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { mockResizeObserver, render, sleep } from '@test/utils/vue';
import JsonViewer, { type JsonViewerHandle, type JsonViewerOptions, type JsonViewerProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import LocaleProvider from '../../locale/locale-provider.vue';
import CustomRender from './fixtures/custom-render.vue';
import DefaultButton from './fixtures/default-button.vue';
import EmptyRender from './fixtures/empty-render.vue';
import Model from './fixtures/model.vue';
import OneWay from './fixtures/one-way.vue';
import SearchButtonSlot from './fixtures/search-button.vue';

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

// the mocked core below keeps every instance it creates; the test tsconfig does not resolve the core package
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

type Props = JsonViewerProps & Record<string, unknown>;
type CoreRule = { render: (content: string) => unknown };

const prefixCls = 'semi-json-viewer';
const ariaLabel = zh_CN.JsonViewer.content;
const live = () => instances.filter((instance) => instance.dispose.mock.calls.length === 0);
const current = () => {
    const instance = instances.at(-1);
    if (!instance) throw new Error('no editor was created');
    return instance;
};
const query = (selector: string) => document.querySelector<HTMLElement>(selector);
const get = (selector: string) => {
    const element = query(selector);
    if (!element) throw new Error(`missing ${selector}`);
    return element;
};
const trigger = () => query(`.${prefixCls}-search-bar-trigger`);
const searchInput = () => query(`.${prefixCls}-search-bar input`);
const replaceInput = () => query(`.${prefixCls}-replace-bar input`);
const replaceButtons = () => document.querySelectorAll<HTMLElement>(`.${prefixCls}-replace-bar button`);
const optionItems = () => document.querySelectorAll<HTMLElement>(`.${prefixCls}-search-options-item`);
const optionButton = (index: number) => optionItems()[index].querySelector('button') as HTMLElement;
const closeButton = () => get(`.${prefixCls}-search-bar > button:last-child`);
const emit = async (event: string, data: unknown = {}) => {
    current().emitter.emit(event, data);
    await nextTick();
};
const mount = (props: Props = {}) => render(JsonViewer, { props: { modelValue: '1', ...props } });
const openBar = () => fireEvent.click(get(`.${prefixCls}-search-bar-trigger`));
const customSpan = (map: Map<HTMLElement, unknown>, ruleIndex: number, content: string) => {
    const span = document.createElement('span');
    current().container.appendChild(span);
    map.set(span, (current().options.customRenderRule as CoreRule[])[ruleIndex].render(content));
    return span;
};
const pointer = (target: EventTarget, type: string, init: PointerEventInit) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...init }));
const drag = (element: Element, pointerType: string) => {
    pointer(element, 'pointerdown', { pointerId: 1, pointerType, button: 0, clientX: 0, clientY: 0 });
    pointer(document, 'pointermove', { pointerId: 1, pointerType, clientX: 30, clientY: 30 });
    pointer(document, 'pointerup', { pointerId: 1, pointerType });
};

describe('JsonViewer', () => {
    beforeEach(() => {
        instances.length = 0;
    });

    it('为搜索触发按钮与搜索栏按钮提供名称', async () => {
        mount();
        await fireEvent.click(screen.getByRole('button', { name: zh_CN.JsonViewer.search }));
        for (const name of [zh_CN.JsonViewer.previousMatch, zh_CN.JsonViewer.nextMatch, zh_CN.JsonViewer.close]) {
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
        }
    });

    it('用 modelValue 与默认选项在 editor 容器中创建编辑器，然后进行布局', () => {
        const { container } = mount({ modelValue: '{"a":1}' });
        const editor = container.querySelector(`.${prefixCls}`);
        expect(editor).toHaveClass(`${prefixCls}-background`);
        expect(instances).toHaveLength(1);
        expect(current().container).toBe(editor);
        expect(current().value).toBe('{"a":1}');
        expect(current().options).toEqual({ prefixCls, ariaLabel, readOnly: false, autoWrap: true });
        expect(current().layout).toHaveBeenCalledTimes(1);
    });

    it('未传 modelValue 时以空文本创建编辑器', () => {
        render(JsonViewer);
        expect(current().value).toBe('');
    });

    it('在 prefixCls 之后把 options 传给编辑器', () => {
        mount({ options: { lineHeight: 30, readOnly: true } });
        expect(current().options).toEqual({ prefixCls, ariaLabel, autoWrap: true, lineHeight: 30, readOnly: true });
    });

    it('options 未指定 autoWrap 时仍按默认自动换行，并监听尺寸', () => {
        const resize = mockResizeObserver();
        mount({ options: { readOnly: true }, showSearch: false });
        expect(current().options.autoWrap).toBe(true);
        expect(resize.observed()).toContain(current().container);
    });

    it('options 显式传入 autoWrap: false 时关闭自动换行', () => {
        mount({ options: { autoWrap: false } });
        expect(current().options.autoWrap).toBe(false);
    });

    it('options 里值为 undefined 的键回退为默认值', () => {
        mount({ options: { ariaLabel: undefined, autoWrap: undefined, readOnly: undefined } });
        expect(current().options).toEqual({ prefixCls, ariaLabel, readOnly: false, autoWrap: true });
    });

    it('除非 options 指定，否则从语言包获取内容区域名称，并跟随语言切换', async () => {
        const locale = shallowRef(zh_CN);
        const options = shallowRef<JsonViewerOptions>({ ariaLabel: 'Config' });
        render(() => <LocaleProvider locale={locale.value}>{() => <JsonViewer modelValue="1" options={options.value} />}</LocaleProvider>);
        expect(current().options.ariaLabel).toBe('Config');
        options.value = {};
        await nextTick();
        expect(current().options.ariaLabel).toBe(ariaLabel);
        locale.value = en_US;
        await nextTick();
        expect(current().options.ariaLabel).toBe(en_US.JsonViewer.content);
        expect(instances).toHaveLength(3);
        expect(live()).toHaveLength(1);
    });

    it('设置两个 div 的尺寸，根节点合并 class 与 style，并透传 data-*', () => {
        const { container } = mount({
            class: 'custom',
            style: { top: '1px' },
            'data-testid': 'jv',
            modelValue: '',
            height: 200,
            width: 600,
        });
        const root = container.firstElementChild;
        expect(root).toHaveClass('custom');
        expect(root).toHaveStyle({ width: '600px', height: '200px', position: 'relative', top: '1px' });
        expect(root).toHaveAttribute('data-testid', 'jv');
        expect(container.querySelector(`.${prefixCls}`)).toHaveStyle({ width: '600px', height: '200px' });
    });

    it('默认尺寸为 400 × 400，字符串尺寸原样保留', () => {
        const { container } = mount();
        expect(container.firstElementChild).toHaveStyle({ width: '400px', height: '400px' });
        const percent = mount({ width: '50%', height: '100%' });
        expect(percent.container.firstElementChild).toHaveStyle({ width: '50%', height: '100%' });
        expect(get(`.${prefixCls}-search-bar-trigger`).parentElement).toHaveStyle({ left: '400px' });
    });

    it('modelValue 变为与编辑器文本不同的值时重新创建编辑器', async () => {
        const view = mount({ modelValue: '1' });
        const first = current();
        await view.rerender({ modelValue: '2' });
        expect(first.dispose).toHaveBeenCalledTimes(1);
        expect(instances).toHaveLength(2);
        expect(current().value).toBe('2');
        expect(live()).toHaveLength(1);
    });

    it('仅在 options 深层变化时重新创建编辑器', async () => {
        const view = mount({ options: { lineHeight: 20 } });
        await view.rerender({ options: { lineHeight: 20 } });
        expect(instances).toHaveLength(1);
        await view.rerender({ options: { lineHeight: 30 } });
        expect(instances).toHaveLength(2);
        expect(current().options.lineHeight).toBe(30);
        expect(live()).toHaveLength(1);
    });

    it('options 顶层键的原地修改会重新创建编辑器，嵌套修改不会', async () => {
        const formatOptions = reactive({ tabSize: 2 });
        const options = reactive<JsonViewerOptions>({ readOnly: false, formatOptions });
        render(() => <JsonViewer modelValue="1" options={options} />);
        options.readOnly = true;
        await nextTick();
        expect(instances).toHaveLength(2);
        expect(current().options.readOnly).toBe(true);
        formatOptions.tabSize = 4;
        await nextTick();
        expect(instances).toHaveLength(2);
    });

    it('卸载时销毁编辑器', () => {
        mount().unmount();
        expect(current().dispose).toHaveBeenCalledTimes(1);
        expect(live()).toHaveLength(0);
    });

    it('内容变化时依次发出 update:modelValue 与 change，载荷为编辑器文本，各一次，只调用最新的监听器', async () => {
        const calls: string[][] = [];
        const first = vi.fn<(value: string) => void>();
        const view = mount({ onChange: first });
        await view.rerender({
            onChange: (value: string) => calls.push(['change', value]),
            'onUpdate:modelValue': (value: string) => calls.push(['update:modelValue', value]),
        });
        current().value = '12';
        await emit('contentChanged');
        expect(first).not.toHaveBeenCalled();
        expect(calls).toEqual([
            ['update:modelValue', '12'],
            ['change', '12'],
        ]);
    });

    it('@change 不收到搜索框冒泡的原生 change', async () => {
        const onChange = vi.fn<(value: string) => void>();
        mount({ onChange });
        await openBar();
        await fireEvent.change(searchInput() as HTMLElement);
        expect(onChange).not.toHaveBeenCalled();
    });

    describe('v-model', () => {
        it('编辑内容回写同值时不重新创建编辑器', async () => {
            render(Model);
            current().value = '12';
            await emit('contentChanged');
            expect(screen.getByRole('status', { name: 'text' })).toHaveTextContent('12');
            await nextTick();
            expect(instances).toHaveLength(1);
            expect(live()).toHaveLength(1);
        });

        it('父组件改为不同的值时以新值重新创建编辑器', async () => {
            render(Model);
            const first = current();
            await fireEvent.click(screen.getByRole('button', { name: 'reset' }));
            expect(first.dispose).toHaveBeenCalledTimes(1);
            expect(current().value).toBe('other');
            expect(live()).toHaveLength(1);
        });

        it('单向绑定时编辑后不被拉回，父组件无关重渲染也不重新创建', async () => {
            render(OneWay);
            current().value = '12';
            await emit('contentChanged');
            expect(screen.getByRole('status', { name: 'changes' })).toHaveTextContent('1');
            await fireEvent.click(screen.getByRole('button', { name: /^render/ }));
            expect(screen.getByRole('button', { name: 'render 1' })).toBeInTheDocument();
            expect(instances).toHaveLength(1);
            expect(current().value).toBe('12');
        });
    });

    describe('#customRender', () => {
        it('把插槽内容渲染到编辑器 span 中，参数含规则、序号与 token 原文，卸载时移除', async () => {
            const view = render(CustomRender);
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
            render(CustomRender);
            const map = new Map<HTMLElement, unknown>();
            const a = customSpan(map, 0, '"a"');
            await emit('customRender', { customRenderMap: map });
            map.clear();
            const b = customSpan(map, 0, '"b"');
            await emit('customRender', { customRenderMap: map });
            expect(a).toBeEmptyDOMElement();
            expect(b).toHaveTextContent('"b"');
        });

        it('未提供插槽或插槽为空时 token 保留原文', async () => {
            mount({ options: { readOnly: true, customRenderRule: [{ match: 'Semi' }] } });
            const map = new Map<HTMLElement, unknown>();
            const span = customSpan(map, 0, '"Semi"');
            await emit('customRender', { customRenderMap: map });
            expect(span.textContent).toBe('"Semi"');

            render(EmptyRender);
            const emptyMap = new Map<HTMLElement, unknown>();
            const empty = customSpan(emptyMap, 0, '"Semi"');
            await emit('customRender', { customRenderMap: emptyMap });
            expect(empty.textContent).toBe('"Semi"');
        });

        it('重新创建编辑器时卸载旧的自定义内容，且无告警', async () => {
            const warn = vi.spyOn(console, 'warn');
            const view = mount({ options: { readOnly: true, customRenderRule: [{ match: 'Semi' }] } });
            const map = new Map<HTMLElement, unknown>();
            const span = customSpan(map, 0, '"Semi"');
            await emit('customRender', { customRenderMap: map });
            await view.rerender({ modelValue: '2' });
            expect(span).toBeEmptyDOMElement();
            view.unmount();
            expect(warn).not.toHaveBeenCalled();
        });
    });

    it('打开与关闭搜索栏', async () => {
        mount();
        expect(searchInput()).toBeNull();
        await openBar();
        expect(searchInput()).toBeInTheDocument();
        expect(replaceInput()).toBeInTheDocument();
        expect(trigger()).toBeNull();
        await fireEvent.click(closeButton());
        expect(searchInput()).toBeNull();
        expect(trigger()).toBeInTheDocument();
    });

    it('showSearch 为 false 时隐藏搜索按钮', () => {
        mount({ showSearch: false });
        expect(trigger()).toBeNull();
    });

    it('输入时实时搜索，使用切换后的选项', async () => {
        mount();
        await openBar();
        const { search } = current().searchWidget;
        await fireEvent.update(searchInput() as HTMLElement, 'a');
        expect(search).toHaveBeenLastCalledWith('a', false, false, false);

        const [caseSensitive] = optionItems();
        await fireEvent.click(optionButton(0));
        expect(caseSensitive).toHaveClass(`${prefixCls}-search-options-item-active`);
        expect(search).toHaveBeenLastCalledWith('a', true, false, false);
        await fireEvent.click(optionButton(1));
        expect(search).toHaveBeenLastCalledWith('a', true, false, true);
        await fireEvent.click(optionButton(2));
        expect(search).toHaveBeenLastCalledWith('a', true, true, true);
        await fireEvent.click(optionButton(0));
        expect(caseSensitive).not.toHaveClass(`${prefixCls}-search-options-item-active`);
        expect(search).toHaveBeenLastCalledWith('a', false, true, true);
    });

    it('等待输入法组合结束后再搜索', async () => {
        mount();
        await openBar();
        const { search } = current().searchWidget;
        const input = searchInput() as HTMLInputElement;
        await fireEvent.compositionStart(input);
        await fireEvent.update(input, 'n');
        await fireEvent.update(input, 'ni');
        expect(search).not.toHaveBeenCalled();
        await fireEvent.compositionEnd(input);
        expect(search).toHaveBeenCalledTimes(1);
        expect(search).toHaveBeenLastCalledWith('ni', false, false, false);
    });

    it('重新打开搜索栏时重置搜索选项', async () => {
        mount();
        await openBar();
        await fireEvent.click(optionButton(0));
        await fireEvent.click(closeButton());
        await openBar();
        expect(optionItems()[0]).not.toHaveClass(`${prefixCls}-search-options-item-active`);
    });

    it('用箭头按钮在搜索结果间切换', async () => {
        mount();
        await openBar();
        const [prev, next] = document.querySelectorAll<HTMLElement>(`.${prefixCls}-search-bar .semi-button-group button`);
        await fireEvent.click(prev);
        expect(current().searchWidget.navigateResults).toHaveBeenLastCalledWith(-1);
        await fireEvent.click(next);
        expect(current().searchWidget.navigateResults).toHaveBeenLastCalledWith(1);
    });

    it('搜索栏打开时内容变化，用输入文本重新搜索', async () => {
        mount();
        await emit('contentChanged');
        expect(current().searchWidget.search).not.toHaveBeenCalled();
        await openBar();
        await fireEvent.update(searchInput() as HTMLElement, 'k');
        current().searchWidget.search.mockClear();
        await emit('contentChanged');
        expect(current().searchWidget.search).toHaveBeenCalledWith('k', false, false, false);
    });

    it('#searchButton 自建搜索 UI、不渲染默认搜索栏时，内容变化用最近一次搜索重新搜索且不抛错', async () => {
        render(SearchButtonSlot, { props: { show: 'never' } });
        await fireEvent.click(screen.getByRole('button', { name: 'custom' }));
        expect(searchInput()).toBeNull();
        current().searchWidget.search.mockClear();
        await expect(emit('contentChanged')).resolves.toBeUndefined();
        expect(current().searchWidget.search).toHaveBeenCalledWith('k', true, false, true);
    });

    it('关闭搜索栏时清除编辑器中的搜索结果', async () => {
        mount();
        await openBar();
        await fireEvent.update(searchInput() as HTMLElement, 'k');
        current().searchWidget.clear.mockClear();
        await fireEvent.click(closeButton());
        expect(current().searchWidget.clear).toHaveBeenCalledTimes(1);
    });

    it('showSearch 为 false 时用 ref.search 搜索，内容变化后同样重新搜索', async () => {
        let handle: JsonViewerHandle | undefined;
        render(() => <JsonViewer modelValue="1" showSearch={false} ref={(value) => (handle = value as unknown as JsonViewerHandle)} />);
        handle?.search('k');
        current().searchWidget.search.mockClear();
        await emit('contentChanged');
        expect(current().searchWidget.search).toHaveBeenCalledWith('k', false, false, false);
    });

    it('默认搜索栏打开后 showSearch 变为 false，内容变化不抛错', async () => {
        const view = mount();
        await openBar();
        await fireEvent.update(searchInput() as HTMLElement, 'k');
        await view.rerender({ showSearch: false });
        expect(searchInput()).toBeNull();
        current().searchWidget.search.mockClear();
        await expect(emit('contentChanged')).resolves.toBeUndefined();
        expect(current().searchWidget.search).toHaveBeenCalledWith('k', false, false, false);
    });

    it('搜索选项开关是带名称与 aria-pressed 的按钮，可用键盘切换', async () => {
        const user = userEvent.setup();
        mount();
        await openBar();
        const { search } = current().searchWidget;
        await fireEvent.update(searchInput() as HTMLElement, 'a');
        const toggle = screen.getByRole('button', { name: zh_CN.JsonViewer.caseSensitive });
        expect(toggle).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: zh_CN.JsonViewer.regex })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: zh_CN.JsonViewer.wholeWord })).toBeInTheDocument();

        toggle.focus();
        await user.keyboard('{Enter}');
        expect(toggle).toHaveAttribute('aria-pressed', 'true');
        expect(search).toHaveBeenLastCalledWith('a', true, false, false);
        await user.keyboard(' ');
        expect(toggle).toHaveAttribute('aria-pressed', 'false');
        expect(search).toHaveBeenLastCalledWith('a', false, false, false);
    });

    it('搜索栏、搜索框与替换框的名称来自语言包', async () => {
        render(() => <LocaleProvider locale={ja_JP}>{() => <JsonViewer modelValue="1" />}</LocaleProvider>);
        await fireEvent.click(screen.getByRole('button', { name: ja_JP.JsonViewer.search }));
        for (const name of [ja_JP.JsonViewer.caseSensitive, ja_JP.JsonViewer.regex, ja_JP.JsonViewer.wholeWord]) {
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
        }
        // jsdom's role table has no implicit role for the search element; the browser test queries the role
        expect(document.querySelector(`search.${prefixCls}-search-bar-container`)).toHaveAttribute('aria-label', ja_JP.JsonViewer.search);
        expect(screen.getByRole('textbox', { name: ja_JP.JsonViewer.search })).toBe(searchInput());
        expect(screen.getByRole('textbox', { name: ja_JP.JsonViewer.replace })).toBe(replaceInput());
    });

    it('使用替换输入框的文本进行替换', async () => {
        mount();
        await openBar();
        await fireEvent.update(replaceInput() as HTMLElement, 'x');
        const [replace, replaceAll] = replaceButtons();
        await fireEvent.click(replace);
        expect(current().searchWidget.replace).toHaveBeenCalledWith('x');
        await fireEvent.click(replaceAll);
        expect(current().searchWidget.replaceAll).toHaveBeenCalledWith('x');
    });

    it('readOnly 时禁用替换', async () => {
        let handle: JsonViewerHandle | undefined;
        render(() => <JsonViewer modelValue="1" options={{ readOnly: true }} ref={(value) => (handle = value as unknown as JsonViewerHandle)} />);
        await openBar();
        for (const button of replaceButtons()) {
            expect(button).toBeDisabled();
        }
        handle?.replace('x');
        handle?.replaceAll('x');
        expect(current().searchWidget.replace).not.toHaveBeenCalled();
        expect(current().searchWidget.replaceAll).not.toHaveBeenCalled();
    });

    it('在 ref 上暴露命令式方法，且只暴露这 9 个', () => {
        let handle: JsonViewerHandle | undefined;
        render(() => <JsonViewer modelValue="v" height="50%" width={300} ref={(value) => (handle = value as unknown as JsonViewerHandle)} />);
        if (!handle) throw new Error('no handle');
        const widget = current().searchWidget;
        expect(handle.getValue()).toBe('v');
        handle.format();
        expect(current().format).toHaveBeenCalledTimes(1);
        handle.search('a', true);
        expect(widget.search).toHaveBeenLastCalledWith('a', true, false, false);
        handle.search('b');
        expect(widget.search).toHaveBeenLastCalledWith('b', false, false, false);
        expect(handle.getSearchResults()).toBe(widget.searchResults);
        handle.prevSearch();
        expect(widget.navigateResults).toHaveBeenLastCalledWith(-1);
        handle.prevSearch(2);
        expect(widget.navigateResults).toHaveBeenLastCalledWith(-2);
        handle.nextSearch();
        expect(widget.navigateResults).toHaveBeenLastCalledWith(1);
        handle.nextSearch(3);
        expect(widget.navigateResults).toHaveBeenLastCalledWith(3);
        handle.replace('r');
        expect(widget.replace).toHaveBeenCalledWith('r');
        handle.replaceAll('R');
        expect(widget.replaceAll).toHaveBeenCalledWith('R');
        expect(handle.getStyle()).toEqual({ width: 300, height: '50%' });
        expect(Object.keys(handle).toSorted()).toEqual(['format', 'getSearchResults', 'getStyle', 'getValue', 'nextSearch', 'prevSearch', 'replace', 'replaceAll', 'search']);
    });

    describe('#searchButton', () => {
        it('参数中的 showSearchBar 随切换更新，搜索控件落到编辑器', async () => {
            render(SearchButtonSlot);
            const open = screen.getByRole('status', { name: 'open' });
            expect(open).toHaveTextContent('false');
            expect(trigger()).toBeNull();
            await fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
            expect(open).toHaveTextContent('true');
            expect(searchInput()).toBeInTheDocument();

            const widget = current().searchWidget;
            await fireEvent.click(screen.getByRole('button', { name: 'search' }));
            expect(widget.search).toHaveBeenLastCalledWith('s', false, true, false);
            await fireEvent.click(screen.getByRole('button', { name: 'prev' }));
            expect(widget.navigateResults).toHaveBeenLastCalledWith(-1);
            await fireEvent.click(screen.getByRole('button', { name: 'next' }));
            expect(widget.navigateResults).toHaveBeenLastCalledWith(1);
            await fireEvent.click(screen.getByRole('button', { name: 'replace' }));
            expect(widget.replace).toHaveBeenCalledWith('x');
            await fireEvent.click(screen.getByRole('button', { name: 'replace all' }));
            expect(widget.replaceAll).toHaveBeenCalledWith('y');
        });

        it('只渲染 defaultButton 时与默认按钮一致', async () => {
            render(DefaultButton);
            expect(screen.getByRole('button', { name: zh_CN.JsonViewer.search })).toBe(trigger());
            await openBar();
            expect(searchInput()).toBeInTheDocument();
        });

        it('showSearch 为 false 时插槽也不渲染', () => {
            render(() => (
                <JsonViewer showSearch={false}>
                    {{
                        searchButton: () => <i>custom</i>,
                    }}
                </JsonViewer>
            ));
            expect(screen.queryByText('custom')).toBeNull();
        });
    });

    describe('焦点', () => {
        it('初次挂载不移动焦点，打开搜索栏后焦点移入搜索框', async () => {
            mount();
            expect(document.activeElement).toBe(document.body);
            await openBar();
            expect(searchInput()).toHaveFocus();
        });

        it('点关闭按钮或在搜索栏内按 Esc 后焦点回到触发按钮', async () => {
            mount();
            await openBar();
            await fireEvent.click(closeButton());
            await waitFor(() => expect(trigger()).toHaveFocus());
            await openBar();
            await fireEvent.keyDown(searchInput() as HTMLElement, { key: 'Escape' });
            expect(searchInput()).toBeNull();
            await waitFor(() => expect(trigger()).toHaveFocus());
        });

        it('在搜索栏的每个输入框与按钮上按 Esc 都关闭搜索栏，按键不再冒泡', async () => {
            mount();
            const controls = [
                searchInput,
                replaceInput,
                () => optionButton(0),
                () => optionButton(1),
                () => optionButton(2),
                () => screen.getByRole('button', { name: zh_CN.JsonViewer.previousMatch }),
                () => screen.getByRole('button', { name: zh_CN.JsonViewer.nextMatch }),
                closeButton,
                () => replaceButtons()[0],
                () => replaceButtons()[1],
            ];
            const outside = vi.fn<(event: KeyboardEvent) => void>();
            document.addEventListener('keydown', outside);
            try {
                for (const control of controls) {
                    await openBar();
                    await fireEvent.keyDown(control() as HTMLElement, { key: 'Escape' });
                    expect(searchInput()).toBeNull();
                }
                expect(outside).not.toHaveBeenCalled();
            } finally {
                document.removeEventListener('keydown', outside);
            }
        });

        it('搜索栏容器本身不处理按键', async () => {
            mount();
            await openBar();
            await fireEvent.keyDown(get(`.${prefixCls}-search-bar-container`), { key: 'Escape' });
            expect(searchInput()).toBeInTheDocument();
        });

        it('使用方全局注册了 Search 组件时，搜索栏仍是带名称的原生 search 元素', async () => {
            render(JsonViewer, {
                props: { modelValue: '1' },
                global: { components: { Search: { render: () => <div>consumer search</div> } } },
            });
            await openBar();
            expect(screen.queryByText('consumer search')).toBeNull();
            expect(document.querySelector(`search.${prefixCls}-search-bar-container`)).toHaveAttribute('aria-label', zh_CN.JsonViewer.search);
        });

        it('搜索栏外的程序化关闭不移动焦点', async () => {
            render(SearchButtonSlot, { props: { show: 'always' } });
            const toggle = screen.getByRole('button', { name: 'toggle' });
            await fireEvent.click(toggle);
            expect(searchInput()).toHaveFocus();
            toggle.focus();
            await fireEvent.click(toggle);
            await nextTick();
            expect(trigger()).not.toHaveFocus();
            expect(toggle).toHaveFocus();
        });
    });

    describe('拖动搜索按钮', () => {
        it('鼠标拖动只吞掉紧随的 click，之后键盘 Enter 仍能打开搜索栏', async () => {
            const user = userEvent.setup();
            mount();
            const button = get(`.${prefixCls}-search-bar-trigger`);
            drag(button, 'mouse');
            await fireEvent.click(button);
            expect(searchInput()).toBeNull();
            await sleep(0);
            button.focus();
            await user.keyboard('{Enter}');
            expect(searchInput()).toBeInTheDocument();
        });

        it('触摸拖动后同样只吞掉紧随的 click', async () => {
            mount();
            const button = get(`.${prefixCls}-search-bar-trigger`);
            drag(button, 'touch');
            await fireEvent.click(button);
            expect(searchInput()).toBeNull();
            await sleep(0);
            await fireEvent.click(button, { detail: 0 });
            expect(searchInput()).toBeInTheDocument();
        });
    });

    describe('属性落点', () => {
        it('其他 DOM 属性透传到根节点，aria-label 让根节点成为 group，组件自身的属性不透传', async () => {
            const onClick = vi.fn<() => void>();
            const { container } = mount({ id: 'jv', 'aria-label': 'json', onClick, onChange: () => {} });
            const root = container.firstElementChild as HTMLElement;
            expect(root).toHaveAttribute('id', 'jv');
            expect(root).toHaveAttribute('aria-label', 'json');
            expect(root).toHaveAttribute('role', 'group');
            expect(root).not.toHaveAttribute('modelvalue');
            expect(root).not.toHaveAttribute('options');
            await fireEvent.click(root);
            expect(onClick).toHaveBeenCalledTimes(1);
            await openBar();
            expect(searchInput()).not.toHaveAttribute('id');
        });

        it('aria-labelledby 同样加 role="group"，使用方的 role 优先，无名称时没有 role', () => {
            const labelled = mount({ 'aria-labelledby': 'title' });
            expect(labelled.container.firstElementChild).toHaveAttribute('role', 'group');
            const region = mount({ 'aria-label': 'json', role: 'region' });
            expect(region.container.firstElementChild).toHaveAttribute('role', 'region');
            const plain = mount();
            expect(plain.container.firstElementChild).not.toHaveAttribute('role');
        });
    });

    it('全局 Input 默认值不给搜索栏输入框加清除按钮', async () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        try {
            mount();
            await fireEvent.click(get(`.${prefixCls}-search-bar-trigger`));
            await userEvent.type(get(`.${prefixCls}-search-bar input`), 'k');
            await userEvent.type(get(`.${prefixCls}-replace-bar input`), 'k');
            expect(get(`.${prefixCls}-search-bar-container`).querySelector('.semi-input-clearbtn')).toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，传入值优先', () => {
        semiGlobal.config.overrideDefaultProps = {
            JsonViewer: { width: 321, showSearch: false, options: { readOnly: true } },
        };
        try {
            const { container } = mount();
            expect(container.firstElementChild).toHaveStyle({ width: '321px', height: '400px' });
            expect(trigger()).toBeNull();
            expect(current().options).toEqual({ prefixCls, ariaLabel, readOnly: true, autoWrap: true });
            const explicit = mount({ width: 500, showSearch: true, options: { lineHeight: 30 } });
            expect(explicit.container.firstElementChild).toHaveStyle({ width: '500px' });
            expect(trigger()).toBeInTheDocument();
            expect(current().options).toEqual({
                prefixCls,
                ariaLabel,
                readOnly: false,
                autoWrap: true,
                lineHeight: 30,
            });
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('KeepAlive 切走再切回后保留编辑器与搜索栏', async () => {
        const shown = shallowRef(true);
        render(() => (
            <KeepAlive>
                {{
                    default: () => (shown.value ? <JsonViewer modelValue="1" /> : <p>other</p>),
                }}
            </KeepAlive>
        ));
        await openBar();
        shown.value = false;
        await nextTick();
        expect(searchInput()).toBeNull();
        shown.value = true;
        await nextTick();
        expect(instances).toHaveLength(1);
        expect(live()).toHaveLength(1);
        expect(searchInput()).toBeInTheDocument();
    });

    describe('使用 ResizeObserver', () => {
        let resize: ReturnType<typeof mockResizeObserver>;
        beforeEach(() => {
            resize = mockResizeObserver();
            vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
                callback(0);
                return 1;
            });
        });

        const isViewer = (element: Element) => element.classList.contains(prefixCls);
        const liveObservers = () => resize.live().filter((observer) => observer.targets.some(isViewer));

        it('开启 autoWrap 时宽度变化会重新布局编辑器', async () => {
            const view = mount();
            expect(liveObservers()).toHaveLength(1);
            const viewer = view.container.querySelector(`.${prefixCls}`) as HTMLElement;
            expect(liveObservers()[0].targets).toContain(viewer);
            const editor = current();
            editor.layout.mockClear();

            await resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 400.2, blockSize: 400 }] }]);
            expect(editor.layout).not.toHaveBeenCalled();
            await resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 120, blockSize: 400 }] }]);
            expect(editor.resetMeasuredHeights).toHaveBeenCalledTimes(1);
            expect(editor.layout).toHaveBeenCalledTimes(1);
            await resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 120.3, blockSize: 400 }] }]);
            expect(editor.layout).toHaveBeenCalledTimes(1);

            view.unmount();
            expect(liveObservers()).toHaveLength(0);
        });

        it('高度变化时重新布局，不清除已测量的行高', async () => {
            const view = mount({ height: 400 });
            const viewer = view.container.querySelector(`.${prefixCls}`) as HTMLElement;
            const editor = current();
            editor.layout.mockClear();
            await view.rerender({ height: 800 });
            await resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 400, blockSize: 800 }] }]);
            expect(editor.layout).toHaveBeenCalledTimes(1);
            expect(editor.resetMeasuredHeights).not.toHaveBeenCalled();
        });

        it('未开启 autoWrap 时只在高度变化时重新布局', async () => {
            const view = mount({ options: { autoWrap: false } });
            const viewer = view.container.querySelector(`.${prefixCls}`) as HTMLElement;
            const editor = current();
            editor.layout.mockClear();
            await resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 120, blockSize: 400 }] }]);
            expect(editor.layout).not.toHaveBeenCalled();
            await resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 120, blockSize: 100 }] }]);
            expect(editor.layout).toHaveBeenCalledTimes(1);
            expect(editor.resetMeasuredHeights).not.toHaveBeenCalled();
        });

        it('重新创建与切换 autoWrap 后只保留一个 observer', async () => {
            const view = mount();
            expect(liveObservers()).toHaveLength(1);
            await view.rerender({ modelValue: '2' });
            expect(liveObservers()).toHaveLength(1);
            await view.rerender({ modelValue: '2', options: { autoWrap: false } });
            expect(liveObservers()).toHaveLength(1);
        });
    });

    it('Props 不声明 children、dangerouslySetInnerHTML、renderTooltip 与 onChange', () => {
        expectTypeOf<JsonViewerProps>().not.toHaveProperty('children');
        expectTypeOf<JsonViewerProps>().not.toHaveProperty('dangerouslySetInnerHTML');
        expectTypeOf<JsonViewerProps>().not.toHaveProperty('renderTooltip');
        expectTypeOf<JsonViewerProps>().not.toHaveProperty('onChange');
        expectTypeOf<JsonViewerProps>().not.toHaveProperty('value');
    });
});

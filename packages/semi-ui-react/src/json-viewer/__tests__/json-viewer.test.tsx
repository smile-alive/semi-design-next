import { StrictMode, createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, expectTypeOf, it, vi, type Mock } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { JsonViewer as Core } from '@fibrae/semi-json-viewer-core';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import LocaleProvider from '@fibrae/semi-ui-react/locale/locale-provider';
import { mockResizeObserver, sleep } from '@test/utils/react';
import JsonViewer, { type JsonViewerHandle, type JsonViewerProps } from '../index';

// jsdom has no Worker, so the editor core is faked; layout, editing and real search are covered by the browser test
vi.mock('@fibrae/semi-json-viewer-core', () => {
    class JsonViewer {
        static instances = [];
        container: HTMLElement;
        value: string;
        options: Record<string, unknown>;
        listeners = {};
        emitter = {
            on: (event, listener) => {
                this.listeners[event] = [...(this.listeners[event] ?? []), listener];
            },
            emit: (event, data) => this.listeners[event]?.forEach((listener) => listener(data)),
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

        constructor(container, value, options) {
            this.container = container;
            this.value = value;
            this.options = options;
            JsonViewer.instances.push(this);
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

const prefixCls = 'semi-json-viewer';
const ariaLabel = zh_CN.JsonViewer.content;
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
const FakeCore = Core as unknown as { instances: FakeViewer[] };
const instances = () => FakeCore.instances;
const live = () => instances().filter((instance) => instance.dispose.mock.calls.length === 0);
const current = () => instances().at(-1);
const trigger = () => document.querySelector(`.${prefixCls}-search-bar-trigger`);
const searchInput = () => document.querySelector(`.${prefixCls}-search-bar input`);
const replaceInput = () => document.querySelector(`.${prefixCls}-replace-bar input`);
const replaceButtons = () => document.querySelectorAll(`.${prefixCls}-replace-bar button`);
const optionItems = () => document.querySelectorAll(`.${prefixCls}-search-options-item`);
const closeButton = () => document.querySelector(`.${prefixCls}-search-bar > button:last-child`);
const pointer = (target: EventTarget, type: string, init: PointerEventInit) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...init }));
const drag = (element: Element, pointerType: string) =>
    act(() => {
        pointer(element, 'pointerdown', { pointerId: 1, pointerType, button: 0, clientX: 0, clientY: 0 });
        pointer(document, 'pointermove', { pointerId: 1, pointerType, clientX: 30, clientY: 30 });
        pointer(document, 'pointerup', { pointerId: 1, pointerType });
    });

describe('JsonViewer', () => {
    beforeEach(() => {
        FakeCore.instances.length = 0;
    });

    it('为搜索触发按钮与搜索栏按钮提供名称', () => {
        render(<JsonViewer value="1" />);
        fireEvent.click(screen.getByRole('button', { name: zh_CN.JsonViewer.search }));
        for (const name of [zh_CN.JsonViewer.previousMatch, zh_CN.JsonViewer.nextMatch, zh_CN.JsonViewer.close]) {
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
        }
    });

    it('用 value 与默认选项在 editor 容器中创建编辑器，然后进行布局', () => {
        const { container } = render(<JsonViewer value='{"a":1}' />);
        const editor = container.querySelector(`.${prefixCls}`);
        expect(editor).toHaveClass(`${prefixCls}-background`);
        expect(instances()).toHaveLength(1);
        expect(current().container).toBe(editor);
        expect(current().value).toBe('{"a":1}');
        expect(current().options).toEqual({ prefixCls, ariaLabel, readOnly: false, autoWrap: true });
        expect(current().layout).toHaveBeenCalledTimes(1);
    });

    it('在 prefixCls 之后把 options 传给编辑器', () => {
        render(<JsonViewer value="1" options={{ lineHeight: 30, readOnly: true }} />);
        expect(current().options).toEqual({ prefixCls, ariaLabel, autoWrap: true, lineHeight: 30, readOnly: true });
    });

    it('options 未指定 autoWrap 时仍按默认自动换行，并监听尺寸', () => {
        const resize = mockResizeObserver();
        render(<JsonViewer value="1" options={{ readOnly: true }} showSearch={false} />);
        expect(current().options.autoWrap).toBe(true);
        expect(resize.observed()).toContain(current().container);
    });

    it('options 显式传入 autoWrap: false 时关闭自动换行', () => {
        render(<JsonViewer value="1" options={{ autoWrap: false }} />);
        expect(current().options.autoWrap).toBe(false);
    });

    it('options 里值为 undefined 的键回退为默认值', () => {
        render(<JsonViewer value="1" options={{ ariaLabel: undefined, autoWrap: undefined, readOnly: undefined }} />);
        expect(current().options).toEqual({ prefixCls, ariaLabel, readOnly: false, autoWrap: true });
    });

    it('value 等于编辑器当前文本时不重新创建编辑器，不同时重新创建', () => {
        const { rerender } = render(<JsonViewer value="1" />);
        // what typing into the editor and writing it back through onChange looks like
        current().value = '{"a":2}';
        rerender(<JsonViewer value='{"a":2}' />);
        expect(instances()).toHaveLength(1);
        rerender(<JsonViewer value='{"a":3}' />);
        expect(instances()).toHaveLength(2);
        expect(current().value).toBe('{"a":3}');
    });

    it('除非 options 指定，否则从语言包获取内容区域名称，并跟随语言切换', () => {
        const inLocale = (locale, options) => (
            <LocaleProvider locale={locale}>
                <JsonViewer value="1" options={options} />
            </LocaleProvider>
        );
        const { rerender } = render(inLocale(zh_CN, { ariaLabel: 'Config' }));
        expect(current().options.ariaLabel).toBe('Config');
        rerender(inLocale(zh_CN, {}));
        expect(current().options.ariaLabel).toBe(ariaLabel);
        rerender(inLocale(en_US, {}));
        expect(current().options.ariaLabel).toBe(en_US.JsonViewer.content);
        expect(instances()).toHaveLength(3);
        expect(live()).toHaveLength(1);
    });

    it('设置两个 div 的尺寸，根节点合并 className 与 style，并透传 data-*', () => {
        const { container } = render(<JsonViewer className="custom" style={{ top: 1 }} data-testid="jv" value="" height={200} width={600} />);
        const root = container.firstChild;
        expect(root).toHaveClass('custom');
        expect(root).toHaveStyle({ width: '600px', height: '200px', position: 'relative', top: '1px' });
        expect(root).toHaveAttribute('data-testid', 'jv');
        expect(container.querySelector(`.${prefixCls}`)).toHaveStyle({ width: '600px', height: '200px' });
    });

    it('默认尺寸为 400 × 400', () => {
        const { container } = render(<JsonViewer value="" />);
        expect(container.firstChild).toHaveStyle({ width: '400px', height: '400px' });
    });

    it('value 变化时重新创建编辑器', () => {
        const { rerender } = render(<JsonViewer value="1" />);
        const first = current();
        rerender(<JsonViewer value="2" />);
        expect(first.dispose).toHaveBeenCalledTimes(1);
        expect(instances()).toHaveLength(2);
        expect(current().value).toBe('2');
        expect(live()).toHaveLength(1);
    });

    it('仅在 options 深层变化时重新创建编辑器', () => {
        const { rerender } = render(<JsonViewer value="1" options={{ lineHeight: 20 }} />);
        rerender(<JsonViewer value="1" options={{ lineHeight: 20 }} />);
        expect(instances()).toHaveLength(1);
        rerender(<JsonViewer value="1" options={{ lineHeight: 30 }} />);
        expect(instances()).toHaveLength(2);
        expect(current().options.lineHeight).toBe(30);
        expect(live()).toHaveLength(1);
    });

    it('卸载时销毁编辑器', () => {
        const { unmount } = render(<JsonViewer value="1" />);
        unmount();
        expect(current().dispose).toHaveBeenCalledTimes(1);
        expect(live()).toHaveLength(0);
    });

    it('StrictMode 下只保留一个存活的编辑器', () => {
        const { rerender, unmount } = render(
            <StrictMode>
                <JsonViewer value="1" />
            </StrictMode>
        );
        expect(live()).toHaveLength(1);
        rerender(
            <StrictMode>
                <JsonViewer value="2" />
            </StrictMode>
        );
        expect(live()).toHaveLength(1);
        expect(live()[0].value).toBe('2');
        unmount();
        expect(live()).toHaveLength(0);
    });

    it('内容变化时，以 model 值调用最新的 onChange', () => {
        const first = vi.fn<NonNullable<JsonViewerProps['onChange']>>();
        const second = vi.fn<NonNullable<JsonViewerProps['onChange']>>();
        const { rerender } = render(<JsonViewer value="1" onChange={first} />);
        rerender(<JsonViewer value="1" onChange={second} />);
        act(() => current().emitter.emit('contentChanged', {}));
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledWith('1');
    });

    it('把 customRender 节点渲染到编辑器 span 中，卸载时移除', () => {
        const { unmount } = render(<JsonViewer value="1" options={{ readOnly: true }} />);
        const span = document.createElement('span');
        current().container.appendChild(span);
        const customRenderMap = new Map().set(span, <b>custom</b>);
        act(() => current().emitter.emit('customRender', { customRenderMap }));
        expect(span.querySelector('b')).toHaveTextContent('custom');
        unmount();
        expect(span).toBeEmptyDOMElement();
    });

    it('编辑器重新填充时，沿用相同的 customRender 映射', () => {
        render(<JsonViewer value="1" options={{ readOnly: true }} />);
        const map = new Map();
        const a = document.createElement('span');
        const b = document.createElement('span');
        map.set(a, <i>a</i>);
        act(() => current().emitter.emit('customRender', { customRenderMap: map }));
        map.clear();
        map.set(b, <i>b</i>);
        act(() => current().emitter.emit('customRender', { customRenderMap: map }));
        expect(a).toBeEmptyDOMElement();
        expect(b).toHaveTextContent('b');
    });

    it('打开与关闭搜索栏', () => {
        render(<JsonViewer value="1" />);
        expect(searchInput()).toBeNull();
        fireEvent.click(trigger());
        expect(searchInput()).toBeInTheDocument();
        expect(replaceInput()).toBeInTheDocument();
        expect(trigger()).toBeNull();
        const close = document.querySelector(`.${prefixCls}-search-bar > button:last-child`);
        fireEvent.click(close);
        expect(searchInput()).toBeNull();
        expect(trigger()).toBeInTheDocument();
    });

    it('showSearch 为 false 时隐藏搜索按钮', () => {
        render(<JsonViewer value="1" showSearch={false} />);
        expect(trigger()).toBeNull();
    });

    it('输入时实时搜索，使用切换后的选项', () => {
        render(<JsonViewer value="1" />);
        fireEvent.click(trigger());
        const { search } = current().searchWidget;
        fireEvent.change(searchInput(), { target: { value: 'a' } });
        expect(search).toHaveBeenLastCalledWith('a', false, false, false);

        const [caseSensitive, regex, wholeWord] = optionItems();
        fireEvent.click(caseSensitive.firstChild);
        expect(caseSensitive).toHaveClass(`${prefixCls}-search-options-item-active`);
        expect(search).toHaveBeenLastCalledWith('a', true, false, false);
        fireEvent.click(regex.firstChild);
        expect(search).toHaveBeenLastCalledWith('a', true, false, true);
        fireEvent.click(wholeWord.firstChild);
        expect(search).toHaveBeenLastCalledWith('a', true, true, true);
        fireEvent.click(caseSensitive.firstChild);
        expect(caseSensitive).not.toHaveClass(`${prefixCls}-search-options-item-active`);
        expect(search).toHaveBeenLastCalledWith('a', false, true, true);
    });

    it('等待输入法组合结束后再搜索', () => {
        render(<JsonViewer value="1" />);
        fireEvent.click(trigger());
        const { search } = current().searchWidget;
        fireEvent.compositionStart(searchInput());
        fireEvent.change(searchInput(), { target: { value: 'ni' } });
        expect(search).not.toHaveBeenCalled();
        fireEvent.compositionEnd(searchInput());
        expect(search).toHaveBeenLastCalledWith('ni', false, false, false);
    });

    it('重新打开搜索栏时重置搜索选项', () => {
        render(<JsonViewer value="1" />);
        fireEvent.click(trigger());
        fireEvent.click(optionItems()[0].firstChild);
        fireEvent.click(document.querySelector(`.${prefixCls}-search-bar > button:last-child`));
        fireEvent.click(trigger());
        expect(optionItems()[0]).not.toHaveClass(`${prefixCls}-search-options-item-active`);
    });

    it('用箭头按钮在搜索结果间切换', () => {
        render(<JsonViewer value="1" />);
        fireEvent.click(trigger());
        const [prev, next] = document.querySelectorAll(`.${prefixCls}-search-bar .semi-button-group button`);
        fireEvent.click(prev);
        expect(current().searchWidget.navigateResults).toHaveBeenLastCalledWith(-1);
        fireEvent.click(next);
        expect(current().searchWidget.navigateResults).toHaveBeenLastCalledWith(1);
    });

    it('搜索栏打开时内容变化，用输入文本重新搜索', () => {
        render(<JsonViewer value="1" />);
        act(() => current().emitter.emit('contentChanged', {}));
        expect(current().searchWidget.search).not.toHaveBeenCalled();
        fireEvent.click(trigger());
        fireEvent.change(searchInput(), { target: { value: 'k' } });
        current().searchWidget.search.mockClear();
        act(() => current().emitter.emit('contentChanged', {}));
        expect(current().searchWidget.search).toHaveBeenCalledWith('k', false, false, false);
    });

    it('自建搜索 UI、不渲染默认搜索栏时，内容变化用最近一次搜索重新搜索且不抛错', () => {
        const renderSearchButton: NonNullable<JsonViewerProps['renderSearchButton']> = (_default, controls) => (
            <button
                type="button"
                onClick={() => {
                    controls.onToggleSearchBar();
                    controls.onSearch('k', true, false, true);
                }}
            >
                custom
            </button>
        );
        render(<JsonViewer value="1" renderSearchButton={renderSearchButton} />);
        fireEvent.click(screen.getByRole('button', { name: 'custom' }));
        current().searchWidget.search.mockClear();
        expect(() => act(() => current().emitter.emit('contentChanged', {}))).not.toThrow();
        expect(current().searchWidget.search).toHaveBeenCalledWith('k', true, false, true);
    });

    it('默认搜索栏打开后 showSearch 变为 false，内容变化不抛错', () => {
        const { rerender } = render(<JsonViewer value="1" />);
        fireEvent.click(trigger());
        fireEvent.change(searchInput(), { target: { value: 'k' } });
        rerender(<JsonViewer value="1" showSearch={false} />);
        expect(searchInput()).toBeNull();
        current().searchWidget.search.mockClear();
        expect(() => act(() => current().emitter.emit('contentChanged', {}))).not.toThrow();
        expect(current().searchWidget.search).toHaveBeenCalledWith('k', false, false, false);
    });

    it('搜索选项开关是带名称与 aria-pressed 的按钮，可用键盘切换', async () => {
        const user = userEvent.setup();
        render(<JsonViewer value="1" />);
        fireEvent.click(trigger());
        const { search } = current().searchWidget;
        fireEvent.change(searchInput(), { target: { value: 'a' } });
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

    it('搜索选项开关的名称来自语言包', () => {
        render(
            <LocaleProvider locale={ja_JP}>
                <JsonViewer value="1" />
            </LocaleProvider>
        );
        fireEvent.click(screen.getByRole('button', { name: ja_JP.JsonViewer.search }));
        for (const name of [ja_JP.JsonViewer.caseSensitive, ja_JP.JsonViewer.regex, ja_JP.JsonViewer.wholeWord]) {
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
        }
    });

    it('使用替换输入框的文本进行替换', () => {
        render(<JsonViewer value="1" />);
        fireEvent.click(trigger());
        fireEvent.change(replaceInput(), { target: { value: 'x' } });
        const [replace, replaceAll] = replaceButtons();
        fireEvent.click(replace);
        expect(current().searchWidget.replace).toHaveBeenCalledWith('x');
        fireEvent.click(replaceAll);
        expect(current().searchWidget.replaceAll).toHaveBeenCalledWith('x');
    });

    it('readOnly 时禁用替换', () => {
        const ref = createRef<JsonViewerHandle>();
        render(<JsonViewer ref={ref} value="1" options={{ readOnly: true }} />);
        fireEvent.click(trigger());
        for (const button of replaceButtons()) {
            expect(button).toBeDisabled();
        }
        ref.current.replace('x');
        ref.current.replaceAll('x');
        expect(current().searchWidget.replace).not.toHaveBeenCalled();
        expect(current().searchWidget.replaceAll).not.toHaveBeenCalled();
    });

    it('在 ref 上暴露命令式方法', () => {
        const ref = createRef<JsonViewerHandle>();
        render(<JsonViewer ref={ref} value="v" height="50%" width={300} />);
        const widget = current().searchWidget;
        expect(ref.current.getValue()).toBe('v');
        ref.current.format();
        expect(current().format).toHaveBeenCalledTimes(1);
        ref.current.search('a', true);
        expect(widget.search).toHaveBeenLastCalledWith('a', true, false, false);
        ref.current.search('b');
        expect(widget.search).toHaveBeenLastCalledWith('b', false, false, false);
        expect(ref.current.getSearchResults()).toBe(widget.searchResults);
        ref.current.prevSearch();
        expect(widget.navigateResults).toHaveBeenLastCalledWith(-1);
        ref.current.prevSearch(2);
        expect(widget.navigateResults).toHaveBeenLastCalledWith(-2);
        ref.current.nextSearch();
        expect(widget.navigateResults).toHaveBeenLastCalledWith(1);
        ref.current.nextSearch(3);
        expect(widget.navigateResults).toHaveBeenLastCalledWith(3);
        ref.current.replace('r');
        expect(widget.replace).toHaveBeenCalledWith('r');
        ref.current.replaceAll('R');
        expect(widget.replaceAll).toHaveBeenCalledWith('R');
        expect(ref.current.getStyle()).toEqual({ width: 300, height: '50%' });
    });

    it('把默认按钮与搜索控件交给 renderSearchButton', () => {
        const renderSearchButton = vi.fn<NonNullable<JsonViewerProps['renderSearchButton']>>((defaultButton, controls) => (
            <div>
                <button type="button" className="toggle" aria-label="toggle" onClick={controls.onToggleSearchBar} />
                {controls.showSearchBar ? defaultButton : null}
            </div>
        ));
        render(<JsonViewer value="1" renderSearchButton={renderSearchButton} />);
        expect(renderSearchButton.mock.lastCall[1].showSearchBar).toBe(false);
        fireEvent.click(document.querySelector('.toggle'));
        expect(renderSearchButton.mock.lastCall[1].showSearchBar).toBe(true);
        expect(searchInput()).toBeInTheDocument();

        const controls = renderSearchButton.mock.lastCall[1];
        const widget = current().searchWidget;
        controls.onSearch('s', false, true);
        expect(widget.search).toHaveBeenLastCalledWith('s', false, true, false);
        controls.onPrevSearch();
        expect(widget.navigateResults).toHaveBeenLastCalledWith(-1);
        controls.onNextSearch();
        expect(widget.navigateResults).toHaveBeenLastCalledWith(1);
        controls.onReplace('x');
        expect(widget.replace).toHaveBeenCalledWith('x');
        controls.onReplaceAll('y');
        expect(widget.replaceAll).toHaveBeenCalledWith('y');
    });

    it('ref 上只暴露文档声明的句柄', () => {
        const ref = createRef<JsonViewerHandle>();
        render(<JsonViewer ref={ref} value="1" />);
        expect(Object.keys(ref.current).toSorted()).toEqual(['format', 'getSearchResults', 'getStyle', 'getValue', 'nextSearch', 'prevSearch', 'replace', 'replaceAll', 'search']);
    });

    it('其他 DOM 属性透传到根节点，aria-label 让根节点成为 group，组件自身的属性不透传', () => {
        const onClick = vi.fn<() => void>();
        const { container } = render(<JsonViewer id="jv" aria-label="json" value="1" onChange={() => {}} onClick={onClick} />);
        const root = container.firstChild;
        expect(root).toHaveAttribute('id', 'jv');
        expect(root).toHaveAttribute('aria-label', 'json');
        expect(root).toHaveAttribute('role', 'group');
        expect(root).not.toHaveAttribute('value');
        expect(root).not.toHaveAttribute('options');
        fireEvent.click(root);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('aria-labelledby 同样加 role="group"，使用方的 role 优先，无名称时没有 role', () => {
        const { container: labelled } = render(<JsonViewer aria-labelledby="title" />);
        expect(labelled.firstChild).toHaveAttribute('role', 'group');
        const { container: application } = render(<JsonViewer aria-label="json" role="application" />);
        expect(application.firstChild).toHaveAttribute('role', 'application');
        const { container: plain } = render(<JsonViewer />);
        expect(plain.firstChild).not.toHaveAttribute('role');
    });

    it('value、width、height 可省略', () => {
        expectTypeOf<Pick<JsonViewerProps, 'showSearch'>>().toExtend<JsonViewerProps>();
    });

    it('搜索栏是以语言包命名的 search 区域，搜索框与替换框用 aria-label 命名', () => {
        render(<JsonViewer value="1" />);
        fireEvent.click(trigger());
        // jsdom's role table predates the search element (implicit role search); the browser test queries the role
        expect(document.querySelector(`search.${prefixCls}-search-bar-container`)).toHaveAttribute('aria-label', zh_CN.JsonViewer.search);
        expect(searchInput()).toHaveAttribute('aria-label', zh_CN.JsonViewer.search);
        expect(replaceInput()).toHaveAttribute('aria-label', zh_CN.JsonViewer.replace);
    });

    describe('焦点', () => {
        it('初次挂载不移动焦点，打开搜索栏后焦点移入搜索框', () => {
            render(<JsonViewer value="1" />);
            expect(document.activeElement).toBe(document.body);
            fireEvent.click(trigger());
            expect(searchInput()).toHaveFocus();
        });

        it('点关闭按钮或在搜索栏内按 Esc 后焦点回到触发按钮', () => {
            render(<JsonViewer value="1" />);
            fireEvent.click(trigger());
            fireEvent.click(closeButton());
            expect(trigger()).toHaveFocus();
            fireEvent.click(trigger());
            fireEvent.keyDown(searchInput(), { key: 'Escape' });
            expect(searchInput()).toBeNull();
            expect(trigger()).toHaveFocus();
            fireEvent.click(trigger());
            fireEvent.keyDown(replaceButtons()[1], { key: 'Escape' });
            expect(searchInput()).toBeNull();
            expect(trigger()).toHaveFocus();
        });

        it('搜索栏外的程序化关闭不移动焦点', () => {
            const renderSearchButton: NonNullable<JsonViewerProps['renderSearchButton']> = (defaultButton, controls) => (
                <>
                    <button type="button" onClick={controls.onToggleSearchBar}>
                        toggle
                    </button>
                    {defaultButton}
                </>
            );
            render(<JsonViewer value="1" renderSearchButton={renderSearchButton} />);
            const toggle = screen.getByRole('button', { name: 'toggle' });
            fireEvent.click(toggle);
            expect(searchInput()).toHaveFocus();
            toggle.focus();
            fireEvent.click(toggle);
            expect(trigger()).not.toHaveFocus();
            expect(toggle).toHaveFocus();
        });
    });

    describe('拖动搜索按钮', () => {
        it('鼠标拖动只吞掉紧随的 click，之后键盘 Enter 仍能打开搜索栏', async () => {
            const user = userEvent.setup();
            render(<JsonViewer value="1" />);
            const button = trigger() as HTMLElement;
            drag(button, 'mouse');
            fireEvent.click(button);
            expect(searchInput()).toBeNull();
            await sleep(0);
            button.focus();
            await user.keyboard('{Enter}');
            expect(searchInput()).toBeInTheDocument();
        });

        it('触摸拖动后同样只吞掉紧随的 click', async () => {
            render(<JsonViewer value="1" />);
            const button = trigger();
            drag(button, 'touch');
            fireEvent.click(button);
            expect(searchInput()).toBeNull();
            await sleep(0);
            fireEvent.click(button, { detail: 0 });
            expect(searchInput()).toBeInTheDocument();
        });
    });

    it('关闭搜索栏时清除编辑器中的搜索结果', () => {
        render(<JsonViewer value="1" />);
        fireEvent.click(trigger());
        fireEvent.change(searchInput(), { target: { value: 'k' } });
        current().searchWidget.clear.mockClear();
        fireEvent.click(closeButton());
        expect(current().searchWidget.clear).toHaveBeenCalledTimes(1);
    });

    it('showSearch 为 false 时用 ref.search 搜索，内容变化后同样重新搜索', () => {
        const ref = createRef<JsonViewerHandle>();
        render(<JsonViewer ref={ref} value="1" showSearch={false} />);
        ref.current.search('k');
        current().searchWidget.search.mockClear();
        act(() => current().emitter.emit('contentChanged', {}));
        expect(current().searchWidget.search).toHaveBeenCalledWith('k', false, false, false);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = {
            JsonViewer: { width: 321, showSearch: false, options: { readOnly: true } },
        };
        try {
            const { container } = render(<JsonViewer value="1" />);
            expect(container.firstChild).toHaveStyle({ width: '321px', height: '400px' });
            expect(trigger()).toBeNull();
            expect(current().options).toEqual({ prefixCls, ariaLabel, readOnly: true, autoWrap: true });
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('全局 Input 默认值不给搜索栏输入框加清除按钮与前后缀', async () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true, prefix: 'x', suffix: 'y', insetLabel: 'l', addonBefore: 'b', addonAfter: 'a' } };
        try {
            render(<JsonViewer value="1" />);
            fireEvent.click(trigger());
            await userEvent.type(searchInput(), 'k');
            await userEvent.type(replaceInput(), 'k');
            const bar = document.querySelector(`.${prefixCls}-search-bar-container`);
            expect(bar.querySelector('.semi-input-clearbtn')).toBeNull();
            expect(bar.querySelector('.semi-input-prefix, .semi-input-suffix, .semi-input-prepend, .semi-input-append')).toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    describe('使用 ResizeObserver', () => {
        let resize: ReturnType<typeof mockResizeObserver>;
        beforeEach(() => {
            resize = mockResizeObserver();
            vi.stubGlobal('requestAnimationFrame', (callback) => {
                callback();
                return 1;
            });
        });

        // the search button's DragMove also owns a ResizeObserver; only the editor's observes the viewer element
        const isViewer = (element: Element) => element.classList.contains(prefixCls);
        const liveObservers = () => resize.live().filter((observer) => observer.targets.some(isViewer));

        it('开启 autoWrap 时宽度变化会重新布局编辑器', () => {
            const { container, unmount } = render(<JsonViewer value="1" />);
            expect(liveObservers()).toHaveLength(1);
            const viewer = container.querySelector(`.${prefixCls}`);
            expect(liveObservers()[0].targets).toContain(viewer);
            const editor = current();
            editor.layout.mockClear();

            // the setup derives the measured size from style (400 × 400); the observer reports the same border box
            resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 400.2, blockSize: 400 }] }]);
            expect(editor.layout).not.toHaveBeenCalled();
            resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 120, blockSize: 400 }] }]);
            expect(editor.resetMeasuredHeights).toHaveBeenCalledTimes(1);
            expect(editor.layout).toHaveBeenCalledTimes(1);
            resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 120.3, blockSize: 400 }] }]);
            expect(editor.layout).toHaveBeenCalledTimes(1);

            unmount();
            expect(liveObservers()).toHaveLength(0);
        });

        it('高度变化时重新布局，不清除已测量的行高', () => {
            const { container } = render(<JsonViewer value="1" />);
            const viewer = container.querySelector(`.${prefixCls}`);
            const editor = current();
            editor.layout.mockClear();
            resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 400, blockSize: 800 }] }]);
            expect(editor.layout).toHaveBeenCalledTimes(1);
            expect(editor.resetMeasuredHeights).not.toHaveBeenCalled();
        });

        it('未开启 autoWrap 时只在高度变化时重新布局', () => {
            const { container } = render(<JsonViewer value="1" options={{ autoWrap: false }} />);
            const viewer = container.querySelector(`.${prefixCls}`);
            const editor = current();
            editor.layout.mockClear();
            resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 120, blockSize: 400 }] }]);
            expect(editor.layout).not.toHaveBeenCalled();
            resize.fire(viewer, [{ borderBoxSize: [{ inlineSize: 120, blockSize: 100 }] }]);
            expect(editor.layout).toHaveBeenCalledTimes(1);
            expect(editor.resetMeasuredHeights).not.toHaveBeenCalled();
        });

        it('重新创建、切换 autoWrap 与 StrictMode 下只保留一个 observer', () => {
            const { rerender } = render(
                <StrictMode>
                    <JsonViewer value="1" />
                </StrictMode>
            );
            expect(liveObservers()).toHaveLength(1);
            rerender(
                <StrictMode>
                    <JsonViewer value="2" />
                </StrictMode>
            );
            expect(liveObservers()).toHaveLength(1);
            rerender(
                <StrictMode>
                    <JsonViewer value="2" options={{ autoWrap: false }} />
                </StrictMode>
            );
            expect(liveObservers()).toHaveLength(1);
        });
    });

    it('Props 不接受组件不渲染的 children、会与编辑器冲突的 dangerouslySetInnerHTML 与无效的 renderTooltip', () => {
        expectTypeOf<JsonViewerProps>().not.toHaveProperty('children');
        expectTypeOf<JsonViewerProps>().not.toHaveProperty('dangerouslySetInnerHTML');
        expectTypeOf<JsonViewerProps>().not.toHaveProperty('renderTooltip');
    });
});

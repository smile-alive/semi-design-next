import { createRawSnippet, flushSync, tick } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { Editor } from '@tiptap/core';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '@fibrae/semi-ui-svelte/_base/__tests__/store.svelte';
import semiGlobal from '@fibrae/semi-ui-svelte/_utils/semi-global';
import { Annotation, MCPConfigure, Sidebar } from '../index';
import type { SideBarProps } from '../interface';
import BindHost, { type BindHostStore } from './bind-host.svelte';
import LocaleHost from './locale-host.svelte';

// jsdom has no Worker, so the editor core is faked; the real one is covered by the JsonViewer tests
const instances = vi.hoisted((): { container: HTMLElement; value: string; options: Record<string, unknown>; emit: (event: string, data: unknown) => void }[] => []);
vi.mock('@fibrae/semi-json-viewer-core', () => {
    class JsonViewer {
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
        layout = vi.fn<() => void>();
        format = vi.fn<() => void>();
        resetMeasuredHeights = vi.fn<() => void>();
        dispose = vi.fn<() => void>();

        constructor(container: HTMLElement, value: string, options: Record<string, unknown>) {
            this.container = container;
            this.value = value;
            this.options = options;
            instances.push(Object.assign(this, { emit: this.emitter.emit }));
        }

        getModel() {
            return { getValue: () => this.value };
        }

        getSearchWidget() {
            return { search: vi.fn<() => void>(), navigateResults: vi.fn<() => void>(), replace: vi.fn<() => void>(), replaceAll: vi.fn<() => void>(), clear: vi.fn<() => void>(), searchResults: [] };
        }
    }
    return { JsonViewer };
});

const prefix = 'semi-sidebar';
const text = zh_CN.Sidebar;
const options = [
    { name: '选项一', key: 'one' },
    { name: '选项二', key: 'two' },
];
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const root = () => $(`.${prefix}-container`);
const snippet = (html: string) => createRawSnippet(() => ({ render: () => html }));
const mockClipboard = (writeText: (value: string) => Promise<void>) => Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

function setup(props: SideBarProps = {}) {
    return render(Sidebar, { props: { visible: true, motion: false, ...props } });
}

function bound(initial: Partial<BindHostStore> = {}) {
    const store = createStore<BindHostStore>({ kind: 'sidebar', visible: true, sidebarOptions: options, log: [], ...initial });
    render(BindHost, { props: { store } });
    return store;
}

beforeEach(() => {
    instances.length = 0;
});

afterEach(() => {
    vi.restoreAllMocks();
    semiGlobal.config.overrideDefaultProps = {};
    document.body.innerHTML = '';
});

describe('Svelte Sidebar 主模式', () => {
    it('渲染标题与选项，按选中态设置 aria-pressed', () => {
        setup({ title: '侧栏', options, activeKey: 'two' });
        expect(root()).toHaveClass(`${prefix}-main`);
        expect($(`.${prefix}-container-header-title`)).toHaveTextContent('侧栏');
        expect(screen.getByRole('button', { name: '选项一' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: '选项二' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('点击选项更新 bind:activeKey 并触发 onActiveOptionChange', async () => {
        const store = bound();
        await fireEvent.click(screen.getByRole('button', { name: '选项二' }));
        expect(store.activeKey).toBe('two');
        expect(store.log).toEqual(['active two']);
        expect(screen.getByRole('button', { name: '选项二' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('未绑定 activeKey 时点击也会切换选中态', async () => {
        setup({ options });
        await fireEvent.click(screen.getByRole('button', { name: '选项一' }));
        expect(screen.getByRole('button', { name: '选项一' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('optionIcon 渲染在选项按钮里', () => {
        setup({ options, optionIcon: createRawSnippet<[{ item: { key: string } }]>((args) => ({ render: () => `<i class="icon-${args().item.key}"></i>` })) });
        expect(screen.getByRole('button', { name: '选项一' }).querySelector('.icon-one')).not.toBeNull();
    });

    it('optionItem 取代默认按钮，onClick 选中该项', async () => {
        const onActiveOptionChange = vi.fn<NonNullable<SideBarProps['onActiveOptionChange']>>();
        setup({
            options,
            onActiveOptionChange,
            optionItem: createRawSnippet<[{ item: { key: string }; active: boolean; onClick: (event: MouseEvent) => void }]>((args) => ({
                render: () => `<i class="mine">${args().item.key}</i>`,
                setup: (node) => {
                    const handler = (event: Event) => args().onClick(event as MouseEvent);
                    node.addEventListener('click', handler);
                    return () => node.removeEventListener('click', handler);
                },
            })),
        });
        expect(screen.queryByRole('button', { name: '选项一' })).toBeNull();
        const mine = document.querySelectorAll<HTMLElement>('.mine');
        expect(mine).toHaveLength(2);
        await fireEvent.click(mine[1]);
        expect(onActiveOptionChange).toHaveBeenCalledWith(expect.any(MouseEvent), 'two');
    });

    it('mainContent 收到当前 activeKey', () => {
        setup({ options, activeKey: 'one', mainContent: createRawSnippet<[{ activeKey: string | undefined }]>((args) => ({ render: () => `<p class="main">${args().activeKey}</p>` })) });
        expect($('.main')).toHaveTextContent('one');
    });

    it('未声明属性与 class 落在容器元素上', () => {
        setup({ class: 'custom', 'data-x': '1' } as SideBarProps);
        expect(root()).toHaveClass('custom', `${prefix}-main`);
        expect(root()).toHaveAttribute('data-x', '1');
    });

    it('getRoot 在隐藏时为 null，可见时为容器元素', async () => {
        const view = setup({ visible: false });
        expect(view.component.getRoot()).toBeNull();
        await view.rerender({ visible: true });
        expect(view.component.getRoot()).toBe(root());
    });

    it('全局默认值生效，显式传入的优先', () => {
        semiGlobal.config.overrideDefaultProps = { Sidebar: { title: '全局标题', showClose: false } };
        setup();
        expect($(`.${prefix}-container-header-title`)).toHaveTextContent('全局标题');
        expect(screen.queryByRole('button', { name: text.close })).toBeNull();
    });

    it('关闭按钮的可访问名称随语言包变化', () => {
        render(LocaleHost, { props: { locale: ja_JP, kind: 'sidebar' } });
        expect(screen.getByRole('button', { name: ja_JP.Sidebar.close })).toBeInTheDocument();
    });
});

describe('Svelte Sidebar 详情模式', () => {
    it('code 模式渲染代码内容，头部有名称、返回与复制按钮', async () => {
        setup({ mode: 'code', detailContent: { name: 'demo.ts', content: 'const a = 1;', language: 'typescript' } });
        expect(root()).toHaveClass(`${prefix}-detail`);
        expect($(`.${prefix}-detail-header-title`)).toHaveTextContent('demo.ts');
        expect($(`.${prefix}-code-content`)).not.toBeNull();
        await waitFor(() => expect($(`.${prefix}-code-content`)).toHaveTextContent('const a = 1;'));
        expect(screen.getByRole('button', { name: text.close })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: text.copy })).toBeInTheDocument();
    });

    it('返回按钮触发 onBackWard(event, "main")', async () => {
        const onBackWard = vi.fn<NonNullable<SideBarProps['onBackWard']>>();
        setup({ mode: 'code', detailContent: { content: 'x' }, onBackWard });
        await fireEvent.click(screen.getByRole('button', { name: text.close }));
        expect(onBackWard).toHaveBeenCalledWith(expect.any(MouseEvent), 'main');
    });

    it('复制成功时提示并回调 success=true，失败时只回调 success=false', async () => {
        const onDetailContentCopy = vi.fn<NonNullable<SideBarProps['onDetailContentCopy']>>();
        const writeText = vi.fn<(value: string) => Promise<void>>().mockResolvedValue();
        mockClipboard(writeText);
        setup({ mode: 'code', detailContent: { content: 'abc' }, onDetailContentCopy });
        await fireEvent.click(screen.getByRole('button', { name: text.copy }));
        await waitFor(() => expect(onDetailContentCopy).toHaveBeenCalledWith(expect.any(MouseEvent), 'abc', true));
        expect(writeText).toHaveBeenCalledWith('abc');
        expect(await screen.findByText(text.copySuccess)).toBeInTheDocument();
        expect(root()).toContainElement(screen.getByText(text.copySuccess));

        document.body.innerHTML = '';
        onDetailContentCopy.mockClear();
        mockClipboard(() => Promise.reject(new Error('denied')));
        setup({ mode: 'code', detailContent: { content: 'abc' }, onDetailContentCopy });
        await fireEvent.click(screen.getByRole('button', { name: text.copy }));
        await waitFor(() => expect(onDetailContentCopy).toHaveBeenCalledWith(expect.any(MouseEvent), 'abc', false));
        expect(screen.queryByText(text.copySuccess)).toBeNull();
    });

    it('isJson 时用 JsonViewer 展示内容，选项为只读', async () => {
        setup({ mode: 'code', detailContent: { content: '{"a":1}', isJson: true } });
        await waitFor(() => expect(instances).toHaveLength(1));
        expect(instances[0].value).toBe('{"a":1}');
        expect(instances[0].options).toMatchObject({ readOnly: true });
    });

    it('customRender 转给 JsonViewer，渲染到编辑器的 token 位置', async () => {
        setup({
            mode: 'code',
            detailContent: { content: '{"a":1}', isJson: true, jsonViewerProps: { options: { readOnly: true, customRenderRule: [{ match: '"a"' }] } } },
            customRender: createRawSnippet<[{ content: string }]>((args) => ({ render: () => `<b class="token">${args().content}</b>` })),
        });
        await waitFor(() => expect(instances).toHaveLength(1));
        const span = instances[0].container.appendChild(document.createElement('span'));
        const rule = (instances[0].options.customRenderRule as { render: (content: string) => unknown }[])[0];
        instances[0].emit('customRender', { customRenderMap: new Map([[span, rule.render('"a"')]]) });
        await tick();
        expect(span.querySelector('.token')).toHaveTextContent('"a"');
    });

    it('searchButton 转给 JsonViewer，showSearch 打开时渲染', async () => {
        setup({
            mode: 'code',
            detailContent: { content: '{}', isJson: true, jsonViewerProps: { showSearch: true } },
            searchButton: snippet('<button type="button" class="my-search">搜</button>'),
        });
        await waitFor(() => expect($('.my-search')).not.toBeNull());
    });

    it('file 模式渲染富文本编辑器与工具栏，fileEditable 为 false 时只读且无工具栏', async () => {
        setup({ mode: 'file', detailContent: { name: 'doc', content: '<p>正文</p>' } });
        await waitFor(() => expect($('.ProseMirror')).toHaveTextContent('正文'));
        expect($('.ProseMirror')).toHaveAttribute('contenteditable', 'true');
        expect(screen.getByRole('button', { name: text.bold })).toBeInTheDocument();

        document.body.innerHTML = '';
        setup({ mode: 'file', fileEditable: false, detailContent: { name: 'doc', content: '<p>正文</p>' } });
        await waitFor(() => expect($('.ProseMirror')).toHaveTextContent('正文'));
        expect($('.ProseMirror')).toHaveAttribute('contenteditable', 'false');
        expect(screen.queryByRole('button', { name: text.bold })).toBeNull();
    });

    it('detailHeader 取代默认头部并收到 mode 与 detailContent', () => {
        setup({ mode: 'code', detailContent: { name: 'n', content: 'x' }, detailHeader: createRawSnippet<[{ mode: string; detailContent?: { name?: string } }]>((args) => ({ render: () => `<h3 class="dh">${args().mode}:${args().detailContent?.name}</h3>` })) });
        expect($('.dh')).toHaveTextContent('code:n');
        expect($(`.${prefix}-detail-header`)).toBeNull();
    });

    it('detailBody 取代默认详情内容', () => {
        setup({ mode: 'code', detailContent: { content: 'x' }, detailBody: snippet('<p class="db">自定义</p>') });
        expect($('.db')).toBeInTheDocument();
        expect($(`.${prefix}-code-content`)).toBeNull();
    });

    it('detailContent 换 key 后重建内容', async () => {
        const view = setup({ mode: 'file', detailContent: { key: 'a', content: '<p>甲</p>' } });
        await waitFor(() => expect($('.ProseMirror')).toHaveTextContent('甲'));
        const first = $('.ProseMirror');
        await view.rerender({ detailContent: { key: 'b', content: '<p>乙</p>' } });
        await waitFor(() => expect($('.ProseMirror')).toHaveTextContent('乙'));
        expect($('.ProseMirror')).not.toBe(first);
    });
});

describe('Svelte Sidebar 焦点与提示', () => {
    it('切到详情模式后焦点落到返回按钮，回到主模式后落到选中项', async () => {
        const view = setup({ options, activeKey: 'two', detailContent: { content: 'x' } });
        const pressed = screen.getByRole('button', { name: '选项二' });
        pressed.focus();
        await view.rerender({ mode: 'code' });
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: text.close })));
        await view.rerender({ mode: 'main' });
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: '选项二' })));
    });

    it('焦点已在别处时不抢焦点', async () => {
        const outside = document.body.appendChild(document.createElement('input'));
        const view = setup({ options, detailContent: { content: 'x' } });
        outside.focus();
        await view.rerender({ mode: 'code' });
        await tick();
        expect(document.activeElement).toBe(outside);
    });

    it('隐藏后提示被清除，再次显示后仍能在新容器里提示', async () => {
        mockClipboard(() => Promise.resolve());
        const view = setup({ mode: 'code', detailContent: { content: 'abc' } });
        await fireEvent.click(screen.getByRole('button', { name: text.copy }));
        expect(await screen.findByText(text.copySuccess)).toBeInTheDocument();
        await view.rerender({ visible: false });
        await waitFor(() => expect(screen.queryByText(text.copySuccess)).toBeNull());
        await view.rerender({ visible: true });
        await fireEvent.click(screen.getByRole('button', { name: text.copy }));
        expect(await screen.findByText(text.copySuccess)).toBeInTheDocument();
        flushSync();
    });
});

const codeDetail = { key: 'c1', name: 'main.js', language: 'javascript', content: 'const a = 1;' };
const jsonSlotProps = { options: { readOnly: true, customRenderRule: [{ match: 'x' }] }, showSearch: true };
const jsonSlots = {
    customRender: createRawSnippet<[{ content: string }]>((args) => ({ render: () => `<b class="my-token">${args().content}</b>` })),
    searchButton: snippet('<i class="my-search"></i>'),
};

async function expectJsonSlotsForwarded(mount: () => void) {
    instances.length = 0;
    mount();
    await waitFor(() => expect(instances).toHaveLength(1));
    const core = instances[0];
    const span = core.container.appendChild(document.createElement('span'));
    const rule = (core.options.customRenderRule as { render: (content: string) => unknown }[])[0];
    core.emit('customRender', { customRenderMap: new Map([[span, rule.render('"x"')]]) });
    await tick();
    expect(span.querySelector('.my-token')).toHaveTextContent('"x"');
    expect($('.my-search')).toBeInTheDocument();
    expect($('.semi-json-viewer-search-bar-trigger')).toBeNull();
}

describe('Svelte Sidebar 主模式与详情的补充行为', () => {
    it('选项按钮带基础类名，未选中的另带 normal 类名', () => {
        setup({ options, activeKey: 'two' });
        const buttons = [...document.querySelectorAll(`.${prefix}-options-button`)];
        expect(buttons.map((button) => button.textContent?.trim())).toEqual(['选项一', '选项二']);
        expect(buttons[0]).toHaveClass(`${prefix}-options-normal`);
        expect(buttons[1]).not.toHaveClass(`${prefix}-options-normal`);
    });

    it('bind:activeKey 的初始值决定选中项', () => {
        bound({ activeKey: 'two' });
        expect(screen.getByRole('button', { name: '选项二' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: '选项一' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('activeKey 变化时 aria-pressed 跟随', async () => {
        const view = setup({ options, activeKey: 'two' });
        await view.rerender({ activeKey: 'one' });
        expect(screen.getByRole('button', { name: '选项一' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: '选项二' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('code 模式用详情头部代替标题', () => {
        setup({ title: '侧栏标题', detailContent: codeDetail, mode: 'code' });
        expect($(`.${prefix}-container-header`)).toBeNull();
        expect(screen.queryByText('侧栏标题')).toBeNull();
        expect($(`.${prefix}-code-content`)).toHaveTextContent('const a = 1;');
    });

    it('code 模式下 isJson 显示全高只读的 JsonViewer', async () => {
        setup({ detailContent: { name: 'a.json', isJson: true, content: '{"a":1}' }, mode: 'code' });
        await waitFor(() => expect(instances).toHaveLength(1));
        expect(instances[0].value).toBe('{"a":1}');
        expect(instances[0].options).toEqual(expect.objectContaining({ readOnly: true, autoWrap: true }));
        expect($('.semi-json-viewer')).toHaveStyle({ height: '100%' });
    });

    it('详情的 jsonViewerProps 传给 JsonViewer，默认仍为全高', () => {
        setup({ detailContent: { name: 'a.json', isJson: true, content: '{"a":1}', jsonViewerProps: { class: 'my-json' } }, mode: 'code' });
        expect($('.my-json')).toBeInTheDocument();
        expect($('.semi-json-viewer')).toHaveStyle({ height: '100%' });
    });

    it('customRender 与 searchButton 转发给 code 详情的 JsonViewer', async () => {
        await expectJsonSlotsForwarded(() => setup({ detailContent: { name: 'a.json', isJson: true, content: '{"a":"x"}', jsonViewerProps: jsonSlotProps }, mode: 'code', ...jsonSlots }));
    });

    it('详情内容不是字符串时不显示复制按钮', async () => {
        const view = setup({ detailContent: { name: 'a.js' }, mode: 'code' });
        expect(screen.queryByRole('button', { name: text.copy })).toBeNull();
        await view.rerender({ detailContent: codeDetail });
        expect(screen.getByRole('button', { name: text.copy })).toBeInTheDocument();
    });

    it('fileEditable 在挂载后切换时，菜单栏与编辑器跟随', async () => {
        const view = setup({ detailContent: { name: 'a.md', content: '<p>file text</p>' }, mode: 'file' });
        expect(await screen.findByText('file text')).toBeInTheDocument();
        expect($(`.${prefix}-file-menu-bar`)).toBeInTheDocument();
        await view.rerender({ fileEditable: false });
        expect($(`.${prefix}-file-menu-bar`)).toBeNull();
        await waitFor(() => expect($('.ProseMirror')).toHaveAttribute('contenteditable', 'false'));
        await view.rerender({ fileEditable: true });
        await waitFor(() => expect($('.ProseMirror')).toHaveAttribute('contenteditable', 'true'));
    });

    it('file 模式通过 onFileContentChange 报告编辑', async () => {
        const onFileContentChange = vi.fn<NonNullable<SideBarProps['onFileContentChange']>>();
        setup({ detailContent: { name: 'a.md', content: '<p>text</p>' }, mode: 'file', onFileContentChange });
        await screen.findByText('text');
        ($('.ProseMirror') as HTMLElement & { editor: Editor }).editor.commands.selectAll();
        await fireEvent.click(screen.getByRole('button', { name: text.bold }));
        expect(onFileContentChange).toHaveBeenLastCalledWith('<p><strong>text</strong></p>');
    });

    it('没有 detailContent 的 file 模式渲染空头部和空编辑器', async () => {
        setup({ mode: 'file' });
        expect($(`.${prefix}-detail-header-title`)?.textContent).toBe('');
        await waitFor(() => expect($('.ProseMirror')).toHaveTextContent(''));
    });

    it('没有内置内容的模式渲染空详情', () => {
        setup({ detailContent: { name: 'x' }, mode: 'custom' });
        const content = $(`.${prefix}-container-content`);
        expect(content?.children).toHaveLength(0);
        expect(content?.textContent).toBe('');
    });

    it('detailHeader 与 detailBody 收到当前 mode 与 detailContent', () => {
        setup({
            detailContent: codeDetail,
            mode: 'code',
            detailHeader: createRawSnippet<[{ mode: string; detailContent?: { name?: string } }]>((args) => ({ render: () => `<i class="dh">${args().mode}|${args().detailContent?.name}</i>` })),
            detailBody: createRawSnippet<[{ mode: string }]>((args) => ({ render: () => `<i class="db">${args().mode}</i>` })),
        });
        expect($('.dh')).toHaveTextContent('code|main.js');
        expect($('.db')).toHaveTextContent('code');
    });

    it('容器属性透传：onCancel、resizable 与 showClose', async () => {
        const onCancel = vi.fn<NonNullable<SideBarProps['onCancel']>>();
        const view = setup({ title: 'T', onCancel });
        await fireEvent.click(screen.getByRole('button', { name: text.close }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        await view.rerender({ visible: true, resizable: false, showClose: false });
        expect($('.semi-resizable-resizable')).toBeNull();
        expect(screen.queryByRole('button', { name: text.close })).toBeNull();
    });

    it('带 key 的数据项与替换 snippet 渲染时没有 Svelte 警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const codes = [{ key: 'a', name: 'a.js', language: 'javascript', content: 'let a;' }];
        render(Sidebar.CodeContent, { props: { activeKey: ['a'], codes } });
        setup({ detailContent: codes[0], mode: 'code' });
        setup({ detailContent: { key: 'f', name: 'a.md', content: '<p>x</p>' }, mode: 'file' });
        setup({ options, optionItem: createRawSnippet<[{ item: { name: string } }]>((args) => ({ render: () => `<span>${args().item.name}</span>` })) });
        render(Annotation, {
            props: { activeKey: ['1'], info: [{ header: 'h', key: '1', annotations: [{ title: 'a' }, { title: 'b' }] }], visible: true, item: createRawSnippet<[{ item: { title?: string } }]>((args) => ({ render: () => `<span>${args().item.title}</span>` })) },
        });
        await screen.findByText('x');
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
    });

    it('语言包切换后详情按钮名称跟随', () => {
        render(LocaleHost, { props: { locale: ja_JP, kind: 'sidebar-code' } });
        expect(ja_JP.Sidebar.copy).not.toBe(text.copy);
        expect(screen.getByRole('button', { name: ja_JP.Sidebar.copy })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja_JP.Sidebar.close })).toBeInTheDocument();
    });

    it('类型：detailContent 不是 any，也没有被忽略的 onChange', () => {
        expectTypeOf<NonNullable<SideBarProps['detailContent']>>().not.toBeAny();
        expectTypeOf<SideBarProps>().not.toHaveProperty('onChange');
    });
});

describe('Svelte Sidebar.CodeContent 与 CodeItem', () => {
    const codes = [
        { key: 'a', name: 'a.js', language: 'javascript', content: 'let a;' },
        { key: 'b', name: 'b.js', language: 'javascript', content: 'let b;' },
    ];
    const toggleIcons = () => document.querySelectorAll('.semi-collapse-header-icon');

    it('每个代码渲染一个面板，激活的面板展开，并报告展开点击', async () => {
        const onExpand = vi.fn<(event: MouseEvent, item: unknown, mode: string) => void>();
        render(Sidebar.CodeContent, { props: { activeKey: ['b'], codes, onExpand, class: 'custom', style: 'color: red' } });
        const collapse = $('.semi-sidebar-collapse');
        expect(collapse).toHaveClass('semi-sidebar-collapse-code', 'custom');
        expect(collapse).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect([...document.querySelectorAll('.semi-sidebar-collapse-header-text')].map((node) => node.textContent)).toEqual(['a.js', 'b.js']);
        expect(document.querySelectorAll('.semi-icon-code_stroked')).toHaveLength(2);
        await waitFor(() => expect(screen.getByText('let b;')).toBeInTheDocument());
        expect(screen.queryByText('let a;')).toBeNull();
        await fireEvent.click(document.querySelectorAll('.semi-sidebar-collapse-header-expand-btn')[0]);
        expect(onExpand).toHaveBeenCalledWith(expect.any(MouseEvent), codes[0], 'code');
    });

    it('展开按钮不切换面板；onChange 与 bind:activeKey 报告箭头触发的切换', async () => {
        const store = createStore<BindHostStore>({ kind: 'codes', visible: true, codes, codeKey: [], log: [] });
        render(BindHost, { props: { store } });
        await fireEvent.click(screen.getAllByRole('button', { name: text.expand })[0]);
        expect(store.log).toEqual(['expand']);
        expect(store.codeKey).toEqual([]);
        await fireEvent.click(toggleIcons()[0]);
        expect(store.log).toEqual(['expand', 'change a']);
        expect(store.codeKey).toEqual(['a']);
    });

    it('面板切换按钮以文件名命名，展开按钮位于其外部', () => {
        render(Sidebar.CodeContent, { props: { activeKey: [], codes, onExpand: () => {} } });
        const toggle = screen.getByRole('button', { name: 'a.js' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(toggle).not.toContainElement(screen.getAllByRole('button', { name: text.expand })[0]);
    });

    it('CodeItem 透传 codeHighlightProps 和 jsonViewerProps', async () => {
        const view = render(Sidebar.CodeItem, { props: { codeHighlightProps: { class: 'my-code' }, content: 'let a;', language: 'javascript' } });
        await waitFor(() => expect($('.my-code')).toHaveTextContent('let a;'));
        await view.rerender({ content: '{}', isJson: true, jsonViewerProps: { class: 'my-json' } });
        expect($('.my-json')).toBeInTheDocument();
    });

    it('CodeItem 把 customRender 和 searchButton 转发给 JsonViewer', async () => {
        await expectJsonSlotsForwarded(() => render(Sidebar.CodeItem, { props: { content: '{"a":"x"}', isJson: true, jsonViewerProps: jsonSlotProps, ...jsonSlots } }));
    });

    it('CodeContent 把 customRender 和 searchButton 转发给 JSON 面板', async () => {
        await expectJsonSlotsForwarded(() => render(Sidebar.CodeContent, { props: { activeKey: ['j'], codes: [{ key: 'j', name: 'a.json', isJson: true, content: '{"a":"x"}', jsonViewerProps: jsonSlotProps }], ...jsonSlots } }));
    });
});

describe('Svelte Sidebar 全局默认值与透传', () => {
    it('mode 默认为 main', () => {
        setup({ options });
        expect(root()).toHaveClass(`${prefix}-main`);
    });

    it('从 overrideDefaultProps 读取 Sidebar、Annotation 和 MCPConfigure 的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Sidebar: { mode: 'code', resizable: false }, Annotation: { title: 'Global sources' }, MCPConfigure: { placeholder: 'Global search' } };
        setup({ detailContent: codeDetail });
        expect(root()).toHaveClass(`${prefix}-detail`);
        expect($('.semi-resizable-resizable')).toBeNull();
        render(Annotation, { props: { info: [], visible: true } });
        expect(screen.getByText('Global sources')).toBeInTheDocument();
        render(MCPConfigure, { props: { options: [], visible: true } });
        expect(screen.getByPlaceholderText('Global search')).toBeInTheDocument();
    });

    it('未配置的全局默认值不覆盖 Container 自身的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Sidebar: { title: 'Global' } };
        render(Sidebar, { props: { visible: true } });
        expect($('.semi-resizable-resizable')).toHaveStyle({ minWidth: '150px' });
        expect(root()).toHaveClass(`${prefix}-animation-content_show`);
        expect(screen.getByRole('button', { name: text.close })).toBeInTheDocument();
    });

    it.each([
        ['Sidebar', Sidebar, {}],
        ['Annotation', Annotation, { info: [] }],
        ['MCPConfigure', MCPConfigure, { options: [] }],
        ['Container', Sidebar.Container, {}],
    ] as const)('%s 的未声明属性落在容器 div 上', (_name, component, props) => {
        render(component as typeof Sidebar, { props: { ...props, visible: true, 'data-testid': 'root' } as SideBarProps });
        expect(root()).toHaveAttribute('data-testid', 'root');
    });

    it.each([
        ['Sidebar', Sidebar, {}],
        ['Annotation', Annotation, { info: [] }],
        ['MCPConfigure', MCPConfigure, { options: [] }],
        ['Container', Sidebar.Container, {}],
    ] as const)('%s 经 getRoot 暴露容器 div，隐藏后为 null', async (_name, component, props) => {
        const view = render(component as typeof Sidebar, { props: { ...props, motion: false, visible: true } as SideBarProps });
        expect(view.component.getRoot()).toBe(root());
        await view.rerender({ visible: false });
        await waitFor(() => expect(view.component.getRoot()).toBeNull());
    });

    it.each([
        ['Annotation', Annotation, { info: [], onClick: () => {}, onChange: () => {} }],
        ['MCPConfigure', MCPConfigure, { filter: () => true, options: [], onSearch: () => {} }],
        ['Container', Sidebar.Container, { afterVisibleChange: () => {}, closeOnEsc: true }],
    ] as const)('%s 只由组件使用的属性不进入 DOM', (_name, component, props) => {
        render(component as typeof Sidebar, { props: { ...props, visible: true } as SideBarProps });
        expect((root() as HTMLElement).getAttributeNames().filter((name) => name !== 'class' && name !== 'style')).toEqual([]);
    });
});

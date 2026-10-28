/** @jsxImportSource vue */
import { defineComponent, h, nextTick, ref, type Component } from 'vue';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import type { Editor } from '@tiptap/core';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconCode } from '@fibrae/semi-icons-vue';
import semiGlobal from '@fibrae/semi-ui-vue/_utils/semi-global';
import { LocaleProvider } from '@fibrae/semi-ui-vue/locale/index';
import { endTransitions, render } from '@test/utils/vue';
import Sidebar from '..';
import Annotation from '../annotation';
import type { SideBarEmits, SideBarProps } from '../interface';
import MCPConfigure from '../mcp-configure';
import ContainerModel from './fixtures/container-model.vue';
import KeepAliveHost from './fixtures/keep-alive-host.vue';
import SidebarModel from './fixtures/sidebar-model.vue';

const { Container, CodeContent, CodeItem } = Sidebar;
type Emit<K extends keyof SideBarEmits> = (...args: SideBarEmits[K]) => void;

// the test tsconfig does not resolve the core package
interface FakeViewer {
    container: HTMLElement;
    value: unknown;
    options: { customRenderRule?: { render: (content: string) => unknown }[] };
    emitter: { emit: (event: string, data: unknown) => void };
}
const instances = vi.hoisted((): FakeViewer[] => []);

// jsdom has no Worker for the JSON editor core; the fake records what JsonViewer handed it
vi.mock('@fibrae/semi-json-viewer-core', () => {
    class JsonViewer {
        container: HTMLElement;
        value: unknown;
        options: FakeViewer['options'];
        listeners: Record<string, ((data: unknown) => void)[]> = {};
        emitter = {
            on: (event: string, listener: (data: unknown) => void) => {
                this.listeners[event] = [...(this.listeners[event] ?? []), listener];
            },
            emit: (event: string, data: unknown) => this.listeners[event]?.forEach((listener) => listener(data)),
        };

        constructor(container: HTMLElement, value: unknown, options: FakeViewer['options']) {
            this.container = container;
            this.value = value;
            this.options = options;
            instances.push(this);
        }

        layout = () => {};
        dispose = () => {};

        getModel() {
            return { getValue: () => this.value };
        }

        getSearchWidget() {
            return { search: () => {}, searchResults: [] };
        }
    }
    return { JsonViewer };
});

const sidebarContainer = (container: Element) => container.querySelector<HTMLElement>('.semi-sidebar-container');
const options = [
    { name: 'Code', key: 'code' },
    { name: 'File', key: 'file' },
];
const codeDetail = { key: 'c1', name: 'main.js', language: 'javascript', content: 'const a = 1;' };
const text = zh_CN.Sidebar;

function mockClipboard(writeText: (text: string) => Promise<void>) {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

const jsonSlotProps = { options: { readOnly: true, customRenderRule: [{ match: 'x' }] }, showSearch: true };
const jsonSlots = {
    customRender: ({ content }: { content: string }) => <b class="my-token">{content}</b>,
    searchButton: () => <i class="my-search" />,
};
async function expectJsonSlotsForwarded(mount: () => void) {
    instances.length = 0;
    mount();
    await waitFor(() => expect(instances).toHaveLength(1));
    const core = instances.at(-1) as FakeViewer;
    const span = core.container.appendChild(document.createElement('span'));
    const rule = core.options.customRenderRule?.[0];
    core.emitter.emit('customRender', { customRenderMap: new Map([[span, rule?.render('"x"')]]) });
    await nextTick();
    expect(span.querySelector('.my-token')).toHaveTextContent('"x"');
    expect(document.querySelector('.my-search')).toBeInTheDocument();
    expect(document.querySelector('.semi-json-viewer-search-bar-trigger')).toBeNull();
}

describe('Sidebar.Container', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('隐藏时不渲染任何内容', () => {
        const { container } = render(Container, { props: { title: 'Title' }, slots: { default: 'content' } });
        expect(container).toBeEmptyDOMElement();
    });

    it('渲染标题、关闭按钮、内容、class 和 style', () => {
        const { container } = render(Container, {
            props: { title: 'Title', visible: true },
            attrs: { class: 'custom', style: { color: 'red' } },
            slots: { default: 'content' },
        });
        const root = sidebarContainer(container);
        expect(root).toHaveClass('custom');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root?.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent('Title');
        expect(root?.querySelector('.semi-sidebar-container-content')).toHaveTextContent('content');
        expect(screen.getByRole('button', { name: text.close })).toHaveClass('semi-sidebar-container-header-closeBtn');
    });

    it('#title 插槽优先于 title', () => {
        const { container } = render(Container, {
            props: { title: 'Title', visible: true },
            slots: { title: () => <em>Slot title</em> },
        });
        expect(container.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent('Slot title');
        expect(screen.queryByText('Title')).toBeNull();
    });

    it('关闭按钮先发出 update:visible，再发出 cancel；showClose 为 false 时移除关闭按钮', async () => {
        const order: string[] = [];
        const onCancel = vi.fn<(event: MouseEvent | KeyboardEvent) => void>(() => order.push('cancel'));
        const view = render(Container, {
            props: { title: 'Title', visible: true, onCancel, 'onUpdate:visible': () => order.push('update:visible') },
        });
        await fireEvent.click(screen.getByRole('button', { name: text.close }));
        expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
        expect(order).toEqual(['update:visible', 'cancel']);

        await view.rerender({ showClose: false });
        expect(screen.queryByRole('button', { name: text.close })).toBeNull();
    });

    it('v-model:visible 由关闭按钮关闭', async () => {
        const { container } = render(ContainerModel);
        expect(sidebarContainer(container)).toBeInTheDocument();
        await fireEvent.click(screen.getByRole('button', { name: text.close }));
        expect(container.querySelector('[data-visible]')).toHaveAttribute('data-visible', 'false');
        expect(sidebarContainer(container)).toBeNull();
    });

    it('#header 替换头部，内容为空时回退默认头部', () => {
        const { container } = render(Container, {
            props: { title: 'Title', visible: true },
            slots: { header: () => <div class="my-header">mine</div> },
        });
        expect(container.querySelector('.my-header')).toBeInTheDocument();
        expect(container.querySelector('.semi-sidebar-container-header')).toBeNull();

        const empty = render(Container, { props: { title: 'Title', visible: true }, slots: { header: () => [] } });
        expect(empty.container.querySelector('.semi-sidebar-container-header')).toBeInTheDocument();
    });

    it('默认可调整大小，minWidth 为 150；resizable 为 false 时不包 Resizable', async () => {
        const { container, ...view } = render(Container, { props: { title: 'Title', visible: true } });
        const resizable = container.querySelector('.semi-resizable-resizable');
        expect(resizable).toContainElement(sidebarContainer(container));
        expect(resizable).toHaveStyle({ minWidth: '150px' });

        await view.rerender({ resizable: false });
        expect(container.querySelector('.semi-resizable-resizable')).toBeNull();
        expect(container.firstElementChild).toBe(sidebarContainer(container));
    });

    it('attrs 落在容器 div 上，不落在 Resizable 外层', () => {
        const { container } = render(Container, {
            props: { visible: true },
            attrs: { id: 'side', 'data-testid': 'side' },
        });
        expect(container.querySelector('.semi-resizable-resizable')).not.toHaveAttribute('id');
        expect(sidebarContainer(container)).toHaveAttribute('id', 'side');
    });

    it('根元素被命名时为 group，使用方的 role 优先', () => {
        const { container } = render(Container, { props: { visible: true }, attrs: { 'aria-label': 'Sources' } });
        expect(sidebarContainer(container)).toHaveAttribute('role', 'group');
        const own = render(Container, { props: { visible: true }, attrs: { 'aria-label': 'S', role: 'region' } });
        expect(sidebarContainer(own.container)).toHaveAttribute('role', 'region');
        const unnamed = render(Container, { props: { visible: true } });
        expect(sidebarContainer(unnamed.container)).not.toHaveAttribute('role');
    });

    it.each([true, false])('关闭后焦点回到打开前聚焦的元素，焦点已移到页面其他位置时保持（motion=%s）', async (motion) => {
        const Host = defineComponent({
            props: { visible: Boolean },
            setup: (props) => () => (
                <>
                    <button type="button">opener</button>
                    <button type="button">other</button>
                    <Container title="Title" motion={motion} visible={props.visible} />
                </>
            ),
        });
        const view = render(Host, { props: { visible: false } });
        const opener = screen.getByRole('button', { name: 'opener' });
        opener.focus();
        await view.rerender({ visible: true });
        screen.getByRole('button', { name: zh_CN.Sidebar.close }).focus();
        await view.rerender({ visible: false });
        expect(opener).toHaveFocus();

        await view.rerender({ visible: true });
        const other = screen.getByRole('button', { name: 'other' });
        other.focus();
        await view.rerender({ visible: false });
        expect(other).toHaveFocus();
    });

    it.each([true, false])('初始可见的容器关闭后焦点同样回到挂载前聚焦的元素（motion=%s）', async (motion) => {
        const opener = document.body.appendChild(document.createElement('button'));
        onTestFinished(() => opener.remove());
        opener.focus();
        const view = render(Container, { props: { title: 'Title', motion, visible: true } });
        await nextTick();
        screen.getByRole('button', { name: zh_CN.Sidebar.close }).focus();
        await view.rerender({ visible: false });
        expect(opener).toHaveFocus();
    });

    it('初始可见的容器在挂载的同一个 tick 内关闭，焦点回到挂载前聚焦的元素', async () => {
        const opener = document.body.appendChild(document.createElement('button'));
        onTestFinished(() => opener.remove());
        opener.focus();
        const visible = ref(true);
        render(
            defineComponent({
                setup: () => () => (
                    <Container motion={false} visible={visible.value}>
                        {() => <input />}
                    </Container>
                ),
            })
        );
        screen.getByRole('textbox').focus();
        visible.value = false;
        await nextTick();
        expect(opener).toHaveFocus();
    });

    it('没有动画时隐藏后立即卸载', async () => {
        const { container, ...view } = render(Container, { props: { title: 'Title', motion: false, visible: true } });
        expect(sidebarContainer(container)).toBeInTheDocument();
        await view.rerender({ visible: false });
        expect(container).toBeEmptyDOMElement();
        await view.rerender({ visible: true });
        expect(sidebarContainer(container)).toBeInTheDocument();
    });

    it('有动画时先播放离场动画，再卸载', async () => {
        const { container, ...view } = render(Container, { props: { title: 'Title', visible: true } });
        expect(sidebarContainer(container)).toHaveClass('semi-sidebar-animation-content_show');
        await view.rerender({ visible: false });
        expect(sidebarContainer(container)).toHaveClass('semi-sidebar-animation-content_hide');
        await endTransitions();
        expect(container).toBeEmptyDOMElement();

        await view.rerender({ visible: true });
        expect(sidebarContainer(container)).toHaveClass('semi-sidebar-animation-content_show');
    });

    it('离场动画期间重新显示时保持挂载', async () => {
        const { container, ...view } = render(Container, { props: { title: 'Title', visible: true } });
        await view.rerender({ visible: false });
        await view.rerender({ visible: true });
        await endTransitions();
        expect(sidebarContainer(container)).toBeInTheDocument();
    });

    it('卸载后不再处理 Escape', async () => {
        const onCancel = vi.fn<(event: MouseEvent | KeyboardEvent) => void>();
        const view = render(Container, {
            props: { title: 'Title', closeOnEsc: true, motion: false, visible: true, onCancel },
        });
        await nextTick();
        await fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
        view.unmount();
        await fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('仅在设置 closeOnEsc 时按 Escape 关闭', async () => {
        const onCancel = vi.fn<(event: MouseEvent | KeyboardEvent) => void>();
        const view = render(Container, { props: { title: 'Title', visible: true, onCancel } });
        await nextTick();
        await fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).not.toHaveBeenCalled();
        await view.rerender({ closeOnEsc: true });
        await fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('afterVisibleChange 报告显示，并在离场动画结束后报告隐藏', async () => {
        const onAfterVisibleChange = vi.fn<(visible: boolean) => void>();
        const { container, ...view } = render(Container, { props: { title: 'Title', onAfterVisibleChange } });
        expect(onAfterVisibleChange).not.toHaveBeenCalled();
        await view.rerender({ visible: true });
        expect(onAfterVisibleChange).toHaveBeenLastCalledWith(true);
        await view.rerender({ visible: false });
        expect(onAfterVisibleChange).toHaveBeenCalledTimes(1);
        await endTransitions();
        expect(onAfterVisibleChange).toHaveBeenLastCalledWith(false);
        expect(onAfterVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('有动画且初始可见时挂载不报告 afterVisibleChange', async () => {
        const onAfterVisibleChange = vi.fn<(visible: boolean) => void>();
        render(Container, { props: { title: 'Title', visible: true, onAfterVisibleChange } });
        await endTransitions();
        expect(onAfterVisibleChange).not.toHaveBeenCalled();
    });

    it('初始可见时挂载不报告；没有动画时 afterVisibleChange 同样报告隐藏和再次显示', async () => {
        const onAfterVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = render(Container, { props: { title: 'Title', motion: false, visible: true, onAfterVisibleChange } });
        await nextTick();
        expect(onAfterVisibleChange).not.toHaveBeenCalled();
        await view.rerender({ visible: false });
        expect(onAfterVisibleChange.mock.calls).toEqual([[false]]);
        await view.rerender({ visible: true });
        expect(onAfterVisibleChange.mock.calls).toEqual([[false], [true]]);
    });

    it('KeepAlive 停用时释放 Escape 图层，重新激活后恢复', async () => {
        const onCancel = vi.fn<(event: MouseEvent | KeyboardEvent) => void>();
        const view = render(KeepAliveHost, { props: { shown: true, onCancel } });
        await nextTick();
        await fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);

        await view.rerender({ shown: false });
        await fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);

        await view.rerender({ shown: true });
        await nextTick();
        await fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(2);
    });
});

describe('Sidebar', () => {
    afterEach(() => {
        instances.length = 0;
        vi.restoreAllMocks();
    });

    it('类型：不接受被忽略的 change，detailContent 不是 any', () => {
        expectTypeOf<SideBarEmits>().not.toHaveProperty('change');
        expectTypeOf<NonNullable<SideBarProps['detailContent']>>().not.toBeAny();
    });

    it('main 模式显示标题、选项，以及当前激活 key 对应的 #mainContent', () => {
        const mainContent = vi.fn<(props: { activeKey: string | undefined }) => ReturnType<typeof h>>(({ activeKey }) => <div class="main-content">{`content of ${activeKey}`}</div>);
        const { container } = render(Sidebar, {
            props: { title: 'Sidebar title', activeKey: 'file', options, visible: true },
            attrs: { class: 'custom' },
            slots: { mainContent },
        });
        const root = sidebarContainer(container);
        expect(root).toHaveClass('semi-sidebar-main', 'custom');
        expect(root).not.toHaveClass('semi-sidebar-detail');
        expect(root?.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent('Sidebar title');
        expect(mainContent).toHaveBeenLastCalledWith({ activeKey: 'file' });
        expect(root?.querySelector('.semi-sidebar-main-content .main-content')).toHaveTextContent('content of file');

        const buttons = [...(root?.querySelectorAll('.semi-sidebar-options-button') ?? [])];
        expect(buttons.map((button) => button.textContent)).toEqual(['Code', 'File']);
        expect(buttons[0]).toHaveClass('semi-sidebar-options-normal');
        expect(buttons[1]).not.toHaveClass('semi-sidebar-options-normal');
    });

    it('点击选项时先发出 update:activeKey，再以事件和 key 发出 activeOptionChange', async () => {
        const order: string[] = [];
        const onActiveOptionChange = vi.fn<Emit<'activeOptionChange'>>(() => order.push('activeOptionChange'));
        render(Sidebar, {
            props: {
                options,
                visible: true,
                onActiveOptionChange,
                'onUpdate:activeKey': (key: string) => order.push(`update:${key}`),
            },
        });
        await fireEvent.click(screen.getByText('Code'));
        expect(onActiveOptionChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), 'code');
        expect(order).toEqual(['update:code', 'activeOptionChange']);
    });

    it('v-model:activeKey 跟随点击的选项', async () => {
        render(SidebarModel);
        expect(screen.getByRole('button', { name: 'File' })).toHaveAttribute('aria-pressed', 'true');
        await fireEvent.click(screen.getByRole('button', { name: 'Code' }));
        expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'File' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('#optionIcon 渲染选项按钮的图标', () => {
        const { container } = render(Sidebar, {
            props: { options, visible: true },
            slots: { optionIcon: ({ item }: { item: { key: string } }) => <IconCode data-key={item.key} /> },
        });
        const icons = container.querySelectorAll('.semi-sidebar-options-button [data-key]');
        expect([...icons].map((icon) => icon.getAttribute('data-key'))).toEqual(['code', 'file']);
    });

    it('#optionItem 替换每个选项，并接收切换处理函数', async () => {
        const onActiveOptionChange = vi.fn<Emit<'activeOptionChange'>>();
        render(Sidebar, {
            props: { options, visible: true, onActiveOptionChange },
            slots: {
                optionItem: ({ item, active, onClick }: { item: { name: string }; active: boolean; onClick: () => void }) => <button type="button" data-active={String(active)} onClick={onClick}>{`custom ${item.name}`}</button>,
            },
        });
        await fireEvent.click(screen.getByText('custom File'));
        expect(onActiveOptionChange).toHaveBeenCalledWith(expect.anything(), 'file');
        expect(document.querySelector('.semi-sidebar-options-button')).toBeNull();
    });

    it('code 模式显示代码，并用详情头部代替标题', () => {
        const { container } = render(Sidebar, {
            props: { title: 'Sidebar title', detailContent: codeDetail, mode: 'code', visible: true },
        });
        const root = sidebarContainer(container);
        expect(root).toHaveClass('semi-sidebar-detail');
        expect(root?.querySelector('.semi-sidebar-container-header')).toBeNull();
        expect(root?.querySelector('.semi-sidebar-detail-header-title')).toHaveTextContent('main.js');
        expect(root?.querySelector('.semi-sidebar-code-content')).toHaveTextContent('const a = 1;');
        expect(screen.queryByText('Sidebar title')).toBeNull();
    });

    it('code 模式下 isJson 显示全高只读的 JsonViewer', async () => {
        render(Sidebar, {
            props: { detailContent: { name: 'a.json', isJson: true, content: '{"a":1}' }, mode: 'code', visible: true },
        });
        await waitFor(() => expect(instances).not.toHaveLength(0));
        const core = instances.at(-1);
        expect(core?.value).toBe('{"a":1}');
        expect(core?.options).toEqual(expect.objectContaining({ readOnly: true, autoWrap: true }));
        expect(document.querySelector('.semi-json-viewer')).toHaveStyle({ height: '100%' });
    });

    it('详情的 jsonViewerProps 传给 JsonViewer，默认仍为全高', () => {
        render(Sidebar, {
            props: {
                detailContent: {
                    name: 'a.json',
                    isJson: true,
                    content: '{"a":1}',
                    jsonViewerProps: { class: 'my-json' },
                },
                mode: 'code',
                visible: true,
            },
        });
        expect(document.querySelector('.my-json')).toBeInTheDocument();
        expect(document.querySelector('.semi-json-viewer')).toHaveStyle({ height: '100%' });
    });

    it('#customRender 和 #searchButton 转发给 code 详情的 JsonViewer', async () => {
        await expectJsonSlotsForwarded(() =>
            render(Sidebar, {
                props: {
                    detailContent: {
                        name: 'a.json',
                        isJson: true,
                        content: '{"a":"x"}',
                        jsonViewerProps: jsonSlotProps,
                    },
                    mode: 'code',
                    visible: true,
                },
                slots: jsonSlots,
            })
        );
    });

    it('详情内容不是字符串时不显示复制按钮', async () => {
        const view = render(Sidebar, {
            props: { detailContent: { name: 'a.js' }, mode: 'code', visible: true },
        });
        expect(screen.queryByRole('button', { name: text.copy })).toBeNull();
        await view.rerender({ detailContent: codeDetail });
        expect(screen.getByRole('button', { name: text.copy })).toBeInTheDocument();
    });

    it('file 模式显示编辑器，除非 fileEditable 为 false 否则可编辑', async () => {
        const fileDetail = { name: 'a.md', content: '<p>file text</p>' };
        const { container, ...view } = render(Sidebar, {
            props: { detailContent: fileDetail, mode: 'file', visible: true },
        });
        expect(container.querySelector('.semi-sidebar-detail-header-title')).toHaveTextContent('a.md');
        expect(await screen.findByText('file text')).toBeInTheDocument();
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeInTheDocument();
        expect(screen.getByText('file text').closest('.ProseMirror')).toHaveAttribute('contenteditable', 'true');

        await view.rerender({ fileEditable: false });
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeNull();
        expect(container.querySelector('.ProseMirror')).toHaveAttribute('contenteditable', 'false');

        await view.rerender({ fileEditable: true });
        expect(container.querySelector('.ProseMirror')).toHaveAttribute('contenteditable', 'true');
    });

    it('file 模式通过 fileContentChange 报告编辑', async () => {
        const onFileContentChange = vi.fn<Emit<'fileContentChange'>>();
        const { container } = render(Sidebar, {
            props: {
                detailContent: { name: 'a.md', content: '<p>text</p>' },
                mode: 'file',
                visible: true,
                onFileContentChange,
            },
        });
        await screen.findByText('text');
        const editor = container.querySelector<HTMLElement & { editor: Editor }>('.ProseMirror')?.editor;
        editor?.commands.selectAll();
        await fireEvent.click(container.querySelector('.semi-icon-bold')?.closest('button') as Element);
        expect(onFileContentChange).toHaveBeenLastCalledWith('<p><strong>text</strong></p>');
    });

    it('没有 detailContent 的详情模式渲染空头部和编辑器', async () => {
        // code mode is not used here: CodeHighlight rejects an undefined code asynchronously
        const { container } = render(Sidebar, { props: { mode: 'file', visible: true } });
        expect(container.querySelector('.semi-sidebar-detail-header-title')).toBeEmptyDOMElement();
        await waitFor(() => expect(container.querySelector('.ProseMirror')).toHaveTextContent(''));
    });

    it('没有内置内容的模式渲染空详情', () => {
        const { container } = render(Sidebar, {
            props: { detailContent: { name: 'x' }, mode: 'custom', visible: true },
        });
        const content = container.querySelector('.semi-sidebar-container-content');
        expect(content?.children).toHaveLength(0);
        expect(content?.textContent).toBe('');
    });

    it('详情关闭按钮以 main 模式发出 backWard', async () => {
        const onBackWard = vi.fn<Emit<'backWard'>>();
        const { container } = render(Sidebar, {
            props: { detailContent: codeDetail, mode: 'code', visible: true, onBackWard },
        });
        await fireEvent.click(container.querySelector('.semi-sidebar-detail-header-left button') as Element);
        expect(onBackWard).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), 'main');
    });

    it('复制时写入内容，在侧边栏内显示 Toast，并报告成功', async () => {
        const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
        mockClipboard(writeText);
        const onDetailContentCopy = vi.fn<Emit<'detailContentCopy'>>();
        const { container } = render(Sidebar, {
            props: { detailContent: codeDetail, mode: 'code', visible: true, onDetailContentCopy },
        });
        await fireEvent.click(container.querySelector('.semi-sidebar-detail-header-right button') as Element);
        expect(writeText).toHaveBeenCalledWith('const a = 1;');
        await waitFor(() => expect(onDetailContentCopy).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), 'const a = 1;', true));
        await waitFor(() => expect(sidebarContainer(container)).toHaveTextContent(text.copySuccess));
        expect(sidebarContainer(container)?.querySelector('.semi-toast-wrapper')).toBeInTheDocument();
    });

    it('复制失败时报告 false，且不显示 Toast', async () => {
        mockClipboard(vi.fn<(text: string) => Promise<void>>(() => Promise.reject(new Error('denied'))));
        const onDetailContentCopy = vi.fn<Emit<'detailContentCopy'>>();
        const { container } = render(Sidebar, {
            props: { detailContent: codeDetail, mode: 'code', visible: true, onDetailContentCopy },
        });
        await fireEvent.click(container.querySelector('.semi-sidebar-detail-header-right button') as Element);
        await waitFor(() => expect(onDetailContentCopy).toHaveBeenCalledWith(expect.anything(), 'const a = 1;', false));
        expect(sidebarContainer(container)?.querySelector('.semi-toast-wrapper')).toBeNull();
    });

    it('#detailHeader 和 #detailContent 替换内置详情', () => {
        const detailHeader = vi.fn<(props: object) => ReturnType<typeof h>>(() => <div class="my-header">header</div>);
        const detailContent = vi.fn<(props: object) => ReturnType<typeof h>>(() => <div class="my-content">content</div>);
        const { container } = render(Sidebar, {
            props: { detailContent: codeDetail, mode: 'code', visible: true },
            slots: { detailHeader, detailContent },
        });
        expect(detailHeader).toHaveBeenLastCalledWith({ mode: 'code', detailContent: codeDetail });
        expect(detailContent).toHaveBeenLastCalledWith({ mode: 'code' });
        expect(container.querySelector('.my-header')).toBeInTheDocument();
        expect(container.querySelector('.my-content')).toBeInTheDocument();
        expect(container.querySelector('.semi-sidebar-detail-header')).toBeNull();
        expect(container.querySelector('.semi-sidebar-code-content')).toBeNull();
    });

    it('#detailHeader 和 #detailContent 内容为空时回退内置详情', () => {
        const { container } = render(Sidebar, {
            props: { detailContent: codeDetail, mode: 'code', visible: true },
            slots: { detailHeader: () => [], detailContent: () => [] },
        });
        expect(container.querySelector('.semi-sidebar-detail-header')).toBeInTheDocument();
        expect(container.querySelector('.semi-sidebar-code-content')).toBeInTheDocument();
    });

    it('容器属性透传：cancel、resizable 和 showClose', async () => {
        const onCancel = vi.fn<Emit<'cancel'>>();
        const { container, ...view } = render(Sidebar, { props: { title: 'T', visible: true, onCancel } });
        await fireEvent.click(screen.getByRole('button', { name: text.close }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(container.querySelector('.semi-resizable-resizable')).toBeInTheDocument();

        await view.rerender({ resizable: false, showClose: false });
        expect(container.querySelector('.semi-resizable-resizable')).toBeNull();
        expect(screen.queryByRole('button', { name: text.close })).toBeNull();
    });
});

describe('Sidebar.CodeContent', () => {
    const codes = [
        { key: 'a', name: 'a.js', language: 'javascript', content: 'let a;' },
        { key: 'b', name: 'b.js', language: 'javascript', content: 'let b;' },
    ];

    it('每个代码渲染一个面板，激活的面板展开，并报告展开点击', async () => {
        const onExpand = vi.fn<(...args: unknown[]) => void>();
        const { container } = render(CodeContent, {
            props: { activeKey: ['b'], codes, onExpand },
            attrs: { class: 'custom', style: { color: 'red' } },
        });
        const collapse = container.querySelector('.semi-sidebar-collapse');
        expect(collapse).toHaveClass('semi-sidebar-collapse-code', 'custom');
        expect(collapse).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect([...container.querySelectorAll('.semi-sidebar-collapse-header-text')].map((n) => n.textContent)).toEqual(['a.js', 'b.js']);
        expect(container.querySelectorAll('.semi-icon-code_stroked')).toHaveLength(2);
        expect(screen.getByText('let b;')).toBeInTheDocument();
        expect(screen.queryByText('let a;')).toBeNull();

        await fireEvent.click(container.querySelectorAll('.semi-sidebar-collapse-header-expand-btn')[0]);
        expect(onExpand).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), codes[0], 'code');
    });

    it('展开按钮不切换面板；change 与 update:activeKey 报告箭头触发的切换', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const onUpdate = vi.fn<(...args: unknown[]) => void>();
        const { container } = render(CodeContent, {
            props: { activeKey: [], codes, onChange, onExpand: () => {}, 'onUpdate:activeKey': onUpdate },
        });
        await fireEvent.click(container.querySelectorAll('.semi-sidebar-collapse-header-expand-btn')[0]);
        expect(onChange).not.toHaveBeenCalled();
        await fireEvent.click(container.querySelectorAll('.semi-collapse-header-icon')[0]);
        expect(onChange).toHaveBeenCalledWith(['a']);
        expect(onUpdate).toHaveBeenCalledWith(['a']);
    });

    it('面板切换按钮以文件名命名，展开按钮位于其外部', () => {
        render(CodeContent, { props: { activeKey: [], codes, onExpand: () => {} } });
        const toggle = screen.getByRole('button', { name: 'a.js' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(toggle).not.toContainElement(screen.getAllByRole('button', { name: text.expand })[0]);
    });

    it('没有 expand 监听时不渲染展开按钮，onExpandOnce 监听同样生效', async () => {
        const none = render(CodeContent, { props: { activeKey: [], codes } });
        expect(screen.queryByRole('button', { name: text.expand })).toBeNull();
        none.unmount();
        const onExpandOnce = vi.fn<(...args: unknown[]) => void>();
        // `@expand.once` compiles to `onExpandOnce`, an undeclared listener, so it goes through attrs
        render(CodeContent, { props: { activeKey: [], codes }, attrs: { onExpandOnce } });
        const buttons = screen.getAllByRole('button', { name: text.expand });
        expect(buttons).toHaveLength(2);
        await fireEvent.click(buttons[0]);
        expect(onExpandOnce).toHaveBeenCalledTimes(1);
    });

    it('CodeItem 透传 codeHighlightProps 和 jsonViewerProps', async () => {
        const { container, ...view } = render(CodeItem, {
            props: { codeHighlightProps: { class: 'my-code' }, content: 'let a;', language: 'javascript' },
        });
        expect(container.querySelector('.my-code')).toHaveTextContent('let a;');
        await view.rerender({ content: '{}', isJson: true, jsonViewerProps: { class: 'my-json' } });
        expect(container.querySelector('.my-json')).toBeInTheDocument();
    });

    it('CodeItem 把 #customRender 和 #searchButton 转发给 JsonViewer', async () => {
        await expectJsonSlotsForwarded(() =>
            render(CodeItem, {
                props: { content: '{"a":"x"}', isJson: true, jsonViewerProps: jsonSlotProps },
                slots: jsonSlots,
            })
        );
    });

    it('CodeContent 把 #customRender 和 #searchButton 转发给 JSON 面板', async () => {
        await expectJsonSlotsForwarded(() =>
            render(CodeContent, {
                props: {
                    activeKey: ['j'],
                    codes: [
                        {
                            key: 'j',
                            name: 'a.json',
                            isJson: true,
                            content: '{"a":"x"}',
                            jsonViewerProps: jsonSlotProps,
                        },
                    ],
                },
                slots: jsonSlots,
            })
        );
    });
});

describe('Sidebar 全局默认值与透传', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('mode 默认为 main', () => {
        const { container } = render(Sidebar, { props: { options, visible: true } });
        expect(sidebarContainer(container)).toHaveClass('semi-sidebar-main');
    });

    it('从 overrideDefaultProps 读取 Sidebar、Annotation 和 MCPConfigure 的默认值', () => {
        semiGlobal.config.overrideDefaultProps = {
            Sidebar: { mode: 'code', resizable: false },
            Annotation: { title: 'Global sources' },
            MCPConfigure: { placeholder: 'Global search' },
        };
        const { container } = render(Sidebar, { props: { detailContent: codeDetail, visible: true } });
        expect(sidebarContainer(container)).toHaveClass('semi-sidebar-detail');
        expect(container.querySelector('.semi-resizable-resizable')).toBeNull();
        render(Annotation, { props: { info: [], visible: true } });
        expect(screen.getByText('Global sources')).toBeInTheDocument();
        render(MCPConfigure, { props: { options: [], visible: true } });
        expect(screen.getByPlaceholderText('Global search')).toBeInTheDocument();
    });

    it('未配置的全局默认值不覆盖 Container 自身的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Sidebar: { title: 'Global' } };
        const { container } = render(Sidebar, { props: { visible: true } });
        expect(container.querySelector('.semi-resizable-resizable')).toHaveStyle({ minWidth: '150px' });
        expect(sidebarContainer(container)).toHaveClass('semi-sidebar-animation-content_show');
        expect(screen.getByRole('button', { name: text.close })).toBeInTheDocument();
    });

    it.each([
        ['Sidebar', Sidebar, {}],
        ['Annotation', Annotation, { info: [] }],
        ['MCPConfigure', MCPConfigure, { options: [] }],
        ['Container', Container, {}],
    ] as const)('%s 的 attrs 落在容器 div 上', (_name, component, props) => {
        const { container } = render(component, {
            props: { ...props, visible: true },
            attrs: { 'data-testid': 'root' },
        });
        expect(sidebarContainer(container)).toHaveAttribute('data-testid', 'root');
    });

    it.each([
        ['Sidebar', Sidebar, {}],
        ['Annotation', Annotation, { info: [] }],
        ['MCPConfigure', MCPConfigure, { options: [] }],
    ] as const)('%s 经 ref 暴露容器 div，隐藏后为 null', async (_name, component, props) => {
        const handle: { current?: { readonly root: HTMLDivElement | null } } = {};
        const Host = defineComponent({
            props: { visible: Boolean },
            setup: (hostProps) => () =>
                h(component as Component, {
                    ...props,
                    motion: false,
                    visible: hostProps.visible,
                    ref: (instance: unknown) => {
                        handle.current = instance as typeof handle.current;
                    },
                }), // component type is a variable: JSX cannot take it
        });
        const view = render(Host, { props: { visible: true } });
        expect(handle.current?.root).toBe(sidebarContainer(view.container));
        await view.rerender({ visible: false });
        await waitFor(() => expect(handle.current?.root).toBeNull());
    });

    it.each([
        ['Annotation', Annotation, { info: [], onClick: () => {}, onChange: () => {} }],
        ['MCPConfigure', MCPConfigure, { filter: () => true, options: [], onSearch: () => {} }],
        ['Container', Container, { onAfterVisibleChange: () => {}, closeOnEsc: true }],
    ] as const)('%s 只由组件使用的属性不进入 DOM', (_name, component, props) => {
        const { container } = render(component, { props: { ...props, visible: true } });
        const root = sidebarContainer(container) as HTMLElement;
        expect(root.getAttributeNames().filter((name) => name !== 'class' && name !== 'style')).toEqual([]);
    });

    it('主模式选项按钮用 aria-pressed 暴露当前选项', async () => {
        const view = render(Sidebar, { props: { activeKey: 'file', options, visible: true } });
        expect(screen.getByRole('button', { name: 'File' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'false');
        await view.rerender({ activeKey: 'code' });
        expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'File' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('切换 main 与详情模式后，焦点交给返回按钮或当前选项，而不是掉到 body', async () => {
        const { container, ...view } = render(Sidebar, { props: { activeKey: 'code', detailContent: codeDetail, options, visible: true } });
        screen.getByRole('button', { name: 'Code' }).focus();
        await view.rerender({ mode: 'code' });
        expect(container.querySelector('.semi-sidebar-detail-header-left button')).toHaveFocus();
        await view.rerender({ mode: 'main' });
        expect(screen.getByRole('button', { name: 'Code' })).toHaveFocus();
    });

    it('切换模式时，用户已移到别处的焦点保持不动', async () => {
        const outside = document.body.appendChild(document.createElement('button'));
        onTestFinished(() => outside.remove());
        const view = render(Sidebar, { props: { detailContent: codeDetail, options, visible: true } });
        outside.focus();
        await view.rerender({ mode: 'code' });
        expect(outside).toHaveFocus();
    });

    it('隐藏后再显示，复制提示出现在新的容器里，隐藏时旧提示被销毁', async () => {
        mockClipboard(vi.fn<(text: string) => Promise<void>>(() => Promise.resolve()));
        const { container, ...view } = render(Sidebar, {
            props: { detailContent: codeDetail, mode: 'code', visible: true },
        });
        await fireEvent.click(container.querySelector('.semi-sidebar-detail-header-right button') as Element);
        await waitFor(() => expect(sidebarContainer(container)).toHaveTextContent(text.copySuccess));

        await view.rerender({ visible: false });
        await endTransitions();
        expect(document.querySelector('.semi-toast-wrapper')).toBeNull();

        await view.rerender({ visible: true });
        await fireEvent.click(container.querySelector('.semi-sidebar-detail-header-right button') as Element);
        await waitFor(() => expect(sidebarContainer(container)).toHaveTextContent(text.copySuccess));
    });

    it('带 key 的数据项与替换插槽渲染时没有 Vue 警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const codes = [{ key: 'a', name: 'a.js', language: 'javascript', content: 'let a;' }];
        render(CodeContent, { props: { activeKey: ['a'], codes } });
        render(Sidebar, { props: { detailContent: codes[0], mode: 'code', visible: true } });
        render(Sidebar, {
            props: { detailContent: { key: 'f', name: 'a.md', content: '<p>x</p>' }, mode: 'file', visible: true },
        });
        render(Sidebar, {
            props: { options, visible: true },
            slots: { optionItem: ({ item }: { item: { name: string } }) => <span>{item.name}</span> },
        });
        render(Annotation, {
            props: {
                activeKey: ['1'],
                info: [{ header: 'h', key: '1', annotations: [{ title: 'a' }, { title: 'b' }] }],
                visible: true,
            },
            slots: { item: ({ item }: { item: { title?: string } }) => <span>{item.title}</span> },
        });
        await screen.findByText('x');
        expect(warn).not.toHaveBeenCalled();
    });

    it('语言包切换后详情按钮名称跟随', () => {
        render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => <Sidebar detailContent={codeDetail} mode="code" visible /> },
        });
        expect(ja_JP.Sidebar.copy).not.toBe(text.copy);
        expect(screen.getByRole('button', { name: ja_JP.Sidebar.copy })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja_JP.Sidebar.close })).toBeInTheDocument();
    });
});

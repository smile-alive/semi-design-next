import { type Component, createSignal, onMount } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import type { Editor } from '@tiptap/core';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { JsonViewer } from '@fibrae/semi-json-viewer-core';
import semiGlobal from '@fibrae/semi-ui-solid/_utils/semi-global';
import Annotation from '../annotation';
import type { ContainerSolidProps, Option, SideBarProps } from '../interface';
import MCPConfigure from '../mcp-configure';
import Sidebar from '../sidebar';
import type { CodeContentProps, CodeItemProps } from '../widget/code';

const { Container, CodeContent, CodeItem } = Sidebar;

const Core = JsonViewer as unknown as { instances: { value: unknown; options: unknown }[] };

// jsdom has no Worker for the JSON editor core; the fake records what JsonViewer handed it
vi.mock('@fibrae/semi-json-viewer-core', () => {
    class JsonViewer {
        static instances: JsonViewer[] = [];
        container: unknown;
        value: unknown;
        options: unknown;
        emitter = { on: () => {}, emit: () => {} };

        constructor(container: unknown, value: unknown, options: unknown) {
            this.container = container;
            this.value = value;
            this.options = options;
            JsonViewer.instances.push(this);
        }

        layout = () => {};
        format = () => {};
        resetMeasuredHeights = () => {};
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

const sidebarContainer = (container: HTMLElement) => container.querySelector('.semi-sidebar-container') as HTMLElement;
const options: Option[] = [
    { name: 'Code', key: 'code' },
    { name: 'File', key: 'file' },
];
const codeDetail = { key: 'c1', name: 'main.js', language: 'javascript', content: 'const a = 1;' };

function mockClipboard(writeText: (text: string) => Promise<void>) {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

const animationEnd = (node: Element) => node.dispatchEvent(new Event('animationend', { bubbles: true }));
// the setup stubs getAnimations() with [], which ends every run at once
const holdAnimations = () => vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ animationName: 'running' } as unknown as Animation]);

// Props are spread from a signal, as a consumer does with a store: every key is notified on any change
function renderWith<P extends object>(Comp: Component<P>, initial: P) {
    const [props, setProps] = createSignal<P>(initial);
    const result = render(() => <Dynamic component={Comp} {...props()} />);
    return { ...result, rerender: (next: P) => setProps(() => next) };
}

describe('Sidebar.Container', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('隐藏时不渲染任何内容', () => {
        const { container } = render(() => <Container title="Title">content</Container>);
        expect(container).toBeEmptyDOMElement();
    });

    it('渲染标题、关闭按钮、内容、class 和 style', () => {
        let node: HTMLDivElement | undefined;
        const { container } = render(() => (
            <Container class="custom" style={{ color: 'red' }} title="Title" containerRef={(el) => (node = el)} visible>
                content
            </Container>
        ));
        const root = sidebarContainer(container);
        expect(root).toHaveClass('custom');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(node).toBe(root);
        expect(root.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent('Title');
        expect(root.querySelector('.semi-sidebar-container-content')).toHaveTextContent('content');
        expect(screen.getByRole('button', { name: zh_CN.Sidebar.close })).toHaveClass('semi-sidebar-container-header-closeBtn');
    });

    it('关闭按钮调用 onCancel；showClose={false} 时移除关闭按钮', () => {
        const onCancel = vi.fn<() => void>();
        const { rerender } = renderWith<ContainerSolidProps>(Container, { title: 'Title', visible: true, onCancel });
        fireEvent.click(screen.getByRole('button', { name: zh_CN.Sidebar.close }));
        expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));

        rerender({ title: 'Title', showClose: false, visible: true, onCancel });
        expect(screen.queryByRole('button', { name: zh_CN.Sidebar.close })).toBeNull();
    });

    it('renderHeader 返回节点时替换头部', () => {
        const { container, rerender } = renderWith<ContainerSolidProps>(Container, { title: 'Title', visible: true, renderHeader: () => <div class="my-header">mine</div> });
        expect(container.querySelector('.my-header')).toBeInTheDocument();
        expect(container.querySelector('.semi-sidebar-container-header')).toBeNull();

        rerender({ title: 'Title', visible: true, renderHeader: () => null });
        expect(container.querySelector('.semi-sidebar-container-header')).toBeInTheDocument();
    });

    it('默认可调整大小，minWidth 为 150', () => {
        const { container, rerender } = renderWith<ContainerSolidProps>(Container, { title: 'Title', visible: true });
        const resizable = container.querySelector('.semi-resizable-resizable');
        expect(resizable).toContainElement(sidebarContainer(container));
        expect(resizable).toHaveStyle({ minWidth: '150px' });

        rerender({ title: 'Title', resizable: false, visible: true });
        expect(container.querySelector('.semi-resizable-resizable')).toBeNull();
        expect(container.firstChild).toBe(sidebarContainer(container));
    });

    it('没有动画时隐藏后立即卸载', () => {
        const { container, rerender } = renderWith<ContainerSolidProps>(Container, { title: 'Title', motion: false, visible: true });
        expect(sidebarContainer(container)).toBeInTheDocument();
        rerender({ title: 'Title', motion: false, visible: false });
        expect(container).toBeEmptyDOMElement();
        rerender({ title: 'Title', motion: false, visible: true });
        expect(sidebarContainer(container)).toBeInTheDocument();
    });

    it('有动画时先播放离场动画，再卸载', () => {
        holdAnimations();
        const { container, rerender } = renderWith<ContainerSolidProps>(Container, { title: 'Title', visible: true });
        expect(sidebarContainer(container)).toHaveClass('semi-sidebar-animation-content_show');
        rerender({ title: 'Title', visible: false });
        const root = sidebarContainer(container);
        expect(root).toHaveClass('semi-sidebar-animation-content_hide');
        animationEnd(root);
        expect(container).toBeEmptyDOMElement();

        rerender({ title: 'Title', visible: true });
        expect(sidebarContainer(container)).toHaveClass('semi-sidebar-animation-content_show');
    });

    it('离场动画期间重新显示时保持挂载', () => {
        holdAnimations();
        const { container, rerender } = renderWith<ContainerSolidProps>(Container, { title: 'Title', visible: true });
        rerender({ title: 'Title', visible: false });
        rerender({ title: 'Title', visible: true });
        animationEnd(sidebarContainer(container));
        expect(sidebarContainer(container)).toBeInTheDocument();
    });

    it('卸载后不再处理 Escape', () => {
        const onCancel = vi.fn<() => void>();
        const { unmount } = render(() => <Container title="Title" closeOnEsc motion={false} visible onCancel={onCancel} />);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
        unmount();
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('隐藏后不再处理 Escape', () => {
        const onCancel = vi.fn<() => void>();
        const { rerender } = renderWith<ContainerSolidProps>(Container, { closeOnEsc: true, motion: false, visible: true, onCancel });
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
        rerender({ closeOnEsc: true, motion: false, visible: false, onCancel });
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('仅在设置 closeOnEsc 时按 Escape 关闭', () => {
        const onCancel = vi.fn<() => void>();
        const { rerender } = renderWith<ContainerSolidProps>(Container, { title: 'Title', visible: true, onCancel });
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).not.toHaveBeenCalled();
        rerender({ title: 'Title', closeOnEsc: true, visible: true, onCancel });
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('根元素被命名时为 group，使用方的 role 优先', () => {
        const { container } = render(() => <Container aria-label="Sources" visible />);
        expect(sidebarContainer(container)).toHaveAttribute('role', 'group');
        const own = render(() => <Container aria-label="S" role="tabpanel" visible />);
        expect(sidebarContainer(own.container)).toHaveAttribute('role', 'tabpanel');
        const unnamed = render(() => <Container visible />);
        expect(sidebarContainer(unnamed.container)).not.toHaveAttribute('role');
    });

    it.each([true, false])('关闭后焦点回到打开前聚焦的元素，焦点已移到页面其他位置时保持（motion=%s）', (motion) => {
        const [visible, setVisible] = createSignal(false);
        render(() => (
            <>
                <button type="button">opener</button>
                <button type="button">other</button>
                <Container title="Title" motion={motion} visible={visible()} />
            </>
        ));
        const opener = screen.getByRole('button', { name: 'opener' });
        opener.focus();
        setVisible(true);
        screen.getByRole('button', { name: zh_CN.Sidebar.close }).focus();
        setVisible(false);
        expect(opener).toHaveFocus();

        setVisible(true);
        const other = screen.getByRole('button', { name: 'other' });
        other.focus();
        setVisible(false);
        expect(other).toHaveFocus();
    });

    it('初始可见的容器在挂载后立即关闭，焦点回到挂载前聚焦的元素', () => {
        const opener = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const [visible, setVisible] = createSignal(true);
        render(() => (
            <Container motion={false} visible={visible()}>
                <input />
            </Container>
        ));
        screen.getByRole('textbox').focus();
        setVisible(false);
        expect(opener).toHaveFocus();
        opener.remove();
    });

    it('卸载后焦点回到挂载前聚焦的元素', () => {
        const opener = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const { unmount } = render(() => (
            <Container motion={false} visible>
                <input />
            </Container>
        ));
        screen.getByRole('textbox').focus();
        unmount();
        expect(opener).toHaveFocus();
        opener.remove();
    });

    it('首次可见挂载时自动聚焦的内容保持焦点，卸载后焦点回到挂载前的元素', () => {
        const opener = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const AutoFocusInput = () => {
            let input: HTMLInputElement | undefined;
            onMount(() => input?.focus());
            return <input ref={(node) => (input = node)} />;
        };
        const { unmount } = render(() => (
            <Container motion={false} visible>
                <AutoFocusInput />
            </Container>
        ));
        expect(screen.getByRole('textbox')).toHaveFocus();
        unmount();
        expect(opener).toHaveFocus();
        opener.remove();
    });

    it('afterVisibleChange 报告显示，并在离场动画结束后报告隐藏', () => {
        holdAnimations();
        const afterVisibleChange = vi.fn<(visible: boolean) => void>();
        const { container, rerender } = renderWith<ContainerSolidProps>(Container, { title: 'Title', afterVisibleChange });
        expect(afterVisibleChange).not.toHaveBeenCalled();
        rerender({ title: 'Title', afterVisibleChange, visible: true });
        expect(afterVisibleChange).toHaveBeenLastCalledWith(true);
        rerender({ title: 'Title', afterVisibleChange, visible: false });
        expect(afterVisibleChange).toHaveBeenCalledTimes(1);
        animationEnd(sidebarContainer(container));
        expect(afterVisibleChange).toHaveBeenLastCalledWith(false);
        expect(afterVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('渲染期间就显示，afterVisibleChange 报告显示', () => {
        const afterVisibleChange = vi.fn<(visible: boolean) => void>();
        function Demo() {
            const [visible, setVisible] = createSignal(false);
            // a ref callback runs while rendering, before any effect
            return (
                <>
                    <Container title="Title" visible={visible()} afterVisibleChange={afterVisibleChange} />
                    <span ref={() => setVisible(true)} />
                </>
            );
        }
        render(() => <Demo />);
        expect(afterVisibleChange).toHaveBeenCalledExactlyOnceWith(true);
    });
});

describe('Sidebar', () => {
    afterEach(() => {
        Core.instances.length = 0;
    });

    it('类型与运行时一致：不接受被忽略的 onChange，detailContent 不是 any，选项只有名称与 key', () => {
        expectTypeOf<SideBarProps>().not.toHaveProperty('onChange');
        expectTypeOf<NonNullable<SideBarProps['detailContent']>>().not.toBeAny();
        expectTypeOf<Option>().toEqualTypeOf<{ name: string; key: string }>();
    });

    it('类型：renderDetailHeader 可能收不到 detailContent；detailContent 不接受由 Sidebar 属性提供的字段', () => {
        expectTypeOf<Parameters<NonNullable<SideBarProps['renderDetailHeader']>>>().toEqualTypeOf<[mode: string, detailContent?: SideBarProps['detailContent']]>();
        // @ts-expect-error Sidebar sets editable, imgUploadProps and onContentChange from its own props
        const detail: SideBarProps['detailContent'] = { name: 'a.md', onContentChange: () => {} };
        expect(detail?.name).toBe('a.md');
    });

    it('main 模式显示标题、选项，以及当前激活 key 对应的 renderMainContent', () => {
        const renderMainContent = vi.fn<NonNullable<SideBarProps['renderMainContent']>>((key) => <div class="main-content">{`content of ${key}`}</div>);
        const { container } = render(() => <Sidebar class="custom" title="Sidebar title" activeKey="file" options={options} visible renderMainContent={renderMainContent} />);
        const root = sidebarContainer(container);
        expect(root).toHaveClass('semi-sidebar-main', 'custom');
        expect(root).not.toHaveClass('semi-sidebar-detail');
        expect(root.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent('Sidebar title');
        expect(renderMainContent).toHaveBeenLastCalledWith('file');
        expect(root.querySelector('.semi-sidebar-main-content .main-content')).toHaveTextContent('content of file');

        const buttons = [...root.querySelectorAll('.semi-sidebar-options-button')];
        expect(buttons.map((button) => button.textContent)).toEqual(['Code', 'File']);
        expect(buttons[0]).toHaveClass('semi-sidebar-options-normal');
        expect(buttons[1]).not.toHaveClass('semi-sidebar-options-normal');
    });

    it('点击选项时以事件和 key 调用 onActiveOptionChange', () => {
        const onActiveOptionChange = vi.fn<NonNullable<SideBarProps['onActiveOptionChange']>>();
        render(() => <Sidebar options={options} visible onActiveOptionChange={onActiveOptionChange} />);
        fireEvent.click(screen.getByText('Code'));
        expect(onActiveOptionChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), 'code');
    });

    it('renderOptionItem 渲染每个选项，并接收切换处理函数', () => {
        const onActiveOptionChange = vi.fn<NonNullable<SideBarProps['onActiveOptionChange']>>();
        render(() => (
            <Sidebar
                options={options}
                visible
                renderOptionItem={(option, onChange) => (
                    <button type="button" onClick={(e) => onChange(e, option.key)}>
                        {`custom ${option.name}`}
                    </button>
                )}
                onActiveOptionChange={onActiveOptionChange}
            />
        ));
        fireEvent.click(screen.getByText('custom File'));
        expect(onActiveOptionChange).toHaveBeenCalledWith(expect.anything(), 'file');
        expect(document.querySelector('.semi-sidebar-options-button')).toBeNull();
    });

    it('未传 onActiveOptionChange 时，renderOptionItem 收到的切换处理函数仍可调用', () => {
        const handlers: unknown[] = [];
        render(() => (
            <Sidebar
                options={options}
                visible
                renderOptionItem={(option, onChange) => {
                    handlers.push(onChange);
                    return <span>{option.name}</span>;
                }}
            />
        ));
        expect(handlers).not.toHaveLength(0);
        for (const handler of handlers) {
            expect(typeof handler).toBe('function');
            expect(() => (handler as () => void)()).not.toThrow();
        }
    });

    it('code 模式显示代码，并用详情头部代替标题', () => {
        const { container } = render(() => <Sidebar title="Sidebar title" detailContent={codeDetail} mode="code" visible />);
        const root = sidebarContainer(container);
        expect(root).toHaveClass('semi-sidebar-detail');
        expect(root.querySelector('.semi-sidebar-container-header')).toBeNull();
        expect(root.querySelector('.semi-sidebar-detail-header-title')).toHaveTextContent('main.js');
        expect(root.querySelector('.semi-sidebar-code-content')).toHaveTextContent('const a = 1;');
        expect(screen.queryByText('Sidebar title')).toBeNull();
    });

    it('code 模式下 isJson 显示全高只读的 JsonViewer', () => {
        render(() => <Sidebar detailContent={{ name: 'a.json', isJson: true, content: '{"a":1}' }} mode="code" visible />);
        const core = Core.instances.at(-1);
        expect(core?.value).toBe('{"a":1}');
        expect(core?.options).toEqual(expect.objectContaining({ readOnly: true, autoWrap: true }));
        expect(document.querySelector('.semi-json-viewer')).toHaveStyle({ height: '100%' });
    });

    it('详情的 jsonViewerProps 传给 JsonViewer，默认仍为全高', () => {
        render(() => <Sidebar detailContent={{ name: 'a.json', isJson: true, content: '{"a":1}', jsonViewerProps: { class: 'my-json' } }} mode="code" visible />);
        expect(document.querySelector('.my-json')).toBeInTheDocument();
        expect(document.querySelector('.semi-json-viewer')).toHaveStyle({ height: '100%' });
    });

    it('详情内容不是字符串时不显示复制按钮', () => {
        const { rerender } = renderWith<SideBarProps>(Sidebar, { detailContent: { name: 'a.js' }, mode: 'code', visible: true });
        expect(screen.queryByRole('button', { name: zh_CN.Sidebar.copy })).toBeNull();
        rerender({ detailContent: codeDetail, mode: 'code', visible: true });
        expect(screen.getByRole('button', { name: zh_CN.Sidebar.copy })).toBeInTheDocument();
    });

    it('file 模式显示编辑器，除非 fileEditable 为 false 否则可编辑', () => {
        const fileDetail = { name: 'a.md', content: '<p>file text</p>' };
        const { container, rerender } = renderWith<SideBarProps>(Sidebar, { detailContent: fileDetail, mode: 'file', visible: true });
        expect(container.querySelector('.semi-sidebar-detail-header-title')).toHaveTextContent('a.md');
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeInTheDocument();
        expect(screen.getByText('file text').closest('.ProseMirror')).toHaveAttribute('contenteditable', 'true');

        rerender({ detailContent: fileDetail, fileEditable: false, mode: 'file', visible: true });
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeNull();
        expect(container.querySelector('.ProseMirror')).toHaveAttribute('contenteditable', 'false');

        rerender({ detailContent: fileDetail, fileEditable: true, mode: 'file', visible: true });
        expect(container.querySelector('.ProseMirror')).toHaveAttribute('contenteditable', 'true');
    });

    it('file 模式通过 onFileContentChange 报告编辑', () => {
        const onFileContentChange = vi.fn<NonNullable<SideBarProps['onFileContentChange']>>();
        const { container } = render(() => <Sidebar detailContent={{ name: 'a.md', content: '<p>text</p>' }} mode="file" visible onFileContentChange={onFileContentChange} />);
        const editor = (container.querySelector('.ProseMirror') as HTMLElement & { editor: Editor }).editor;
        editor.commands.selectAll();
        fireEvent.click(container.querySelector('.semi-icon-bold')?.closest('button') as HTMLElement);
        expect(onFileContentChange).toHaveBeenLastCalledWith('<p><strong>text</strong></p>');
    });

    it('另一个详情项重新挂载编辑器，同一项的内容更新保留编辑器', () => {
        const { container, rerender } = renderWith<SideBarProps>(Sidebar, { detailContent: { key: 'a', name: 'a.md', content: '<p>a</p>' }, mode: 'file', visible: true });
        const first = container.querySelector('.ProseMirror');
        rerender({ detailContent: { key: 'a', name: 'a.md', content: '<p>a2</p>' }, mode: 'file', visible: true });
        expect(container.querySelector('.ProseMirror')).toBe(first);
        expect(first).toHaveTextContent('a2');
        rerender({ detailContent: { key: 'b', name: 'b.md', content: '<p>b</p>' }, mode: 'file', visible: true });
        expect(container.querySelector('.ProseMirror')).not.toBe(first);
        expect(container.querySelector('.ProseMirror')).toHaveTextContent('b');
    });

    it('没有 detailContent 的详情模式渲染空头部和编辑器', () => {
        // code mode is not used here: CodeHighlight rejects an undefined code asynchronously
        const { container } = render(() => <Sidebar mode="file" visible />);
        expect(container.querySelector('.semi-sidebar-detail-header-title')).toBeEmptyDOMElement();
        expect(container.querySelector('.ProseMirror')).toHaveTextContent('');
    });

    it('没有内置内容的模式渲染空详情', () => {
        const { container } = render(() => <Sidebar detailContent={{ name: 'x' }} mode="custom" visible />);
        expect(container.querySelector('.semi-sidebar-container-content')).toBeEmptyDOMElement();
    });

    it('详情关闭按钮以 main 模式调用 onBackWard', () => {
        const onBackWard = vi.fn<NonNullable<SideBarProps['onBackWard']>>();
        const { container } = render(() => <Sidebar detailContent={codeDetail} mode="code" visible onBackWard={onBackWard} />);
        fireEvent.click(container.querySelector('.semi-sidebar-detail-header-left button') as HTMLElement);
        expect(onBackWard).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), 'main');
    });

    it('复制时写入内容，在侧边栏内显示 Toast，并报告成功', async () => {
        const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
        mockClipboard(writeText);
        const onDetailContentCopy = vi.fn<NonNullable<SideBarProps['onDetailContentCopy']>>();
        const { container } = render(() => <Sidebar detailContent={codeDetail} mode="code" visible onDetailContentCopy={onDetailContentCopy} />);
        fireEvent.click(container.querySelector('.semi-sidebar-detail-header-right button') as HTMLElement);
        expect(writeText).toHaveBeenCalledWith('const a = 1;');
        await waitFor(() => expect(onDetailContentCopy).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), 'const a = 1;', true));
        await waitFor(() => expect(sidebarContainer(container)).toHaveTextContent(zh_CN.Sidebar.copySuccess));
        expect(sidebarContainer(container).querySelector('.semi-toast-wrapper')).toBeInTheDocument();
    });

    it('复制失败时报告 false，且不显示 Toast', async () => {
        mockClipboard(vi.fn<(text: string) => Promise<void>>(() => Promise.reject(new Error('denied'))));
        const onDetailContentCopy = vi.fn<NonNullable<SideBarProps['onDetailContentCopy']>>();
        const { container } = render(() => <Sidebar detailContent={codeDetail} mode="code" visible onDetailContentCopy={onDetailContentCopy} />);
        fireEvent.click(container.querySelector('.semi-sidebar-detail-header-right button') as HTMLElement);
        await waitFor(() => expect(onDetailContentCopy).toHaveBeenCalledWith(expect.anything(), 'const a = 1;', false));
        expect(sidebarContainer(container).querySelector('.semi-toast-wrapper')).toBeNull();
    });

    it('卸载后完成的复制不显示 Toast', async () => {
        let resolve!: () => void;
        mockClipboard(() => new Promise<void>((done) => (resolve = done)));
        const onDetailContentCopy = vi.fn<NonNullable<SideBarProps['onDetailContentCopy']>>();
        const { container, unmount } = render(() => <Sidebar detailContent={codeDetail} mode="code" visible onDetailContentCopy={onDetailContentCopy} />);
        fireEvent.click(container.querySelector('.semi-sidebar-detail-header-right button') as HTMLElement);
        unmount();
        resolve();
        await waitFor(() => expect(onDetailContentCopy).toHaveBeenCalledWith(expect.anything(), 'const a = 1;', true));
        expect(document.querySelector('.semi-toast-wrapper')).toBeNull();
    });

    it('renderDetailHeader 和 renderDetailContent 替换内置详情', () => {
        const renderDetailHeader = vi.fn<NonNullable<SideBarProps['renderDetailHeader']>>(() => <div class="my-header">header</div>);
        const renderDetailContent = vi.fn<NonNullable<SideBarProps['renderDetailContent']>>(() => <div class="my-content">content</div>);
        const { container } = render(() => <Sidebar detailContent={codeDetail} mode="code" visible renderDetailContent={renderDetailContent} renderDetailHeader={renderDetailHeader} />);
        expect(renderDetailHeader).toHaveBeenLastCalledWith('code', codeDetail);
        expect(renderDetailContent).toHaveBeenLastCalledWith('code');
        expect(container.querySelector('.my-header')).toBeInTheDocument();
        expect(container.querySelector('.my-content')).toBeInTheDocument();
        expect(container.querySelector('.semi-sidebar-detail-header')).toBeNull();
        expect(container.querySelector('.semi-sidebar-code-content')).toBeNull();
    });

    it('main 模式不调用 renderDetailHeader 和 renderDetailContent', () => {
        const renderDetailHeader = vi.fn<NonNullable<SideBarProps['renderDetailHeader']>>(() => null);
        const renderDetailContent = vi.fn<NonNullable<SideBarProps['renderDetailContent']>>(() => null);
        render(() => <Sidebar options={options} visible renderDetailContent={renderDetailContent} renderDetailHeader={renderDetailHeader} />);
        expect(renderDetailHeader).not.toHaveBeenCalled();
        expect(renderDetailContent).not.toHaveBeenCalled();
    });

    it('容器属性透传：onCancel、resizable 和 showClose', () => {
        const onCancel = vi.fn<() => void>();
        const { container, rerender } = renderWith<SideBarProps>(Sidebar, { title: 'T', visible: true, onCancel });
        fireEvent.click(screen.getByRole('button', { name: zh_CN.Sidebar.close }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(container.querySelector('.semi-resizable-resizable')).toBeInTheDocument();

        rerender({ title: 'T', resizable: false, showClose: false, visible: true, onCancel });
        expect(container.querySelector('.semi-resizable-resizable')).toBeNull();
        expect(screen.queryByRole('button', { name: zh_CN.Sidebar.close })).toBeNull();
    });
});

describe('Sidebar.CodeContent', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    const codes = [
        { key: 'a', name: 'a.js', language: 'javascript', content: 'let a;' },
        { key: 'b', name: 'b.js', language: 'javascript', content: 'let b;' },
    ];

    it('每个代码渲染一个面板，激活的面板展开，并报告展开点击', () => {
        const onExpand = vi.fn<NonNullable<CodeContentProps['onExpand']>>();
        const { container } = render(() => <CodeContent class="custom" style={{ color: 'red' }} activeKey={['b']} codes={codes} onExpand={onExpand} />);
        const collapse = container.querySelector('.semi-sidebar-collapse');
        expect(collapse).toHaveClass('semi-sidebar-collapse-code', 'custom');
        expect(collapse).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect([...container.querySelectorAll('.semi-sidebar-collapse-header-text')].map((n) => n.textContent)).toEqual(['a.js', 'b.js']);
        expect(container.querySelectorAll('.semi-icon-code_stroked')).toHaveLength(2);
        expect(screen.getByText('let b;')).toBeInTheDocument();
        expect(screen.queryByText('let a;')).toBeNull();

        fireEvent.click(container.querySelectorAll('.semi-sidebar-collapse-header-expand-btn')[0]);
        expect(onExpand).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), codes[0], 'code');
    });

    it('展开按钮不切换面板；onChange 报告箭头触发的切换', () => {
        const onChange = vi.fn<() => void>();
        const { container } = render(() => <CodeContent activeKey={[]} codes={codes} onChange={onChange} onExpand={() => {}} />);
        fireEvent.click(container.querySelectorAll('.semi-sidebar-collapse-header-expand-btn')[0]);
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.click(container.querySelectorAll('.semi-collapse-header-icon')[0]);
        expect(onChange).toHaveBeenCalledWith(['a'], expect.anything());
    });

    it('面板切换按钮以文件名命名，展开按钮位于其外部', () => {
        render(() => <CodeContent activeKey={[]} codes={codes} onExpand={() => {}} />);
        const toggle = screen.getByRole('button', { name: 'a.js' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(toggle).not.toContainElement(screen.getAllByRole('button', { name: zh_CN.Sidebar.expand })[0]);
    });

    it('未传 onExpand 时不渲染展开按钮', () => {
        render(() => <CodeContent activeKey={[]} codes={codes} />);
        expect(screen.queryByRole('button', { name: zh_CN.Sidebar.expand })).toBeNull();
    });

    it('CodeItem 透传 codeHighlightProps 和 jsonViewerProps', () => {
        const { container, rerender } = renderWith<CodeItemProps>(CodeItem, { codeHighlightProps: { class: 'my-code' }, content: 'let a;', language: 'javascript' });
        expect(container.querySelector('.my-code')).toHaveTextContent('let a;');
        rerender({ content: '{}', isJson: true, jsonViewerProps: { class: 'my-json' } });
        expect(container.querySelector('.my-json')).toBeInTheDocument();
    });
});

describe('Sidebar 全局默认值、ref 和透传', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('mode 默认为 main', () => {
        const { container } = render(() => <Sidebar options={options} visible />);
        expect(sidebarContainer(container)).toHaveClass('semi-sidebar-main');
    });

    it('从 overrideDefaultProps 读取 Sidebar、Annotation 和 MCPConfigure 的默认值', () => {
        semiGlobal.config.overrideDefaultProps = {
            Sidebar: { mode: 'code', resizable: false },
            Annotation: { title: 'Global sources' },
            MCPConfigure: { placeholder: 'Global search' },
        };
        const { container } = render(() => <Sidebar detailContent={codeDetail} visible />);
        expect(sidebarContainer(container)).toHaveClass('semi-sidebar-detail');
        expect(container.querySelector('.semi-resizable-resizable')).toBeNull();
        render(() => <Annotation info={[]} visible />);
        expect(screen.getByText('Global sources')).toBeInTheDocument();
        render(() => <MCPConfigure options={[]} visible />);
        expect(screen.getByPlaceholderText('Global search')).toBeInTheDocument();
    });

    it('ref 和 data-* 落在每个顶层组件的容器 div 上', () => {
        const refs: (HTMLDivElement | undefined)[] = [];
        const { container } = render(() => (
            <>
                <Sidebar ref={(el) => (refs[0] = el)} data-testid="sidebar" visible />
                <Annotation ref={(el) => (refs[1] = el)} data-testid="annotation" info={[]} visible />
                <MCPConfigure ref={(el) => (refs[2] = el)} data-testid="mcp" options={[]} visible />
                <Container ref={(el) => (refs[3] = el)} data-testid="container" visible />
            </>
        ));
        const roots = [...container.querySelectorAll<HTMLElement>('.semi-sidebar-container')];
        expect(roots.map((root) => root.dataset.testid)).toEqual(['sidebar', 'annotation', 'mcp', 'container']);
        expect(refs).toEqual(roots);
    });

    it('Container 同时设置 ref 和 containerRef', () => {
        const ref = vi.fn<(element: HTMLDivElement) => void>();
        const containerRef = vi.fn<(element: HTMLDivElement) => void>();
        const { container } = render(() => <Container ref={ref} containerRef={containerRef} visible />);
        expect(ref).toHaveBeenLastCalledWith(sidebarContainer(container));
        expect(containerRef).toHaveBeenLastCalledWith(sidebarContainer(container));
    });

    it('Annotation 和 MCPConfigure 把 showClose 和 renderHeader 传给容器', () => {
        const { container } = render(() => (
            <>
                <Annotation info={[]} showClose={false} visible />
                <MCPConfigure options={[]} visible renderHeader={() => <div class="mcp-header">h</div>} />
            </>
        ));
        expect(screen.queryAllByRole('button', { name: zh_CN.Sidebar.close })).toEqual([]);
        expect(container.querySelector('.mcp-header')).toBeInTheDocument();
    });

    it('仅组件使用的属性不进入 DOM', () => {
        const { container } = render(() => (
            <>
                <Annotation info={[]} visible renderItem={() => null} onClick={() => {}} />
                <MCPConfigure filter={() => true} options={[]} visible onSearch={() => {}} />
                <Container afterVisibleChange={() => {}} closeOnEsc visible />
                <Sidebar fileEditable={false} imgUploadProps={{ action: '/upload' }} options={options} visible renderMainContent={() => null} onBackWard={() => {}} />
            </>
        ));
        for (const root of container.querySelectorAll('.semi-sidebar-container')) {
            expect(root.getAttributeNames().filter((name) => name !== 'class' && name !== 'style')).toEqual([]);
        }
    });

    it('主模式选项按钮用 aria-pressed 暴露当前选项', () => {
        const { rerender } = renderWith<SideBarProps>(Sidebar, { activeKey: 'file', options, visible: true });
        expect(screen.getByRole('button', { name: 'File' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'false');
        rerender({ activeKey: 'code', options, visible: true });
        expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'File' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('隐藏后再显示，复制提示出现在新的容器里，隐藏时旧提示被销毁', async () => {
        mockClipboard(vi.fn<(text: string) => Promise<void>>(() => Promise.resolve()));
        const { container, rerender } = renderWith<SideBarProps>(Sidebar, { detailContent: codeDetail, mode: 'code', visible: true });
        fireEvent.click(container.querySelector('.semi-sidebar-detail-header-right button') as HTMLElement);
        await waitFor(() => expect(sidebarContainer(container)).toHaveTextContent(zh_CN.Sidebar.copySuccess));

        rerender({ detailContent: codeDetail, mode: 'code', visible: false });
        expect(document.querySelector('.semi-toast-wrapper')).toBeNull();

        rerender({ detailContent: codeDetail, mode: 'code', visible: true });
        fireEvent.click(container.querySelector('.semi-sidebar-detail-header-right button') as HTMLElement);
        await waitFor(() => expect(sidebarContainer(container)).toHaveTextContent(zh_CN.Sidebar.copySuccess));
    });

    it('切换 main 与详情模式后，焦点交给返回按钮或当前选项，而不是掉到 body', () => {
        const [mode, setMode] = createSignal('main');
        const { container } = render(() => <Sidebar activeKey="code" detailContent={codeDetail} mode={mode()} options={options} visible onActiveOptionChange={() => setMode('code')} onBackWard={(_, next) => void setMode(next)} />);
        const option = screen.getByRole('button', { name: 'Code' });
        option.focus();
        fireEvent.click(option);
        expect(container.querySelector('.semi-sidebar-detail-header-left button')).toHaveFocus();

        fireEvent.click(container.querySelector('.semi-sidebar-detail-header-left button') as HTMLElement);
        expect(screen.getByRole('button', { name: 'Code' })).toHaveFocus();
    });

    it('切换模式时，用户已移到别处的焦点保持不动', () => {
        const outside = document.body.appendChild(document.createElement('button'));
        const { rerender } = renderWith<SideBarProps>(Sidebar, { detailContent: codeDetail, mode: 'main', options, visible: true });
        outside.focus();
        rerender({ detailContent: codeDetail, mode: 'code', options, visible: true });
        expect(outside).toHaveFocus();
        outside.remove();
    });
});

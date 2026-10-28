import { StrictMode, createRef, useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Editor } from '@tiptap/core';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Annotation, MCPConfigure, Sidebar } from '@fibrae/semi-ai-react';
import { IconCode, IconFile } from '@fibrae/semi-icons-react';
import { JsonViewer } from '@fibrae/semi-json-viewer-core';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { Option, SideBarProps } from '../interface';
import type { CodeItemProps } from '../widget/code';

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

const sidebarContainer = (container) => container.querySelector('.semi-sidebar-container');
const options = [
    { icon: <IconCode />, name: 'Code', key: 'code' },
    { icon: <IconFile />, name: 'File', key: 'file' },
];
const codeDetail = { key: 'c1', name: 'main.js', language: 'javascript', content: 'const a = 1;' };

function mockClipboard(writeText) {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

// React binds the prefixed name in jsdom, which has no AnimationEvent
const animationEnd = (node) => fireEvent(node, new Event('webkitAnimationEnd', { bubbles: true }));

describe('Sidebar.Container', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('隐藏时不渲染任何内容', () => {
        const { container } = render(<Container title="Title">content</Container>);
        expect(container).toBeEmptyDOMElement();
    });

    it('渲染标题、关闭按钮、内容、className 和 style', () => {
        const containerRef = createRef<HTMLDivElement>();
        const { container } = render(
            <Container className="custom" style={{ color: 'red' }} title="Title" containerRef={containerRef} visible>
                content
            </Container>
        );
        const root = sidebarContainer(container);
        expect(root).toHaveClass('custom');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(containerRef.current).toBe(root);
        expect(root.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent('Title');
        expect(root.querySelector('.semi-sidebar-container-content')).toHaveTextContent('content');
        expect(screen.getByRole('button', { name: zh_CN.Sidebar.close })).toHaveClass('semi-sidebar-container-header-closeBtn');
    });

    it('关闭按钮调用 onCancel；showClose={false} 时移除关闭按钮', () => {
        const onCancel = vi.fn<() => void>();
        const { rerender } = render(<Container title="Title" visible onCancel={onCancel} />);
        fireEvent.click(screen.getByRole('button', { name: zh_CN.Sidebar.close }));
        expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));

        rerender(<Container title="Title" showClose={false} visible onCancel={onCancel} />);
        expect(screen.queryByRole('button', { name: zh_CN.Sidebar.close })).toBeNull();
    });

    it('renderHeader 返回节点时替换头部', () => {
        const { container, rerender } = render(<Container title="Title" visible renderHeader={() => <div className="my-header">mine</div>} />);
        expect(container.querySelector('.my-header')).toBeInTheDocument();
        expect(container.querySelector('.semi-sidebar-container-header')).toBeNull();

        rerender(<Container title="Title" visible renderHeader={() => null} />);
        expect(container.querySelector('.semi-sidebar-container-header')).toBeInTheDocument();
    });

    it('默认可调整大小，minWidth 为 150', () => {
        const { container, rerender } = render(<Container title="Title" visible />);
        const resizable = container.querySelector('.semi-resizable-resizable');
        expect(resizable).toContainElement(sidebarContainer(container));
        expect(resizable).toHaveStyle({ minWidth: '150px' });

        rerender(<Container title="Title" resizable={false} visible />);
        expect(container.querySelector('.semi-resizable-resizable')).toBeNull();
        expect(container.firstChild).toBe(sidebarContainer(container));
    });

    it('没有动画时隐藏后立即卸载', () => {
        const { container, rerender } = render(<Container title="Title" motion={false} visible />);
        expect(sidebarContainer(container)).toBeInTheDocument();
        rerender(<Container title="Title" motion={false} visible={false} />);
        expect(container).toBeEmptyDOMElement();
        rerender(<Container title="Title" motion={false} visible />);
        expect(sidebarContainer(container)).toBeInTheDocument();
    });

    it('有动画时先播放离场动画，再卸载', () => {
        const { container, rerender } = render(<Container title="Title" visible />);
        expect(sidebarContainer(container)).toHaveClass('semi-sidebar-animation-content_show');
        rerender(<Container title="Title" visible={false} />);
        const root = sidebarContainer(container);
        expect(root).toHaveClass('semi-sidebar-animation-content_hide');
        animationEnd(root);
        expect(container).toBeEmptyDOMElement();

        rerender(<Container title="Title" visible />);
        expect(sidebarContainer(container)).toHaveClass('semi-sidebar-animation-content_show');
    });

    it('离场动画期间重新显示时保持挂载', () => {
        const { container, rerender } = render(<Container title="Title" visible />);
        rerender(<Container title="Title" visible={false} />);
        rerender(<Container title="Title" visible />);
        animationEnd(sidebarContainer(container));
        expect(sidebarContainer(container)).toBeInTheDocument();
    });

    it('卸载后不再处理 Escape', () => {
        const onCancel = vi.fn<() => void>();
        const { unmount } = render(<Container title="Title" closeOnEsc motion={false} visible onCancel={onCancel} />);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
        unmount();
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('仅在设置 closeOnEsc 时按 Escape 关闭', () => {
        const onCancel = vi.fn<() => void>();
        const { rerender } = render(<Container title="Title" visible onCancel={onCancel} />);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).not.toHaveBeenCalled();
        rerender(<Container title="Title" closeOnEsc visible onCancel={onCancel} />);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('根元素被命名时为 group，使用方的 role 优先', () => {
        const { container } = render(<Container aria-label="Sources" visible />);
        expect(sidebarContainer(container)).toHaveAttribute('role', 'group');
        const own = render(<Container aria-label="S" role="tabpanel" visible />);
        expect(sidebarContainer(own.container)).toHaveAttribute('role', 'tabpanel');
        const unnamed = render(<Container visible />);
        expect(sidebarContainer(unnamed.container)).not.toHaveAttribute('role');
    });

    it.each([true, false])('关闭后焦点回到打开前聚焦的元素，焦点已移到页面其他位置时保持（motion=%s）', (motion) => {
        const Host = ({ visible }: { visible: boolean }) => (
            <>
                <button type="button">opener</button>
                <button type="button">other</button>
                <Container title="Title" motion={motion} visible={visible} />
            </>
        );
        const { rerender } = render(<Host visible={false} />);
        const opener = screen.getByRole('button', { name: 'opener' });
        opener.focus();
        rerender(<Host visible />);
        screen.getByRole('button', { name: zh_CN.Sidebar.close }).focus();
        rerender(<Host visible={false} />);
        expect(opener).toHaveFocus();

        rerender(<Host visible />);
        const other = screen.getByRole('button', { name: 'other' });
        other.focus();
        rerender(<Host visible={false} />);
        expect(other).toHaveFocus();
    });

    it('初始可见的容器在挂载后立即关闭，焦点回到挂载前聚焦的元素', () => {
        const opener = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const { rerender } = render(
            <Container motion={false} visible>
                <input />
            </Container>
        );
        screen.getByRole('textbox').focus();
        rerender(
            <Container motion={false} visible={false}>
                <input />
            </Container>
        );
        expect(opener).toHaveFocus();
        opener.remove();
    });

    it('afterVisibleChange 报告显示，并在离场动画结束后报告隐藏', () => {
        const afterVisibleChange = vi.fn<(visible: boolean) => void>();
        const { container, rerender } = render(<Container title="Title" afterVisibleChange={afterVisibleChange} />);
        expect(afterVisibleChange).not.toHaveBeenCalled();
        rerender(<Container title="Title" afterVisibleChange={afterVisibleChange} visible />);
        expect(afterVisibleChange).toHaveBeenLastCalledWith(true);
        rerender(<Container title="Title" afterVisibleChange={afterVisibleChange} visible={false} />);
        expect(afterVisibleChange).toHaveBeenCalledTimes(1);
        animationEnd(sidebarContainer(container));
        expect(afterVisibleChange).toHaveBeenLastCalledWith(false);
        expect(afterVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('StrictMode 下渲染', () => {
        const { container } = render(
            <StrictMode>
                <Container title="Title" visible>
                    content
                </Container>
            </StrictMode>
        );
        expect(sidebarContainer(container)).toHaveTextContent('content');
    });

    it('StrictMode 下首次可见挂载时，autoFocus 的内容保持焦点；真正卸载后焦点回到挂载前的元素', () => {
        const opener = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const { unmount } = render(
            <StrictMode>
                <Container motion={false} visible>
                    <input autoFocus />
                </Container>
            </StrictMode>
        );
        expect(screen.getByRole('textbox')).toHaveFocus();
        unmount();
        return Promise.resolve().then(() => {
            expect(opener).toHaveFocus();
            opener.remove();
        });
    });
});

describe('Sidebar', () => {
    afterEach(() => {
        Core.instances.length = 0;
    });

    it('类型与运行时一致：不接受被忽略的 onChange，detailContent 不是 any，选项的 icon 可省略', () => {
        expectTypeOf<SideBarProps>().not.toHaveProperty('onChange');
        expectTypeOf<NonNullable<SideBarProps['detailContent']>>().not.toBeAny();
        expectTypeOf<{ name: string; key: string }>().toExtend<Option>();
    });

    it('类型：renderDetailHeader 可能收不到 detailContent；detailContent 不接受由 Sidebar 属性提供的字段', () => {
        expectTypeOf<Parameters<NonNullable<SideBarProps['renderDetailHeader']>>>().toEqualTypeOf<[mode: string, detailContent?: SideBarProps['detailContent']]>();
        // @ts-expect-error Sidebar sets editable, imgUploadProps and onContentChange from its own props
        const detail: SideBarProps['detailContent'] = { name: 'a.md', onContentChange: () => {} };
        expect(detail.name).toBe('a.md');
    });

    it('main 模式显示标题、选项，以及当前激活 key 对应的 renderMainContent', () => {
        const renderMainContent = vi.fn<NonNullable<SideBarProps['renderMainContent']>>((key) => <div className="main-content">{`content of ${key}`}</div>);
        const { container } = render(<Sidebar className="custom" title="Sidebar title" activeKey="file" options={options} visible renderMainContent={renderMainContent} />);
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
        render(<Sidebar options={options} visible onActiveOptionChange={onActiveOptionChange} />);
        fireEvent.click(screen.getByText('Code'));
        expect(onActiveOptionChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), 'code');
    });

    it('renderOptionItem 渲染每个选项，并接收切换处理函数', () => {
        const onActiveOptionChange = vi.fn<NonNullable<SideBarProps['onActiveOptionChange']>>();
        render(
            <Sidebar
                options={options}
                visible
                renderOptionItem={(option, onChange) => (
                    <button key={option.key} type="button" onClick={(e) => onChange(e, option.key)}>
                        {`custom ${option.name}`}
                    </button>
                )}
                onActiveOptionChange={onActiveOptionChange}
            />
        );
        fireEvent.click(screen.getByText('custom File'));
        expect(onActiveOptionChange).toHaveBeenCalledWith(expect.anything(), 'file');
        expect(document.querySelector('.semi-sidebar-options-button')).toBeNull();
    });

    it('未传 onActiveOptionChange 时，renderOptionItem 收到的切换处理函数仍可调用', () => {
        const handlers: unknown[] = [];
        render(
            <Sidebar
                options={options}
                visible
                renderOptionItem={(option, onChange) => {
                    handlers.push(onChange);
                    return <span key={option.key}>{option.name}</span>;
                }}
            />
        );
        expect(handlers).not.toHaveLength(0);
        for (const handler of handlers) {
            expect(typeof handler).toBe('function');
            expect(() => (handler as () => void)()).not.toThrow();
        }
    });

    it('code 模式显示代码，并用详情头部代替标题', () => {
        const { container } = render(<Sidebar title="Sidebar title" detailContent={codeDetail} mode="code" visible />);
        const root = sidebarContainer(container);
        expect(root).toHaveClass('semi-sidebar-detail');
        expect(root.querySelector('.semi-sidebar-container-header')).toBeNull();
        expect(root.querySelector('.semi-sidebar-detail-header-title')).toHaveTextContent('main.js');
        expect(root.querySelector('.semi-sidebar-code-content')).toHaveTextContent('const a = 1;');
        expect(screen.queryByText('Sidebar title')).toBeNull();
    });

    it('code 模式下 isJson 显示全高只读的 JsonViewer', () => {
        render(<Sidebar detailContent={{ name: 'a.json', isJson: true, content: '{"a":1}' }} mode="code" visible />);
        const core = Core.instances.at(-1);
        expect(core.value).toBe('{"a":1}');
        expect(core.options).toEqual(expect.objectContaining({ readOnly: true, autoWrap: true }));
        expect(document.querySelector('.semi-json-viewer')).toHaveStyle({ height: '100%' });
    });

    it('详情的 jsonViewerProps 传给 JsonViewer，默认仍为全高', () => {
        render(
            <Sidebar
                detailContent={{
                    name: 'a.json',
                    isJson: true,
                    content: '{"a":1}',
                    jsonViewerProps: { className: 'my-json' },
                }}
                mode="code"
                visible
            />
        );
        expect(document.querySelector('.my-json')).toBeInTheDocument();
        expect(document.querySelector('.semi-json-viewer')).toHaveStyle({ height: '100%' });
    });

    it('详情内容不是字符串时不显示复制按钮', () => {
        const { rerender } = render(<Sidebar detailContent={{ name: 'a.js' }} mode="code" visible />);
        expect(screen.queryByRole('button', { name: zh_CN.Sidebar.copy })).toBeNull();
        rerender(<Sidebar detailContent={codeDetail} mode="code" visible />);
        expect(screen.getByRole('button', { name: zh_CN.Sidebar.copy })).toBeInTheDocument();
    });

    it('file 模式显示编辑器，除非 fileEditable 为 false 否则可编辑', () => {
        const fileDetail = { name: 'a.md', content: '<p>file text</p>' };
        const { container, rerender } = render(<Sidebar detailContent={fileDetail} mode="file" visible />);
        expect(container.querySelector('.semi-sidebar-detail-header-title')).toHaveTextContent('a.md');
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeInTheDocument();
        expect(screen.getByText('file text').closest('.ProseMirror')).toHaveAttribute('contenteditable', 'true');

        rerender(<Sidebar detailContent={fileDetail} fileEditable={false} mode="file" visible />);
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeNull();
        expect(container.querySelector('.ProseMirror')).toHaveAttribute('contenteditable', 'false');

        rerender(<Sidebar detailContent={fileDetail} fileEditable mode="file" visible />);
        expect(container.querySelector('.ProseMirror')).toHaveAttribute('contenteditable', 'true');
    });

    it('file 模式通过 onFileContentChange 报告编辑', async () => {
        const onFileContentChange = vi.fn<NonNullable<SideBarProps['onFileContentChange']>>();
        const { container } = render(<Sidebar detailContent={{ name: 'a.md', content: '<p>text</p>' }} mode="file" visible onFileContentChange={onFileContentChange} />);
        const editor = container.querySelector<HTMLElement & { editor: Editor }>('.ProseMirror').editor;
        act(() => {
            editor.commands.selectAll();
        });
        fireEvent.click(container.querySelector('.semi-icon-bold').closest('button'));
        expect(onFileContentChange).toHaveBeenLastCalledWith('<p><strong>text</strong></p>');
    });

    it('没有 detailContent 的详情模式渲染空头部和编辑器', () => {
        // code mode is not used here: CodeHighlight rejects an undefined code asynchronously
        const { container } = render(<Sidebar mode="file" visible />);
        expect(container.querySelector('.semi-sidebar-detail-header-title')).toBeEmptyDOMElement();
        expect(container.querySelector('.ProseMirror')).toHaveTextContent('');
    });

    it('没有内置内容的模式渲染空详情', () => {
        const { container } = render(<Sidebar detailContent={{ name: 'x' }} mode="custom" visible />);
        expect(container.querySelector('.semi-sidebar-container-content')).toBeEmptyDOMElement();
    });

    it('详情关闭按钮以 main 模式调用 onBackWard', () => {
        const onBackWard = vi.fn<NonNullable<SideBarProps['onBackWard']>>();
        const { container } = render(<Sidebar detailContent={codeDetail} mode="code" visible onBackWard={onBackWard} />);
        fireEvent.click(container.querySelector('.semi-sidebar-detail-header-left button'));
        expect(onBackWard).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), 'main');
    });

    it('复制时写入内容，在侧边栏内显示 Toast，并报告成功', async () => {
        const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
        mockClipboard(writeText);
        const onDetailContentCopy = vi.fn<NonNullable<SideBarProps['onDetailContentCopy']>>();
        const { container } = render(<Sidebar detailContent={codeDetail} mode="code" visible onDetailContentCopy={onDetailContentCopy} />);
        fireEvent.click(container.querySelector('.semi-sidebar-detail-header-right button'));
        expect(writeText).toHaveBeenCalledWith('const a = 1;');
        await waitFor(() => expect(onDetailContentCopy).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), 'const a = 1;', true));
        await waitFor(() => expect(sidebarContainer(container)).toHaveTextContent('复制成功'));
        expect(sidebarContainer(container).querySelector('.semi-toast-wrapper')).toBeInTheDocument();
    });

    it('复制失败时报告 false，且不显示 Toast', async () => {
        mockClipboard(vi.fn<(text: string) => Promise<void>>(() => Promise.reject(new Error('denied'))));
        const onDetailContentCopy = vi.fn<NonNullable<SideBarProps['onDetailContentCopy']>>();
        const { container } = render(<Sidebar detailContent={codeDetail} mode="code" visible onDetailContentCopy={onDetailContentCopy} />);
        fireEvent.click(container.querySelector('.semi-sidebar-detail-header-right button'));
        await waitFor(() => expect(onDetailContentCopy).toHaveBeenCalledWith(expect.anything(), 'const a = 1;', false));
        expect(sidebarContainer(container).querySelector('.semi-toast-wrapper')).toBeNull();
    });

    it('renderDetailHeader 和 renderDetailContent 替换内置详情', () => {
        const renderDetailHeader = vi.fn<NonNullable<SideBarProps['renderDetailHeader']>>(() => <div className="my-header">header</div>);
        const renderDetailContent = vi.fn<NonNullable<SideBarProps['renderDetailContent']>>(() => <div className="my-content">content</div>);
        const { container } = render(<Sidebar detailContent={codeDetail} mode="code" visible renderDetailContent={renderDetailContent} renderDetailHeader={renderDetailHeader} />);
        expect(renderDetailHeader).toHaveBeenLastCalledWith('code', codeDetail);
        expect(renderDetailContent).toHaveBeenLastCalledWith('code');
        expect(container.querySelector('.my-header')).toBeInTheDocument();
        expect(container.querySelector('.my-content')).toBeInTheDocument();
        expect(container.querySelector('.semi-sidebar-detail-header')).toBeNull();
        expect(container.querySelector('.semi-sidebar-code-content')).toBeNull();
    });

    it('容器属性透传：onCancel、resizable 和 showClose', () => {
        const onCancel = vi.fn<() => void>();
        const { container, rerender } = render(<Sidebar title="T" visible onCancel={onCancel} />);
        fireEvent.click(screen.getByRole('button', { name: zh_CN.Sidebar.close }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(container.querySelector('.semi-resizable-resizable')).toBeInTheDocument();

        rerender(<Sidebar title="T" resizable={false} showClose={false} visible onCancel={onCancel} />);
        expect(container.querySelector('.semi-resizable-resizable')).toBeNull();
        expect(screen.queryByRole('button', { name: zh_CN.Sidebar.close })).toBeNull();
    });

    it('StrictMode 下渲染', () => {
        const { container } = render(
            <StrictMode>
                <Sidebar detailContent={codeDetail} mode="code" visible />
            </StrictMode>
        );
        expect(container.querySelector('.semi-sidebar-code-content')).toHaveTextContent('const a = 1;');
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
        const onExpand = vi.fn<() => void>();
        const { container } = render(<CodeContent className="custom" style={{ color: 'red' }} activeKey={['b']} codes={codes} onExpand={onExpand} />);
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
        const { container } = render(<CodeContent activeKey={[]} codes={codes} onChange={onChange} onExpand={() => {}} />);
        fireEvent.click(container.querySelectorAll('.semi-sidebar-collapse-header-expand-btn')[0]);
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.click(container.querySelectorAll('.semi-collapse-header-icon')[0]);
        expect(onChange).toHaveBeenCalledWith(['a'], expect.anything());
    });

    it('面板切换按钮以文件名命名，展开按钮位于其外部', () => {
        render(<CodeContent activeKey={[]} codes={codes} onExpand={() => {}} />);
        const toggle = screen.getByRole('button', { name: 'a.js' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(toggle).not.toContainElement(screen.getAllByRole('button', { name: zh_CN.Sidebar.expand })[0]);
    });

    it('未传 onExpand 时不渲染展开按钮', () => {
        render(<CodeContent activeKey={[]} codes={codes} />);
        expect(screen.queryByRole('button', { name: zh_CN.Sidebar.expand })).toBeNull();
    });

    it('CodeItem 透传 codeHighlightProps 和 jsonViewerProps', () => {
        const { container, rerender } = render(<CodeItem codeHighlightProps={{ className: 'my-code' } as CodeItemProps['codeHighlightProps']} content="let a;" language="javascript" />);
        expect(container.querySelector('.my-code')).toHaveTextContent('let a;');
        rerender(<CodeItem content="{}" isJson jsonViewerProps={{ className: 'my-json' }} />);
        expect(container.querySelector('.my-json')).toBeInTheDocument();
    });
});

describe('Sidebar 全局默认值、ref 和透传', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('mode 默认为 main', () => {
        const { container } = render(<Sidebar options={options} visible />);
        expect(sidebarContainer(container)).toHaveClass('semi-sidebar-main');
    });

    it('从 overrideDefaultProps 读取 Sidebar、Annotation 和 MCPConfigure 的默认值', () => {
        semiGlobal.config.overrideDefaultProps = {
            Sidebar: { mode: 'code', resizable: false },
            Annotation: { title: 'Global sources' },
            MCPConfigure: { placeholder: 'Global search' },
        };
        const { container } = render(<Sidebar detailContent={codeDetail} visible />);
        expect(sidebarContainer(container)).toHaveClass('semi-sidebar-detail');
        expect(container.querySelector('.semi-resizable-resizable')).toBeNull();
        render(<Annotation info={[]} visible />);
        expect(screen.getByText('Global sources')).toBeInTheDocument();
        render(<MCPConfigure options={[]} visible />);
        expect(screen.getByPlaceholderText('Global search')).toBeInTheDocument();
    });

    it('ref 和 data-* 落在每个顶层组件的容器 div 上', () => {
        const refs = [createRef<HTMLDivElement>(), createRef<HTMLDivElement>(), createRef<HTMLDivElement>(), createRef<HTMLDivElement>()];
        const { container } = render(
            <>
                <Sidebar ref={refs[0]} data-testid="sidebar" visible />
                <Annotation ref={refs[1]} data-testid="annotation" info={[]} visible />
                <MCPConfigure ref={refs[2]} data-testid="mcp" options={[]} visible />
                <Container ref={refs[3]} data-testid="container" visible />
            </>
        );
        const roots = [...container.querySelectorAll<HTMLElement>('.semi-sidebar-container')];
        expect(roots.map((root) => root.dataset.testid)).toEqual(['sidebar', 'annotation', 'mcp', 'container']);
        expect(refs.map((ref) => ref.current)).toEqual(roots);
    });

    it('Container 同时设置 ref 和 containerRef', () => {
        const ref = vi.fn<(element: HTMLDivElement | null) => void>();
        const containerRef = createRef<HTMLDivElement>();
        const { container, unmount } = render(<Container ref={ref} containerRef={containerRef} visible />);
        expect(ref).toHaveBeenLastCalledWith(sidebarContainer(container));
        expect(containerRef.current).toBe(sidebarContainer(container));
        unmount();
        expect(ref).toHaveBeenLastCalledWith(null);
        expect(containerRef.current).toBeNull();
    });

    it('Annotation 和 MCPConfigure 把 showClose 和 renderHeader 传给容器', () => {
        const { container } = render(
            <>
                <Annotation info={[]} showClose={false} visible />
                <MCPConfigure options={[]} visible renderHeader={() => <div className="mcp-header">h</div>} />
            </>
        );
        expect(screen.queryAllByRole('button', { name: zh_CN.Sidebar.close })).toEqual([]);
        expect(container.querySelector('.mcp-header')).toBeInTheDocument();
    });

    it('仅组件使用的属性不进入 DOM', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = render(
            <>
                <Annotation info={[]} visible renderItem={() => null} onClick={() => {}} />
                <MCPConfigure filter={() => true} options={[]} visible onSearch={() => {}} />
                <Container afterVisibleChange={() => {}} closeOnEsc visible />
            </>
        );
        for (const root of container.querySelectorAll('.semi-sidebar-container')) {
            expect(root.getAttributeNames().filter((name) => name !== 'class' && name !== 'style')).toEqual([]);
        }
        expect(error).not.toHaveBeenCalled();
        error.mockRestore();
    });

    it('主模式选项按钮用 aria-pressed 暴露当前选项', () => {
        const { rerender } = render(<Sidebar activeKey="file" options={options} visible />);
        expect(screen.getByRole('button', { name: 'File' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'false');
        rerender(<Sidebar activeKey="code" options={options} visible />);
        expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'File' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('隐藏后再显示，复制提示出现在新的容器里，隐藏时旧提示被销毁', async () => {
        mockClipboard(vi.fn<(text: string) => Promise<void>>(() => Promise.resolve()));
        const ui = (visible) => <Sidebar detailContent={codeDetail} mode="code" visible={visible} />;
        const { container, rerender } = render(ui(true));
        fireEvent.click(container.querySelector('.semi-sidebar-detail-header-right button'));
        await waitFor(() => expect(sidebarContainer(container)).toHaveTextContent('复制成功'));

        rerender(ui(false));
        animationEnd(sidebarContainer(container));
        expect(document.querySelector('.semi-toast-wrapper')).toBeNull();

        rerender(ui(true));
        fireEvent.click(container.querySelector('.semi-sidebar-detail-header-right button'));
        await waitFor(() => expect(sidebarContainer(container)).toHaveTextContent('复制成功'));
    });

    it('Esc 监听在 StrictMode 下正常工作，隐藏后停止', () => {
        const onCancel = vi.fn<() => void>();
        const { rerender } = render(
            <StrictMode>
                <Container closeOnEsc motion={false} visible onCancel={onCancel} />
            </StrictMode>
        );
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);

        rerender(
            <StrictMode>
                <Container closeOnEsc motion={false} visible={false} onCancel={onCancel} />
            </StrictMode>
        );
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('切换 main 与详情模式后，焦点交给返回按钮或当前选项，而不是掉到 body', () => {
        function Host() {
            const [mode, setMode] = useState('main');
            return <Sidebar activeKey="code" detailContent={codeDetail} mode={mode} options={options} visible onActiveOptionChange={() => setMode('code')} onBackWard={(_, next) => setMode(next)} />;
        }
        const { container } = render(<Host />);
        const option = screen.getByRole('button', { name: 'Code' });
        option.focus();
        fireEvent.click(option);
        expect(container.querySelector('.semi-sidebar-detail-header-left button')).toHaveFocus();

        fireEvent.click(container.querySelector('.semi-sidebar-detail-header-left button'));
        expect(screen.getByRole('button', { name: 'Code' })).toHaveFocus();
    });

    it('切换模式时，用户已移到别处的焦点保持不动', () => {
        const outside = document.body.appendChild(document.createElement('button'));
        const { rerender } = render(<Sidebar detailContent={codeDetail} mode="main" options={options} visible />);
        outside.focus();
        rerender(<Sidebar detailContent={codeDetail} mode="code" options={options} visible />);
        expect(outside).toHaveFocus();
        outside.remove();
    });
});

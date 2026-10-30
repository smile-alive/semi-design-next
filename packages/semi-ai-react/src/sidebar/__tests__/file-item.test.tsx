import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Extension, type Mark, type Node } from '@tiptap/core';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Sidebar } from '@fibrae/semi-ai-react';
import { Toast } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { UploadProps } from '@fibrae/semi-ui-react/upload/index';
import type { FileItemProps } from '../widget/file';

const { FileItem, FileContent } = Sidebar;

// tiptap destroys an unmounted editor on a 1ms timer, so StrictMode's discarded instance can be told apart
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 10)));

// a documented `extensions` entry that hands out every editor FileItem creates
function captureEditors() {
    const editors = [];
    const extension = Extension.create({
        name: 'captureEditor',
        onCreate() {
            editors.push(this.editor);
        },
    });
    return { editors, extension };
}

const menuButton = (container, icon) => container.querySelector(`.semi-icon-${icon}`).closest('button');

describe('Sidebar.FileItem', () => {
    afterEach(() => {
        Toast.destroyAll();
    });

    it('内容渲染在带菜单栏的可编辑编辑器中', () => {
        const { container } = render(<FileItem className="custom" style={{ color: 'red' }} content="<p>hello</p>" />);
        const root = container.querySelector('.semi-sidebar-file');
        expect(root).toHaveClass('custom');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeInTheDocument();
        const editor = container.querySelector('.semi-sidebar-file-editor .ProseMirror');
        expect(editor).toHaveTextContent('hello');
        expect(editor).toHaveAttribute('contenteditable', 'true');
    });

    it('editable={false} 时隐藏菜单栏，编辑器只读', () => {
        const { container } = render(<FileItem content="<p>hello</p>" editable={false} />);
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeNull();
        expect(container.querySelector('.ProseMirror')).toHaveAttribute('contenteditable', 'false');
    });

    it('通过 onContentChange 以 HTML 报告编辑内容，始终调用最新的回调', async () => {
        const { editors, extension } = captureEditors();
        const first = vi.fn<(html: string) => void>();
        const second = vi.fn<(html: string) => void>();
        const { rerender } = render(<FileItem content="<p>a</p>" extensions={[extension]} onContentChange={first} />);
        await settle();
        const editor = editors.at(-1);
        act(() => {
            editor.commands.insertContentAt(editor.state.doc.content.size - 1, 'b');
        });
        expect(first).toHaveBeenLastCalledWith('<p>ab</p>');

        rerender(<FileItem content="<p>a</p>" extensions={[extension]} onContentChange={second} />);
        act(() => {
            editor.commands.insertContentAt(editor.state.doc.content.size - 1, 'c');
        });
        expect(second).toHaveBeenLastCalledWith('<p>abc</p>');
        expect(first).toHaveBeenCalledTimes(1);
    });

    it('挂载后跟随 content 属性更新，但不报告为编辑', async () => {
        const onContentChange = vi.fn<(html: string) => void>();
        const { container, rerender } = render(<FileItem content="<p>first</p>" onContentChange={onContentChange} />);
        rerender(<FileItem content="<p>second</p>" onContentChange={onContentChange} />);
        await settle();
        expect(container.querySelector('.ProseMirror')).toHaveTextContent('second');
        expect(onContentChange).not.toHaveBeenCalled();
        rerender(<FileItem content={undefined} onContentChange={onContentChange} />);
        expect(container.querySelector('.ProseMirror')).toHaveTextContent('');
    });

    it('content 属性回传输入内容时保留文档和光标', async () => {
        const { editors, extension } = captureEditors();
        let latest = '<p>ab</p>';
        const onContentChange = vi.fn<(html: string) => void>((html) => {
            latest = html;
        });
        const { rerender } = render(<FileItem content={latest} extensions={[extension]} onContentChange={onContentChange} />);
        await settle();
        const editor = editors.at(-1);
        act(() => {
            editor.commands.setTextSelection(2);
            editor.commands.insertContent('X');
        });
        expect(latest).toBe('<p>aXb</p>');
        const { doc, selection } = editor.state;
        rerender(<FileItem content={latest} extensions={[extension]} onContentChange={onContentChange} />);
        expect(editor.state.doc).toBe(doc);
        expect(editor.state.selection.from).toBe(selection.from);
    });

    it('挂载后 editable 属性同时作用于菜单栏和编辑器', async () => {
        const { container, rerender } = render(<FileItem content="<p>text</p>" editable={false} />);
        const editor = () => container.querySelector('.ProseMirror');
        expect(editor()).toHaveAttribute('contenteditable', 'false');
        rerender(<FileItem content="<p>text</p>" editable />);
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeInTheDocument();
        await waitFor(() => expect(editor()).toHaveAttribute('contenteditable', 'true'));
        rerender(<FileItem content="<p>text</p>" editable={false} />);
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeNull();
        await waitFor(() => expect(editor()).toHaveAttribute('contenteditable', 'false'));
    });

    it('editable 变化不报告为编辑', async () => {
        const onContentChange = vi.fn<(html: string) => void>();
        const { rerender } = render(<FileItem content="<p>text</p>" onContentChange={onContentChange} />);
        rerender(<FileItem content="<p>text</p>" editable={false} onContentChange={onContentChange} />);
        await settle();
        expect(onContentChange).not.toHaveBeenCalled();
    });

    it('卸载时销毁编辑器', async () => {
        const { editors, extension } = captureEditors();
        const { unmount } = render(<FileItem content="<p>a</p>" extensions={[extension]} />);
        await settle();
        const editor = editors.at(-1);
        expect(editor.isDestroyed).toBe(false);
        unmount();
        await settle();
        expect(editor.isDestroyed).toBe(true);
    });

    it('StrictMode 下只保留一个存活的编辑器', async () => {
        const { editors, extension } = captureEditors();
        const onContentChange = vi.fn<(html: string) => void>();
        const { container } = render(
            <StrictMode>
                <FileItem content="<p>a</p>" extensions={[extension]} onContentChange={onContentChange} />
            </StrictMode>
        );
        await settle();
        expect(container.querySelectorAll('.ProseMirror')).toHaveLength(1);
        const live = editors.filter((editor) => !editor.isDestroyed);
        expect(live).toHaveLength(1);
        act(() => {
            live[0].commands.insertContentAt(live[0].state.doc.content.size - 1, 'b');
        });
        expect(onContentChange).toHaveBeenLastCalledWith('<p>ab</p>');
        expect(container.querySelector('.ProseMirror')).toHaveTextContent('ab');
    });

    it('菜单栏按钮执行编辑器命令，并反映当前激活的标记', async () => {
        const { editors, extension } = captureEditors();
        const onContentChange = vi.fn<(html: string) => void>();
        const { container } = render(<FileItem content="<p>text</p>" extensions={[extension]} onContentChange={onContentChange} />);
        await settle();
        const editor = editors.at(-1);
        expect(menuButton(container, 'undo')).toBeDisabled();
        act(() => {
            editor.commands.selectAll();
        });
        fireEvent.click(menuButton(container, 'bold'));
        expect(onContentChange).toHaveBeenLastCalledWith('<p><strong>text</strong></p>');
        expect(menuButton(container, 'bold')).toHaveClass('semi-sidebar-file-menu-bar-btn-active');
        expect(menuButton(container, 'undo')).not.toBeDisabled();

        fireEvent.click(menuButton(container, 'list'));
        expect(onContentChange).toHaveBeenLastCalledWith('<ul><li><p><strong>text</strong></p></li></ul><p></p>');
        fireEvent.click(menuButton(container, 'undo'));
        expect(onContentChange).toHaveBeenLastCalledWith('<p><strong>text</strong></p>');
    });

    // the trailing paragraph comes from the trailing-node extension
    it.each([
        ['bold', (c) => menuButton(c, 'bold'), '<p><strong>text</strong></p>'],
        ['italic', (c) => menuButton(c, 'italic'), '<p><em>text</em></p>'],
        ['strike', (c) => menuButton(c, 'strike_through'), '<p><s>text</s></p>'],
        ['code', (c) => menuButton(c, 'code'), '<p><code>text</code></p>'],
        ['bullet list', (c) => menuButton(c, 'list'), '<ul><li><p>text</p></li></ul><p></p>'],
        ['ordered list', (c) => menuButton(c, 'ordered_list'), '<ol><li><p>text</p></li></ol><p></p>'],
        ['blockquote', (c) => menuButton(c, 'quote'), '<blockquote><p>text</p></blockquote><p></p>'],
        ['code block', (c) => menuButton(c, 'terminal'), '<pre><code>text</code></pre><p></p>'],
        ['horizontal rule', (c) => menuButton(c, 'minus'), '<hr><p></p>'],
        ['align center', (c) => menuButton(c, 'align_center'), '<p style="text-align: center;">text</p>'],
        ['align right', (c) => menuButton(c, 'align_right'), '<p style="text-align: right;">text</p>'],
        ['align justify', (c) => menuButton(c, 'align_justify'), '<p style="text-align: justify;">text</p>'],
    ])('%s 按钮对选区进行格式化', async (_name, getButton, html) => {
        const { editors, extension } = captureEditors();
        const onContentChange = vi.fn<(html: string) => void>();
        const { container } = render(<FileItem content="<p>text</p>" extensions={[extension]} onContentChange={onContentChange} />);
        await settle();
        act(() => {
            editors.at(-1).commands.selectAll();
        });
        fireEvent.click(getButton(container));
        expect(onContentChange).toHaveBeenLastCalledWith(html);
    });

    it('左对齐按钮会移除其他对齐方式', async () => {
        const { editors, extension } = captureEditors();
        const onContentChange = vi.fn<(html: string) => void>();
        const { container } = render(<FileItem content='<p style="text-align: right;">text</p>' extensions={[extension]} onContentChange={onContentChange} />);
        await settle();
        act(() => {
            editors.at(-1).commands.selectAll();
        });
        expect(menuButton(container, 'align_right')).toHaveClass('semi-sidebar-file-menu-bar-btn-active');
        fireEvent.click(menuButton(container, 'align_left'));
        expect(onContentChange).toHaveBeenLastCalledWith('<p style="text-align: left;">text</p>');
    });

    it('段落按钮可将标题恢复为段落，Hn 菜单可设置标题级别', async () => {
        const { editors, extension } = captureEditors();
        const onContentChange = vi.fn<(html: string) => void>();
        const { container } = render(<FileItem content="<p>text</p>" extensions={[extension]} onContentChange={onContentChange} />);
        await settle();
        act(() => {
            editors.at(-1).commands.selectAll();
        });
        fireEvent.mouseEnter(menuButton(container, 'hn'));
        const h3 = await waitFor(() => {
            const icon = document.querySelector('.semi-icon-h3');
            expect(icon).toBeInTheDocument();
            return icon;
        });
        fireEvent.click(h3);
        expect(onContentChange).toHaveBeenLastCalledWith('<h3>text</h3><p></p>');
        act(() => {
            editors.at(-1).commands.setTextSelection(2);
        });
        await waitFor(() => expect(menuButton(container, 'hn')).toHaveClass('semi-sidebar-file-menu-bar-btn-active'));

        fireEvent.click(menuButton(container, 'text'));
        expect(onContentChange).toHaveBeenLastCalledWith('<p>text</p><p></p>');
        await waitFor(() => expect(menuButton(container, 'text')).toHaveClass('semi-sidebar-file-menu-bar-btn-active'));
    });

    it('重做按钮重新应用已撤销的修改', async () => {
        const { editors, extension } = captureEditors();
        const onContentChange = vi.fn<(html: string) => void>();
        const { container } = render(<FileItem content="<p>text</p>" extensions={[extension]} onContentChange={onContentChange} />);
        await settle();
        act(() => {
            editors.at(-1).commands.selectAll();
        });
        expect(menuButton(container, 'redo')).toBeDisabled();
        fireEvent.click(menuButton(container, 'bold'));
        fireEvent.click(menuButton(container, 'undo'));
        expect(menuButton(container, 'redo')).not.toBeDisabled();
        fireEvent.click(menuButton(container, 'redo'));
        expect(onContentChange).toHaveBeenLastCalledWith('<p><strong>text</strong></p>');
    });

    it.each([
        ['Mod-b makes the selection bold', { key: 'b', ctrlKey: true }, '<p><strong>text</strong></p>'],
        ['Mod-i makes the selection italic', { key: 'i', ctrlKey: true }, '<p><em>text</em></p>'],
        ['Mod-Shift-s strikes the selection through', { key: 'S', keyCode: 83, ctrlKey: true, shiftKey: true }, '<p><s>text</s></p>'],
        ['Mod-e marks the selection as code', { key: 'e', ctrlKey: true }, '<p><code>text</code></p>'],
        ['Mod-Shift-8 makes a bullet list', { key: '8', code: 'Digit8', ctrlKey: true, shiftKey: true }, '<ul><li><p>text</p></li></ul><p></p>'],
        ['Mod-Shift-7 makes an ordered list', { key: '7', code: 'Digit7', ctrlKey: true, shiftKey: true }, '<ol><li><p>text</p></li></ol><p></p>'],
        ['Mod-Shift-b makes a blockquote', { key: 'B', keyCode: 66, ctrlKey: true, shiftKey: true }, '<blockquote><p>text</p></blockquote><p></p>'],
        ['Mod-Alt-c makes a code block', { key: 'c', code: 'KeyC', ctrlKey: true, altKey: true }, '<pre><code>text</code></pre><p></p>'],
        ['Mod-Alt-2 makes a level 2 heading', { key: '2', code: 'Digit2', ctrlKey: true, altKey: true }, '<h2>text</h2><p></p>'],
    ])('%s', async (_name, event, html) => {
        const { editors, extension } = captureEditors();
        const onContentChange = vi.fn<(html: string) => void>();
        const { container } = render(<FileItem content="<p>text</p>" extensions={[extension]} onContentChange={onContentChange} />);
        await settle();
        act(() => {
            editors.at(-1).commands.selectAll();
        });
        fireEvent.keyDown(container.querySelector('.ProseMirror'), event);
        expect(onContentChange).toHaveBeenLastCalledWith(html);
    });

    it('Mod-z 撤销，Mod-Shift-z 重做', async () => {
        const { editors, extension } = captureEditors();
        const onContentChange = vi.fn<(html: string) => void>();
        const { container } = render(<FileItem content="<p>text</p>" extensions={[extension]} onContentChange={onContentChange} />);
        await settle();
        act(() => {
            editors.at(-1).commands.selectAll();
        });
        fireEvent.click(menuButton(container, 'bold'));
        const editor = container.querySelector('.ProseMirror');
        fireEvent.keyDown(editor, { key: 'z', ctrlKey: true });
        expect(onContentChange).toHaveBeenLastCalledWith('<p>text</p>');
        fireEvent.keyDown(editor, { key: 'Z', keyCode: 90, ctrlKey: true, shiftKey: true });
        expect(onContentChange).toHaveBeenLastCalledWith('<p><strong>text</strong></p>');
    });

    it('Shift-Enter 插入换行，Enter 拆分段落', async () => {
        const { editors, extension } = captureEditors();
        const onContentChange = vi.fn<(html: string) => void>();
        const { container } = render(<FileItem content="<p>ab</p>" extensions={[extension]} onContentChange={onContentChange} />);
        await settle();
        act(() => {
            editors.at(-1).commands.setTextSelection(2);
        });
        const editor = container.querySelector('.ProseMirror');
        fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true });
        expect(onContentChange).toHaveBeenLastCalledWith('<p>a<br>b</p>');
        fireEvent.keyDown(editor, { key: 'Enter' });
        expect(onContentChange).toHaveBeenLastCalledWith('<p>a<br></p><p>b</p>');
    });

    it('能解析菜单栏可产生的每种格式的 HTML', async () => {
        const html = '<h2>h</h2><p><strong>b</strong><em>i</em><s>s</s><code>c</code><a href="https://semi.design">l</a></p>' + '<ul><li><p>u</p></li></ul><ol><li><p>o</p></li></ol><blockquote><p>q</p></blockquote>' + '<pre><code>k</code></pre><hr><p style="text-align: center">m</p>';
        const { editors, extension } = captureEditors();
        render(<FileItem content={html} editable={false} extensions={[extension]} />);
        await settle();
        const names = new Set<string>();
        editors.at(-1).state.doc.descendants((node) => {
            names.add(node.type.name);
            node.marks.forEach((mark) => names.add(mark.type.name));
        });
        expect([...names].toSorted((a, b) => a.localeCompare(b))).toEqual(['blockquote', 'bold', 'bulletList', 'code', 'codeBlock', 'heading', 'horizontalRule', 'italic', 'link', 'listItem', 'orderedList', 'paragraph', 'strike', 'text'].toSorted());
    });

    it('为选区添加链接并显示 Toast', async () => {
        const { editors, extension } = captureEditors();
        const onContentChange = vi.fn<(html: string) => void>();
        const { container } = render(<FileItem content="<p>text</p>" extensions={[extension]} onContentChange={onContentChange} />);
        await settle();
        act(() => {
            editors.at(-1).commands.selectAll();
        });
        fireEvent.click(menuButton(container, 'link'));
        const input = await screen.findByPlaceholderText('输入链接地址');
        fireEvent.change(input, { target: { value: 'https://semi.design' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onContentChange).toHaveBeenLastCalledWith(expect.stringContaining('<a target="_blank" rel="noopener noreferrer nofollow" href="https://semi.design">'));
        expect(await screen.findByText('已添加链接')).toBeInTheDocument();
    });

    it('全局 Input 默认值不给链接输入框加清除按钮与前后缀', async () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true, prefix: 'x', suffix: 'y', insetLabel: 'l', addonBefore: 'b', addonAfter: 'a' } };
        try {
            const { container } = render(<FileItem content="<p>text</p>" />);
            await settle();
            fireEvent.click(menuButton(container, 'link'));
            const input = await screen.findByPlaceholderText('输入链接地址');
            fireEvent.change(input, { target: { value: 'https://semi.design' } });
            const wrapper = input.closest('.semi-input-wrapper');
            expect(wrapper.querySelector('.semi-input-clearbtn, .semi-input-prefix, .semi-input-suffix, .semi-input-prepend, .semi-input-append')).toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('打开链接下拉时的选区高亮不报告为编辑，也不进入撤销栈；确认后撤销一步即回到原文', async () => {
        const { editors, extension } = captureEditors();
        const onContentChange = vi.fn<(html: string) => void>();
        const { container } = render(<FileItem content="<p>text</p>" extensions={[extension]} onContentChange={onContentChange} />);
        await settle();
        const editor = editors.at(-1);
        act(() => {
            editor.commands.selectAll();
        });
        fireEvent.click(menuButton(container, 'link'));
        const input = await screen.findByPlaceholderText('输入链接地址');
        expect(editor.getHTML()).toContain('class="select"');
        expect(onContentChange).not.toHaveBeenCalled();
        expect(editor.can().undo()).toBe(false);

        fireEvent.change(input, { target: { value: 'https://semi.design' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onContentChange).toHaveBeenCalledTimes(1);
        expect(onContentChange.mock.calls[0][0]).not.toContain('select');
        act(() => {
            editor.commands.undo();
        });
        expect(editor.getHTML()).toBe('<p>text</p>');
    });

    it('选中全文后关闭链接下拉，不会把高亮残留在文档里', async () => {
        const { editors, extension } = captureEditors();
        const onContentChange = vi.fn<(html: string) => void>();
        const { container } = render(<FileItem content="<p>text</p>" extensions={[extension]} onContentChange={onContentChange} />);
        await settle();
        const editor = editors.at(-1);
        act(() => {
            editor.commands.selectAll();
        });
        fireEvent.click(menuButton(container, 'link'));
        await screen.findByPlaceholderText('输入链接地址');
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(screen.queryByPlaceholderText('输入链接地址')).toBeNull());
        expect(editor.getHTML()).toBe('<p>text</p>');
        expect(onContentChange).not.toHaveBeenCalled();
        expect(editor.can().undo()).toBe(false);
    });

    it('链接地址不被允许时，不提示成功、不关闭下拉，文档里没有残留的空链接', async () => {
        const { editors, extension } = captureEditors();
        const { container } = render(<FileItem content="<p>text</p>" extensions={[extension]} />);
        await settle();
        const editor = editors.at(-1);
        for (const collapsed of [false, true]) {
            act(() => {
                if (collapsed) {
                    editor.commands.setTextSelection(2);
                } else {
                    editor.commands.selectAll();
                }
            });
            fireEvent.click(menuButton(container, 'link'));
            const input = await screen.findByPlaceholderText('输入链接地址');
            fireEvent.change(input, { target: { value: 'javascript:alert(1)' } });
            fireEvent.keyDown(input, { key: 'Enter' });
            expect(screen.queryByText('已添加链接')).toBeNull();
            expect(screen.getByPlaceholderText('输入链接地址')).toBeInTheDocument();
            expect(editor.getHTML()).not.toMatch(/<a |javascript/);
            fireEvent.mouseDown(document.body);
            await waitFor(() => expect(screen.queryByPlaceholderText('输入链接地址')).toBeNull());
        }
    });

    it('链接输入框在输入法组合期间按 Enter 不确认链接', async () => {
        const { editors, extension } = captureEditors();
        const { container } = render(<FileItem content="<p>text</p>" extensions={[extension]} />);
        await settle();
        act(() => {
            editors.at(-1).commands.selectAll();
        });
        fireEvent.click(menuButton(container, 'link'));
        const input = await screen.findByPlaceholderText('输入链接地址');
        fireEvent.change(input, { target: { value: 'https://semi.design' } });
        fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
        expect(screen.queryByText('已添加链接')).toBeNull();
        expect(editors.at(-1).getHTML()).not.toContain('<a ');
    });

    it('文档以非段落结尾时，仅聚焦编辑器不报告为编辑', async () => {
        const { editors, extension } = captureEditors();
        const onContentChange = vi.fn<(html: string) => void>();
        render(<FileItem content="<ul><li><p>a</p></li></ul>" extensions={[extension]} onContentChange={onContentChange} />);
        await settle();
        act(() => {
            editors.at(-1).commands.focus();
        });
        await settle();
        expect(onContentChange).not.toHaveBeenCalled();
    });

    it('引用按钮在引用内再次点击时取消引用，而不是嵌套', async () => {
        const { editors, extension } = captureEditors();
        const { container } = render(<FileItem content="<blockquote><p>q</p></blockquote>" extensions={[extension]} />);
        await settle();
        act(() => {
            editors.at(-1).commands.setTextSelection(3);
        });
        const quote = screen.getByRole('button', { name: zh_CN.Sidebar.blockquote });
        await waitFor(() => expect(quote).toHaveAttribute('aria-pressed', 'true'));
        fireEvent.click(quote);
        expect(container.querySelector('blockquote')).toBeNull();
        expect(editors.at(-1).getHTML()).toContain('<p>q</p>');
    });

    it('没有配置上传地址或 customRequest 时不显示图片按钮', async () => {
        const { rerender } = render(<FileItem content="<p>text</p>" />);
        await settle();
        expect(screen.queryByRole('button', { name: zh_CN.Sidebar.image })).toBeNull();
        // The upload node reads imgUploadProps when the editor is created, so a later prop must not add a button that posts to "undefined"
        rerender(<FileItem content="<p>text</p>" imgUploadProps={{ action: 'https://semi.design/upload' }} />);
        await settle();
        expect(screen.queryByRole('button', { name: zh_CN.Sidebar.image })).toBeNull();
        rerender(<FileItem key="remounted" content="<p>text</p>" imgUploadProps={{ action: 'https://semi.design/upload' }} />);
        await settle();
        expect(screen.getByRole('button', { name: zh_CN.Sidebar.image })).toBeInTheDocument();
    });

    it('上传位所在节点已删除时，上传成功后不再插入图片', async () => {
        const { editors, extension } = captureEditors();
        let succeed: () => void;
        const customRequest = vi.fn<NonNullable<UploadProps['customRequest']>>(({ onSuccess }) => {
            succeed = () => onSuccess({ src: 'https://semi.design/late.png' });
        });
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local');
        const { container } = render(<FileItem content="<p>text</p>" extensions={[extension]} imgUploadProps={{ action: 'x', customRequest }} />);
        await settle();
        fireEvent.click(menuButton(container, 'image'));
        const input = await waitFor(() => {
            const el = container.querySelector('.tiptap-image-slot input[type="file"]');
            expect(el).toBeInTheDocument();
            return el;
        });
        fireEvent.change(input, { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
        await waitFor(() => expect(customRequest).toHaveBeenCalled());
        act(() => {
            editors.at(-1).commands.setContent('<p>other</p>');
        });
        await settle();
        act(() => succeed());
        await settle();
        expect(editors.at(-1).getHTML()).toBe('<p>other</p>');
    });

    it('为菜单栏按钮命名，且只有切换按钮暴露按下状态', async () => {
        const { editors, extension } = captureEditors();
        render(<FileItem content="<p>text</p>" extensions={[extension]} imgUploadProps={{ action: 'https://semi.design/upload' }} />);
        await settle();
        const { Sidebar: locale } = zh_CN;
        expect(screen.getByRole('button', { name: locale.undo })).not.toHaveAttribute('aria-pressed');
        expect(screen.getByRole('button', { name: locale.redo })).not.toHaveAttribute('aria-pressed');
        expect(screen.getByRole('button', { name: locale.heading })).not.toHaveAttribute('aria-pressed');
        expect(screen.getByRole('button', { name: locale.link })).not.toHaveAttribute('aria-pressed');
        expect(screen.getByRole('button', { name: locale.image })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: locale.alignLeft })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: locale.codeBlock })).toHaveAttribute('aria-pressed', 'false');
        // icon only like its siblings: visible text outside the name breaks WCAG 2.5.3 label in name
        expect(screen.getByRole('button', { name: locale.codeBlock }).textContent).toBe('');
        const bold = screen.getByRole('button', { name: locale.bold });
        expect(bold).toHaveAttribute('aria-pressed', 'false');
        act(() => {
            editors.at(-1).commands.selectAll();
        });
        fireEvent.click(bold);
        await waitFor(() => expect(bold).toHaveAttribute('aria-pressed', 'true'));
    });

    it('为 Hn 菜单中的标题级别项命名', async () => {
        const { container } = render(<FileItem content="<p>text</p>" />);
        await settle();
        fireEvent.mouseEnter(menuButton(container, 'hn'));
        const h3 = await screen.findByRole('menuitem', { name: zh_CN.Sidebar.headingLevel.replace('${level}', '3') });
        expect(h3).toBeInTheDocument();
    });

    it('getUploadImageSrc 收到上传响应，返回值成为插入图片的 src', async () => {
        const getUploadImageSrc = vi.fn<(response: { url: string }) => string>((response) => response.url);
        const customRequest = vi.fn<NonNullable<UploadProps['customRequest']>>(({ onSuccess }) => onSuccess({ url: 'https://semi.design/uploaded.png' }));
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local');
        const { container } = render(<FileItem content="<p>text</p>" imgUploadProps={{ action: 'x', customRequest, getUploadImageSrc }} />);
        await settle();
        fireEvent.click(menuButton(container, 'image'));
        const input = await waitFor(() => {
            const el = container.querySelector('.tiptap-image-slot input[type="file"]');
            expect(el).toBeInTheDocument();
            return el;
        });
        fireEvent.change(input, { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
        await waitFor(() => expect(container.querySelector('.ProseMirror img')).toHaveAttribute('src', 'https://semi.design/uploaded.png'));
        expect(getUploadImageSrc).toHaveBeenCalledExactlyOnceWith({ url: 'https://semi.design/uploaded.png' });
    });

    it('标题与链接按钮直接是下拉触发器，没有额外的包裹元素，并暴露弹出状态', async () => {
        const { container } = render(<FileItem content="<p>text</p>" />);
        await settle();
        const bar = container.querySelector('.semi-sidebar-file-menu-bar');
        for (const icon of ['hn', 'link']) {
            const button = menuButton(container, icon);
            expect(button.parentElement).toBe(bar);
            expect(button).toHaveAttribute('aria-haspopup');
            expect(button).toHaveAttribute('aria-expanded', 'false');
        }
        const heading = menuButton(container, 'hn');
        fireEvent.mouseEnter(heading);
        await waitFor(() => expect(heading).toHaveAttribute('aria-expanded', 'true'));
    });

    it('图片按钮插入由 imgUploadProps 配置的上传位', async () => {
        const { container } = render(<FileItem content="<p>text</p>" imgUploadProps={{ action: 'https://semi.design/upload', accept: '.png' }} />);
        await settle();
        fireEvent.click(menuButton(container, 'image'));
        await waitFor(() => expect(container.querySelector('.tiptap-image-slot')).toBeInTheDocument());
        expect(screen.getByText('点击上传图片或者拖拽图片到这里')).toBeInTheDocument();
        expect(container.querySelector('.tiptap-image-slot input[type="file"]')).toHaveAttribute('accept', '.png');
    });

    it('imgUploadProps 的 className 落在上传位节点上，并保留内置类名', async () => {
        const { container } = render(<FileItem content="<p>text</p>" imgUploadProps={{ action: 'https://semi.design/upload', className: 'custom-slot' }} />);
        await settle();
        fireEvent.click(menuButton(container, 'image'));
        await waitFor(() => expect(container.querySelector('.tiptap-image-slot.custom-slot')).toBeInTheDocument());
    });

    it('上传位不把上传配置写进 HTML，只有拖拽区一个 Tab 停靠点，状态类名带组件前缀', async () => {
        const { editors, extension } = captureEditors();
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local');
        const { container } = render(<FileItem content="<p>text</p>" extensions={[extension]} imgUploadProps={{ action: 'https://semi.design/upload', accept: '.png', customRequest: () => {} }} />);
        await settle();
        fireEvent.click(menuButton(container, 'image'));
        const slot = await waitFor(() => {
            const el = container.querySelector('.tiptap-image-slot');
            expect(el).toBeInTheDocument();
            return el;
        });
        const html = editors.at(-1).getHTML();
        expect(html).toContain('data-type="image-upload"');
        expect(html).not.toMatch(/action=|accept=|limit=/);
        expect(slot).not.toHaveAttribute('tabindex');
        expect(slot.querySelectorAll('[tabindex="0"]')).toHaveLength(1);

        fireEvent.change(slot.querySelector('input[type="file"]'), {
            target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] },
        });
        await waitFor(() => expect(slot.querySelector('.semi-sidebar-file-image-slot-uploading')).toBeInTheDocument());
        expect(slot.querySelector('.uploading')).toBeNull();
    });

    it('编辑器配置不变的重新渲染不重新配置编辑器', async () => {
        const { editors, extension } = captureEditors();
        const extensions = [extension];
        // a new style object gets past React.memo
        const { rerender } = render(<FileItem name="a.md" style={{ color: 'red' }} content="<p>a</p>" extensions={extensions} />);
        await settle();
        const setOptions = vi.spyOn(editors.at(-1), 'setOptions');
        rerender(<FileItem name="a.md" style={{ color: 'blue' }} content="<p>a</p>" extensions={extensions} />);
        expect(document.querySelector('.semi-sidebar-file')).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        expect(setOptions).not.toHaveBeenCalled();
    });

    it('Hn 菜单中当前标题级别的项保留基础类名并标为激活', async () => {
        const { editors, extension } = captureEditors();
        const { container } = render(<FileItem content="<h3>text</h3>" extensions={[extension]} />);
        await settle();
        act(() => {
            editors.at(-1).commands.setTextSelection(2);
        });
        fireEvent.mouseEnter(menuButton(container, 'hn'));
        const item = (level: number) => screen.findByRole('menuitem', { name: zh_CN.Sidebar.headingLevel.replace('${level}', String(level)) });
        const h3 = await item(3);
        expect(h3).toHaveClass('semi-sidebar-file-menu-bar-dropdown-item', 'semi-sidebar-file-menu-bar-dropdown-item-active');
        const h1 = await item(1);
        expect(h1).toHaveClass('semi-sidebar-file-menu-bar-dropdown-item');
        expect(h1).not.toHaveClass('semi-sidebar-file-menu-bar-dropdown-item-active');
    });
});

describe('Sidebar 编辑器名称', () => {
    it('以文件名为编辑器命名', () => {
        render(<FileItem name="notes.md" content="<p>hello</p>" />);
        expect(screen.getByRole('textbox', { name: 'notes.md' })).toHaveTextContent('hello');
    });

    it('折叠列表中的只读编辑器以其文件名命名', () => {
        render(<FileContent activeKey="a" files={[{ key: 'a', name: 'a.md', content: '<p>x</p>' }]} />);
        expect(screen.getByRole('textbox', { name: 'a.md' })).toBeInTheDocument();
    });
});

describe('Sidebar.FileContent', () => {
    const files = [
        { key: 'a', name: 'a.md', content: '<p>file a</p>' },
        { key: 'b', name: 'b.md', content: '<p>file b</p>' },
    ];

    it('为每个激活面板渲染一个只读编辑器，并报告展开点击', () => {
        const onExpand = vi.fn<() => void>();
        const { container } = render(<FileContent className="custom" style={{ color: 'red' }} activeKey={['a']} files={files} onExpand={onExpand} />);
        const collapse = container.querySelector('.semi-sidebar-collapse');
        expect(collapse).toHaveClass('semi-sidebar-collapse-file', 'custom');
        expect(collapse).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(screen.getByText('a.md')).toBeInTheDocument();
        expect(screen.getByText('b.md')).toBeInTheDocument();
        expect(container.querySelector('.semi-icon-file')).toBeInTheDocument();
        expect(screen.getByText('file a').closest('.ProseMirror')).toHaveAttribute('contenteditable', 'false');
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeNull();

        fireEvent.click(container.querySelectorAll('.semi-sidebar-collapse-header-expand-btn')[1]);
        expect(onExpand).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), files[1], 'file');
    });

    it('未传 onExpand 时不渲染展开按钮', () => {
        const { container } = render(<FileContent activeKey={['a']} files={files} />);
        expect(container.querySelector('.semi-sidebar-collapse-header-expand-btn')).toBeNull();
    });

    it('只读预览保留条目的 className、style 和原生属性', () => {
        render(<FileContent activeKey={['a']} files={[{ key: 'a', name: 'a.md', content: '<p>x</p>', className: 'preview', style: { color: 'red' }, id: 'preview-a' }]} />);
        const root = document.getElementById('preview-a');
        expect(root).toHaveClass('semi-sidebar-file', 'preview');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('类型：extensions 接受 Extension、Node 和 Mark', () => {
        expectTypeOf<Extension>().toExtend<NonNullable<FileItemProps['extensions']>[number]>();
        expectTypeOf<Node>().toExtend<NonNullable<FileItemProps['extensions']>[number]>();
        expectTypeOf<Mark>().toExtend<NonNullable<FileItemProps['extensions']>[number]>();
    });
});

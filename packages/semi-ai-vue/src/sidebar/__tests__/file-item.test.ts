import { nextTick } from 'vue';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { Extension, type Editor } from '@tiptap/core';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-vue/_utils/semi-global';
import Toast from '@fibrae/semi-ui-vue/toast/index';
import type { UploadCustomRequestArgs, UploadEmits } from '@fibrae/semi-ui-vue/upload/interface';
import { render } from '@test/utils/vue';
import Sidebar, { type ImageUploadNodeOptions } from '..';

const { FileItem, FileContent } = Sidebar;
const text = zh_CN.Sidebar;

// a documented `extensions` entry that hands out every editor FileItem creates
function captureEditors() {
    const editors: Editor[] = [];
    const extension = Extension.create({
        name: 'captureEditor',
        onCreate() {
            editors.push(this.editor);
        },
    });
    return { editors, extension };
}

// useEditor creates the editor once mounted, and tiptap emits create on a timer
async function mountEditor(props: Record<string, unknown> = {}) {
    const { editors, extension } = captureEditors();
    const onContentChange = vi.fn<(html: string) => void>();
    const view = render(FileItem, {
        props: { content: '<p>text</p>', extensions: [extension], onContentChange, ...props },
    });
    await waitFor(() => expect(editors).toHaveLength(1));
    await waitFor(() => expect(view.container.querySelector('.ProseMirror')).toBeInTheDocument());
    const editor = editors.at(-1) as Editor;
    return { view, container: view.container, editor, onContentChange };
}

const menuButton = (container: Element, icon: string) => container.querySelector(`.semi-icon-${icon}`)?.closest('button') as HTMLButtonElement;

describe('Sidebar.FileItem', () => {
    afterEach(() => {
        Toast.destroyAll();
        vi.restoreAllMocks();
    });

    it('内容渲染在带菜单栏的可编辑编辑器中', async () => {
        const { container } = render(FileItem, {
            props: { content: '<p>hello</p>' },
            attrs: { class: 'custom', style: { color: 'red' } },
        });
        const root = container.querySelector('.semi-sidebar-file');
        expect(root).toHaveClass('custom');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        await waitFor(() => expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeInTheDocument());
        const editor = container.querySelector('.semi-sidebar-file-editor .ProseMirror');
        expect(editor).toHaveTextContent('hello');
        expect(editor).toHaveAttribute('contenteditable', 'true');
    });

    it('editable 为 false 时隐藏菜单栏，编辑器只读', async () => {
        const { container } = await mountEditor({ content: '<p>hello</p>', editable: false });
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeNull();
        expect(container.querySelector('.ProseMirror')).toHaveAttribute('contenteditable', 'false');
    });

    it('以 HTML 发出 contentChange，始终交给当前的监听器', async () => {
        const second = vi.fn<(html: string) => void>();
        const { editor, onContentChange: first, view } = await mountEditor({ content: '<p>a</p>' });
        editor.commands.insertContentAt(editor.state.doc.content.size - 1, 'b');
        expect(first).toHaveBeenLastCalledWith('<p>ab</p>');

        await view.rerender({ onContentChange: second });
        editor.commands.insertContentAt(editor.state.doc.content.size - 1, 'c');
        expect(second).toHaveBeenLastCalledWith('<p>abc</p>');
        expect(first).toHaveBeenCalledTimes(1);
    });

    it('挂载后跟随 content 属性更新，但不报告为编辑', async () => {
        const { container, view, onContentChange } = await mountEditor({ content: '<p>first</p>' });
        await view.rerender({ content: '<p>second</p>' });
        expect(container.querySelector('.ProseMirror')).toHaveTextContent('second');
        expect(onContentChange).not.toHaveBeenCalled();
        await view.rerender({ content: undefined });
        expect(container.querySelector('.ProseMirror')).toHaveTextContent('');
    });

    it('content 属性回传输入内容时保留文档和光标', async () => {
        const { editor, view, onContentChange } = await mountEditor({ content: '<p>ab</p>' });
        editor.commands.setTextSelection(2);
        editor.commands.insertContent('X');
        const latest = onContentChange.mock.lastCall?.[0];
        expect(latest).toBe('<p>aXb</p>');
        const { doc, selection } = editor.state;
        await view.rerender({ content: latest });
        expect(editor.state.doc).toBe(doc);
        expect(editor.state.selection.from).toBe(selection.from);
    });

    it('挂载后 editable 属性同时作用于菜单栏和编辑器', async () => {
        const { container, view } = await mountEditor({ editable: false });
        const editor = () => container.querySelector('.ProseMirror');
        expect(editor()).toHaveAttribute('contenteditable', 'false');
        await view.rerender({ editable: true });
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeInTheDocument();
        await waitFor(() => expect(editor()).toHaveAttribute('contenteditable', 'true'));
        await view.rerender({ editable: false });
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeNull();
        await waitFor(() => expect(editor()).toHaveAttribute('contenteditable', 'false'));
    });

    it('editable 变化不报告为编辑', async () => {
        const { view, onContentChange } = await mountEditor();
        await view.rerender({ editable: false });
        expect(onContentChange).not.toHaveBeenCalled();
    });

    it('卸载时销毁编辑器', async () => {
        const { editor, view } = await mountEditor();
        expect(editor.isDestroyed).toBe(false);
        view.unmount();
        await waitFor(() => expect(editor.isDestroyed).toBe(true));
    });

    it('菜单栏按钮执行编辑器命令，并反映当前激活的标记', async () => {
        const { container, editor, onContentChange } = await mountEditor();
        expect(menuButton(container, 'undo')).toBeDisabled();
        editor.commands.selectAll();
        await fireEvent.click(menuButton(container, 'bold'));
        expect(onContentChange).toHaveBeenLastCalledWith('<p><strong>text</strong></p>');
        expect(menuButton(container, 'bold')).toHaveClass('semi-sidebar-file-menu-bar-btn-active');
        expect(menuButton(container, 'undo')).not.toBeDisabled();

        await fireEvent.click(menuButton(container, 'list'));
        expect(onContentChange).toHaveBeenLastCalledWith('<ul><li><p><strong>text</strong></p></li></ul><p></p>');
        await fireEvent.click(menuButton(container, 'undo'));
        expect(onContentChange).toHaveBeenLastCalledWith('<p><strong>text</strong></p>');
    });

    // the trailing paragraph comes from the trailing-node extension
    it.each([
        ['bold', (c: Element) => menuButton(c, 'bold'), '<p><strong>text</strong></p>'],
        ['italic', (c: Element) => menuButton(c, 'italic'), '<p><em>text</em></p>'],
        ['strike', (c: Element) => menuButton(c, 'strike_through'), '<p><s>text</s></p>'],
        ['code', (c: Element) => menuButton(c, 'code'), '<p><code>text</code></p>'],
        ['bullet list', (c: Element) => menuButton(c, 'list'), '<ul><li><p>text</p></li></ul><p></p>'],
        ['ordered list', (c: Element) => menuButton(c, 'ordered_list'), '<ol><li><p>text</p></li></ol><p></p>'],
        ['blockquote', (c: Element) => menuButton(c, 'quote'), '<blockquote><p>text</p></blockquote><p></p>'],
        ['code block', (c: Element) => menuButton(c, 'terminal'), '<pre><code>text</code></pre><p></p>'],
        ['horizontal rule', (c: Element) => menuButton(c, 'minus'), '<hr><p></p>'],
        ['align center', (c: Element) => menuButton(c, 'align_center'), '<p style="text-align: center;">text</p>'],
        ['align right', (c: Element) => menuButton(c, 'align_right'), '<p style="text-align: right;">text</p>'],
        ['align justify', (c: Element) => menuButton(c, 'align_justify'), '<p style="text-align: justify;">text</p>'],
    ])('%s 按钮对选区进行格式化', async (_name, getButton, html) => {
        const { container, editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.click(getButton(container));
        expect(onContentChange).toHaveBeenLastCalledWith(html);
    });

    it('左对齐按钮会移除其他对齐方式', async () => {
        const { container, editor, onContentChange } = await mountEditor({
            content: '<p style="text-align: right;">text</p>',
        });
        editor.commands.selectAll();
        await nextTick();
        expect(menuButton(container, 'align_right')).toHaveClass('semi-sidebar-file-menu-bar-btn-active');
        await fireEvent.click(menuButton(container, 'align_left'));
        expect(onContentChange).toHaveBeenLastCalledWith('<p style="text-align: left;">text</p>');
    });

    it('段落按钮可将标题恢复为段落，Hn 菜单可设置标题级别', async () => {
        const { container, editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.mouseEnter(menuButton(container, 'hn'));
        const h3 = await waitFor(() => {
            const icon = document.querySelector('.semi-icon-h3');
            expect(icon).toBeInTheDocument();
            return icon as Element;
        });
        await fireEvent.click(h3);
        expect(onContentChange).toHaveBeenLastCalledWith('<h3>text</h3><p></p>');
        editor.commands.setTextSelection(2);
        await waitFor(() => expect(menuButton(container, 'hn')).toHaveClass('semi-sidebar-file-menu-bar-btn-active'));

        await fireEvent.click(menuButton(container, 'text'));
        expect(onContentChange).toHaveBeenLastCalledWith('<p>text</p><p></p>');
        await waitFor(() => expect(menuButton(container, 'text')).toHaveClass('semi-sidebar-file-menu-bar-btn-active'));
    });

    it('重做按钮重新应用已撤销的修改', async () => {
        const { container, editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        expect(menuButton(container, 'redo')).toBeDisabled();
        await fireEvent.click(menuButton(container, 'bold'));
        await fireEvent.click(menuButton(container, 'undo'));
        expect(menuButton(container, 'redo')).not.toBeDisabled();
        await fireEvent.click(menuButton(container, 'redo'));
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
        const { container, editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.keyDown(container.querySelector('.ProseMirror') as Element, event);
        expect(onContentChange).toHaveBeenLastCalledWith(html);
    });

    it('Mod-z 撤销，Mod-Shift-z 重做', async () => {
        const { container, editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.click(menuButton(container, 'bold'));
        const node = container.querySelector('.ProseMirror') as Element;
        await fireEvent.keyDown(node, { key: 'z', ctrlKey: true });
        expect(onContentChange).toHaveBeenLastCalledWith('<p>text</p>');
        await fireEvent.keyDown(node, { key: 'Z', keyCode: 90, ctrlKey: true, shiftKey: true });
        expect(onContentChange).toHaveBeenLastCalledWith('<p><strong>text</strong></p>');
    });

    it('Shift-Enter 插入换行，Enter 拆分段落', async () => {
        const { container, editor, onContentChange } = await mountEditor({ content: '<p>ab</p>' });
        editor.commands.setTextSelection(2);
        const node = container.querySelector('.ProseMirror') as Element;
        await fireEvent.keyDown(node, { key: 'Enter', shiftKey: true });
        expect(onContentChange).toHaveBeenLastCalledWith('<p>a<br>b</p>');
        await fireEvent.keyDown(node, { key: 'Enter' });
        expect(onContentChange).toHaveBeenLastCalledWith('<p>a<br></p><p>b</p>');
    });

    it('能解析菜单栏可产生的每种格式的 HTML', async () => {
        const html = '<h2>h</h2><p><strong>b</strong><em>i</em><s>s</s><code>c</code><a href="https://semi.design">l</a></p>' + '<ul><li><p>u</p></li></ul><ol><li><p>o</p></li></ol><blockquote><p>q</p></blockquote>' + '<pre><code>k</code></pre><hr><p style="text-align: center">m</p>';
        const { editor } = await mountEditor({ content: html, editable: false });
        const names = new Set<string>();
        editor.state.doc.descendants((node) => {
            names.add(node.type.name);
            node.marks.forEach((mark) => names.add(mark.type.name));
        });
        expect([...names].toSorted((a, b) => a.localeCompare(b))).toEqual(['blockquote', 'bold', 'bulletList', 'code', 'codeBlock', 'heading', 'horizontalRule', 'italic', 'link', 'listItem', 'orderedList', 'paragraph', 'strike', 'text'].toSorted());
    });

    it('为选区添加链接并显示 Toast', async () => {
        const { container, editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.click(menuButton(container, 'link'));
        const input = await screen.findByPlaceholderText(text.enterLinkAddress);
        await fireEvent.update(input, 'https://semi.design');
        await fireEvent.keyDown(input, { key: 'Enter' });
        expect(onContentChange).toHaveBeenLastCalledWith(expect.stringContaining('<a target="_blank" rel="noopener noreferrer nofollow" href="https://semi.design">'));
        expect(await screen.findByText(text.linkAddSuccess)).toBeInTheDocument();
    });

    it('全局 Input 默认值不给链接输入框加清除按钮', async () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        try {
            const { container } = await mountEditor();
            await fireEvent.click(menuButton(container, 'link'));
            const input = await screen.findByPlaceholderText(text.enterLinkAddress);
            await fireEvent.update(input, 'https://semi.design');
            expect(input.closest('.semi-input-wrapper')?.querySelector('.semi-input-clearbtn')).toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('打开链接下拉时的选区高亮不报告为编辑，也不进入撤销栈；确认后撤销一步即回到原文', async () => {
        const { container, editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.click(menuButton(container, 'link'));
        const input = await screen.findByPlaceholderText(text.enterLinkAddress);
        expect(editor.getHTML()).toContain('class="select"');
        expect(onContentChange).not.toHaveBeenCalled();
        expect(editor.can().undo()).toBe(false);

        await fireEvent.update(input, 'https://semi.design');
        await fireEvent.keyDown(input, { key: 'Enter' });
        expect(onContentChange).toHaveBeenCalledTimes(1);
        expect(onContentChange.mock.calls[0][0]).not.toContain('select');
        editor.commands.undo();
        expect(editor.getHTML()).toBe('<p>text</p>');
    });

    it('关闭链接下拉不会把高亮残留在文档里', async () => {
        const { container, editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.click(menuButton(container, 'link'));
        await screen.findByPlaceholderText(text.enterLinkAddress);
        await fireEvent.mouseDown(document.body);
        await waitFor(() => expect(screen.queryByPlaceholderText(text.enterLinkAddress)).toBeNull());
        expect(editor.getHTML()).toBe('<p>text</p>');
        expect(onContentChange).not.toHaveBeenCalled();
        expect(editor.can().undo()).toBe(false);
    });

    it('链接地址不被允许时，不提示成功、不关闭下拉，文档里没有残留的空链接', async () => {
        const { container, editor } = await mountEditor();
        for (const collapsed of [false, true]) {
            if (collapsed) {
                editor.commands.setTextSelection(2);
            } else {
                editor.commands.selectAll();
            }
            await fireEvent.click(menuButton(container, 'link'));
            const input = await screen.findByPlaceholderText(text.enterLinkAddress);
            await fireEvent.update(input, 'javascript:alert(1)');
            await fireEvent.keyDown(input, { key: 'Enter' });
            expect(screen.queryByText(text.linkAddSuccess)).toBeNull();
            expect(screen.getByPlaceholderText(text.enterLinkAddress)).toBeInTheDocument();
            expect(editor.getHTML()).not.toMatch(/<a |javascript/);
            await fireEvent.mouseDown(document.body);
            await waitFor(() => expect(screen.queryByPlaceholderText(text.enterLinkAddress)).toBeNull());
        }
    });

    it('文档以非段落结尾时，仅聚焦编辑器不报告为编辑', async () => {
        const { editor, onContentChange } = await mountEditor({ content: '<ul><li><p>a</p></li></ul>' });
        editor.commands.focus();
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(onContentChange).not.toHaveBeenCalled();
    });

    it('引用按钮在引用内再次点击时取消引用，而不是嵌套', async () => {
        const { container, editor } = await mountEditor({ content: '<blockquote><p>q</p></blockquote>' });
        editor.commands.setTextSelection(3);
        const quote = screen.getByRole('button', { name: text.blockquote });
        await waitFor(() => expect(quote).toHaveAttribute('aria-pressed', 'true'));
        await fireEvent.click(quote);
        expect(container.querySelector('blockquote')).toBeNull();
        expect(editor.getHTML()).toContain('<p>q</p>');
    });

    it('没有配置上传地址或 customRequest 时不显示图片按钮', async () => {
        const { view } = await mountEditor();
        expect(screen.queryByRole('button', { name: text.image })).toBeNull();
        await view.rerender({ imgUploadProps: { action: 'https://semi.design/upload' } });
        // imgUploadProps is read when the editor is created, so a later prop must not add a button whose upload has no target
        expect(screen.queryByRole('button', { name: text.image })).toBeNull();
    });

    it('为菜单栏按钮命名，且只有切换按钮暴露按下状态', async () => {
        const { editor } = await mountEditor({ imgUploadProps: { action: 'https://semi.design/upload' } });
        expect(screen.getByRole('button', { name: text.undo })).not.toHaveAttribute('aria-pressed');
        expect(screen.getByRole('button', { name: text.redo })).not.toHaveAttribute('aria-pressed');
        expect(screen.getByRole('button', { name: text.heading })).not.toHaveAttribute('aria-pressed');
        expect(screen.getByRole('button', { name: text.link })).not.toHaveAttribute('aria-pressed');
        expect(screen.getByRole('button', { name: text.image })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: text.alignLeft })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: text.codeBlock })).toHaveAttribute('aria-pressed', 'false');
        // icon only like its siblings: visible text outside the name breaks WCAG 2.5.3 label in name
        expect(screen.getByRole('button', { name: text.codeBlock }).textContent).toBe('');
        const bold = screen.getByRole('button', { name: text.bold });
        expect(bold).toHaveAttribute('aria-pressed', 'false');
        editor.commands.selectAll();
        await fireEvent.click(bold);
        await waitFor(() => expect(bold).toHaveAttribute('aria-pressed', 'true'));
    });

    it('命令绕过菜单栏改变选区标记时，aria-pressed 在同一更新内跟随', async () => {
        const { editor } = await mountEditor();
        const bold = screen.getByRole('button', { name: text.bold });
        editor.commands.selectAll();
        editor.commands.toggleBold();
        await nextTick();
        expect(bold).toHaveAttribute('aria-pressed', 'true');
        editor.commands.toggleBold();
        await nextTick();
        expect(bold).toHaveAttribute('aria-pressed', 'false');
    });

    it('为 Hn 菜单中的标题级别项命名', async () => {
        const { container } = await mountEditor();
        await fireEvent.mouseEnter(menuButton(container, 'hn'));
        const h3 = await screen.findByRole('menuitem', { name: text.headingLevel.replace('${level}', '3') });
        expect(h3).toBeInTheDocument();
    });

    it('getUploadImageSrc 收到上传响应，返回值成为插入图片的 src', async () => {
        const getUploadImageSrc = vi.fn<(response: { url: string }) => string>((response) => response.url);
        const customRequest = vi.fn<(args: UploadCustomRequestArgs) => void>(({ onSuccess }) => onSuccess({ url: 'https://semi.design/uploaded.png' }));
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local');
        const { container } = await mountEditor({
            imgUploadProps: { action: 'x', customRequest, getUploadImageSrc },
        });
        await fireEvent.click(menuButton(container, 'image'));
        const input = await waitFor(() => {
            const el = container.querySelector('.tiptap-image-slot input[type="file"]');
            expect(el).toBeInTheDocument();
            return el as Element;
        });
        await fireEvent.change(input, { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
        await waitFor(() => expect(container.querySelector('.ProseMirror img')).toHaveAttribute('src', 'https://semi.design/uploaded.png'));
        expect(getUploadImageSrc).toHaveBeenCalledExactlyOnceWith({ url: 'https://semi.design/uploaded.png' });
    });

    it('imgUploadProps 接受 Upload 的事件监听，上传失败时调用 onError', async () => {
        const onError = vi.fn<NonNullable<ImageUploadNodeOptions['onError']>>();
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local');
        const imgUploadProps: ImageUploadNodeOptions = {
            action: 'x',
            customRequest: ({ onError: fail }) => fail({ status: 500 }),
            onError,
        };
        const { container } = await mountEditor({ imgUploadProps });
        await fireEvent.click(menuButton(container, 'image'));
        const input = await waitFor(() => {
            const el = container.querySelector('.tiptap-image-slot input[type="file"]');
            expect(el).toBeInTheDocument();
            return el as Element;
        });
        await fireEvent.change(input, { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
        await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
        expect(onError.mock.calls[0][1]).toEqual(expect.objectContaining({ name: 'a.png' }));
        expectTypeOf<ImageUploadNodeOptions['onProgress']>().toEqualTypeOf<((...args: UploadEmits['progress']) => void) | undefined>();
    });

    it('标题与链接按钮直接是下拉触发器，没有额外的包裹元素，并暴露弹出状态', async () => {
        const { container } = await mountEditor();
        const bar = container.querySelector('.semi-sidebar-file-menu-bar');
        for (const icon of ['hn', 'link']) {
            const button = menuButton(container, icon);
            expect(button.parentElement).toBe(bar);
            expect(button).toHaveAttribute('aria-haspopup');
            expect(button).toHaveAttribute('aria-expanded', 'false');
        }
        // under jsdom the Dropdown shows its menu on hover but its trigger keeps aria-expanded false (a plain Button
        // trigger too), so the open state is asserted in file-item.browser.test.ts
    });

    it('图片按钮插入由 imgUploadProps 配置的上传位，上传位文案来自语言包', async () => {
        const { container } = await mountEditor({
            imgUploadProps: { action: 'https://semi.design/upload', accept: '.png' },
        });
        await fireEvent.click(menuButton(container, 'image'));
        await waitFor(() => expect(container.querySelector('.tiptap-image-slot')).toBeInTheDocument());
        expect(screen.getByText(text.uploadImgInfo)).toBeInTheDocument();
        expect(container.querySelector('.tiptap-image-slot input[type="file"]')).toHaveAttribute('accept', '.png');
    });

    it('imgUploadProps 的 class 落在上传位节点上，并保留内置类名', async () => {
        const { container } = await mountEditor({
            imgUploadProps: { action: 'https://semi.design/upload', class: 'custom-slot' },
        });
        await fireEvent.click(menuButton(container, 'image'));
        await waitFor(() => expect(container.querySelector('.tiptap-image-slot.custom-slot')).toBeInTheDocument());
    });

    it('上传位不把上传配置写进 HTML，只有拖拽区一个 Tab 停靠点，状态类名带组件前缀', async () => {
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local');
        const { container, editor } = await mountEditor({
            imgUploadProps: { action: 'https://semi.design/upload', accept: '.png', customRequest: () => {} },
        });
        await fireEvent.click(menuButton(container, 'image'));
        const slot = await waitFor(() => {
            const el = container.querySelector('.tiptap-image-slot');
            expect(el).toBeInTheDocument();
            return el as Element;
        });
        const html = editor.getHTML();
        expect(html).toContain('data-type="image-upload"');
        expect(html).not.toMatch(/action=|accept=|limit=/);
        expect(slot).not.toHaveAttribute('tabindex');
        expect(slot.querySelectorAll('[tabindex="0"]')).toHaveLength(1);

        await fireEvent.change(slot.querySelector('input[type="file"]') as Element, {
            target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] },
        });
        await waitFor(() => expect(slot.querySelector('.semi-sidebar-file-image-slot-uploading')).toBeInTheDocument());
        expect(slot.querySelector('.uploading')).toBeNull();
    });

    it('与编辑器无关的属性变化不重新配置编辑器', async () => {
        const { editor, view } = await mountEditor({ name: 'a.md', content: '<p>a</p>' });
        const setOptions = vi.spyOn(editor, 'setOptions');
        await view.rerender({ content: '<p>a</p>', name: 'a.md' });
        expect(setOptions).not.toHaveBeenCalled();
    });

    it('name 变化后编辑器名称跟随', async () => {
        const { view } = await mountEditor({ name: 'a.md' });
        expect(screen.getByRole('textbox', { name: 'a.md' })).toBeInTheDocument();
        await view.rerender({ name: 'b.md' });
        expect(screen.getByRole('textbox', { name: 'b.md' })).toBeInTheDocument();
    });

    it('Hn 菜单中当前标题级别的项保留基础类名并标为激活', async () => {
        const { container, editor } = await mountEditor({ content: '<h3>text</h3>' });
        editor.commands.setTextSelection(2);
        await fireEvent.mouseEnter(menuButton(container, 'hn'));
        const item = (level: number) => screen.findByRole('menuitem', { name: text.headingLevel.replace('${level}', String(level)) });
        const h3 = await item(3);
        expect(h3).toHaveClass('semi-sidebar-file-menu-bar-dropdown-item', 'semi-sidebar-file-menu-bar-dropdown-item-active');
        const h1 = await item(1);
        expect(h1).toHaveClass('semi-sidebar-file-menu-bar-dropdown-item');
        expect(h1).not.toHaveClass('semi-sidebar-file-menu-bar-dropdown-item-active');
    });
});

describe('Sidebar 编辑器名称', () => {
    it('以文件名为编辑器命名', async () => {
        render(FileItem, { props: { name: 'notes.md', content: '<p>hello</p>' } });
        expect(await screen.findByRole('textbox', { name: 'notes.md' })).toHaveTextContent('hello');
    });

    it('首帧根元素已存在而编辑器尚未创建，就绪后命名并可聚焦', async () => {
        const { editors, extension } = captureEditors();
        const { container } = render(FileItem, {
            props: { name: 'notes.md', content: '<p>hello</p>', extensions: [extension] },
        });
        expect(container.querySelector('.semi-sidebar-file')).toBeInTheDocument();
        expect(container.querySelector('.ProseMirror')).toBeNull();
        expect(screen.queryByRole('textbox')).toBeNull();
        await waitFor(() => expect(editors).toHaveLength(1));
        expect(await screen.findByRole('textbox', { name: 'notes.md' })).toBeInTheDocument();
        editors[0].commands.focus();
        // tiptap defers the DOM focus to a frame
        await waitFor(() => expect(container.querySelector('.ProseMirror')).toHaveFocus());
    });

    it('折叠列表中的只读编辑器以其文件名命名', async () => {
        render(FileContent, {
            props: { activeKey: 'a', files: [{ key: 'a', name: 'a.md', content: '<p>x</p>' }] },
        });
        expect(await screen.findByRole('textbox', { name: 'a.md' })).toBeInTheDocument();
    });
});

describe('Sidebar.FileContent', () => {
    const files = [
        { key: 'a', name: 'a.md', content: '<p>file a</p>' },
        { key: 'b', name: 'b.md', content: '<p>file b</p>' },
    ];

    it('为每个激活面板渲染一个只读编辑器，并报告展开点击', async () => {
        const onExpand = vi.fn<(...args: unknown[]) => void>();
        const { container } = render(FileContent, {
            props: { activeKey: ['a'], files, onExpand },
            attrs: { class: 'custom', style: { color: 'red' } },
        });
        const collapse = container.querySelector('.semi-sidebar-collapse');
        expect(collapse).toHaveClass('semi-sidebar-collapse-file', 'custom');
        expect(collapse).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(screen.getByText('a.md')).toBeInTheDocument();
        expect(screen.getByText('b.md')).toBeInTheDocument();
        expect(container.querySelector('.semi-icon-file')).toBeInTheDocument();
        expect((await screen.findByText('file a')).closest('.ProseMirror')).toHaveAttribute('contenteditable', 'false');
        expect(container.querySelector('.semi-sidebar-file-menu-bar')).toBeNull();

        await fireEvent.click(container.querySelectorAll('.semi-sidebar-collapse-header-expand-btn')[1]);
        expect(onExpand).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), files[1], 'file');
    });

    it('没有 expand 监听时不渲染展开按钮', async () => {
        const { container } = render(FileContent, { props: { activeKey: ['a'], files } });
        await screen.findByText('file a');
        expect(container.querySelector('.semi-sidebar-collapse-header-expand-btn')).toBeNull();
    });

    it('条目的 extensions 与 imgUploadProps 传给只读预览', async () => {
        const { editors, extension } = captureEditors();
        const { container } = render(FileContent, {
            props: {
                activeKey: 'a',
                files: [
                    {
                        key: 'a',
                        name: 'a.md',
                        content: '<div data-type="image-upload"></div>',
                        extensions: [extension],
                        imgUploadProps: { action: 'https://semi.design/upload', accept: '.png' },
                    },
                ],
            },
        });
        await waitFor(() => expect(editors).toHaveLength(1));
        expect(editors[0].isEditable).toBe(false);
        await waitFor(() => expect(container.querySelector('.tiptap-image-slot input[type="file"]')).toHaveAttribute('accept', '.png'));
    });
});

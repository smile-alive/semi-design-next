import { tick } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { Extension, type Editor } from '@tiptap/core';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-svelte/_utils/semi-global';
import { Toast } from '@fibrae/semi-ui-svelte/toast/index';
import type { UploadCustomRequestArgs } from '@fibrae/semi-ui-svelte/upload/interface';
import { Sidebar } from '../index';
import type { FileItemProps, ImageUploadNodeOptions } from '../widget/interface';

// jsdom has no Worker, so the editor core behind CodeContent's JsonViewer is faked
vi.mock('@fibrae/semi-json-viewer-core', () => ({
    JsonViewer: class {
        emitter = { on: () => {} };
        layout = () => {};
        format = () => {};
        resetMeasuredHeights = () => {};
        dispose = () => {};
        getModel = () => ({ getValue: () => '' });
        getSearchWidget = () => ({});
    },
}));

const { FileItem, FileContent, CodeContent } = Sidebar;
const text = zh_CN.Sidebar;
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const button = (name: string) => screen.getByRole('button', { name });

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

async function mountEditor(props: FileItemProps = {}) {
    const { editors, extension } = captureEditors();
    const onContentChange = vi.fn<(html: string) => void>();
    const view = render(FileItem, { props: { content: '<p>text</p>', extensions: [extension], onContentChange, ...props } });
    await waitFor(() => expect(editors).toHaveLength(1));
    await waitFor(() => expect($('.ProseMirror')).toBeInTheDocument());
    return { view, editor: editors[0], onContentChange };
}

const slotInput = () =>
    waitFor(() => {
        const input = $('.tiptap-image-slot input[type="file"]');
        expect(input).toBeInTheDocument();
        return input as HTMLInputElement;
    });
const pngFile = () => new File(['x'], 'a.png', { type: 'image/png' });

afterEach(() => {
    Toast.destroyAll();
    vi.restoreAllMocks();
    semiGlobal.config.overrideDefaultProps = {};
    document.body.innerHTML = '';
});

describe('Svelte Sidebar.FileItem', () => {
    it('内容渲染在带菜单栏的可编辑编辑器中，class 与 style 落在根元素', async () => {
        render(FileItem, { props: { content: '<p>hello</p>', class: 'custom', style: 'color: red' } });
        expect($('.semi-sidebar-file')).toHaveClass('custom');
        expect($('.semi-sidebar-file')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        await waitFor(() => expect($('.semi-sidebar-file-menu-bar')).toBeInTheDocument());
        expect($('.semi-sidebar-file-editor .ProseMirror')).toHaveTextContent('hello');
        expect($('.ProseMirror')).toHaveAttribute('contenteditable', 'true');
    });

    it('editable 为 false 时隐藏菜单栏，编辑器只读', async () => {
        await mountEditor({ editable: false });
        expect($('.semi-sidebar-file-menu-bar')).toBeNull();
        expect($('.ProseMirror')).toHaveAttribute('contenteditable', 'false');
    });

    it('以 HTML 发出 onContentChange，始终交给当前的监听器', async () => {
        const second = vi.fn<(html: string) => void>();
        const { editor, onContentChange: first, view } = await mountEditor({ content: '<p>a</p>' });
        editor.commands.insertContentAt(editor.state.doc.content.size - 1, 'b');
        expect(first).toHaveBeenLastCalledWith('<p>ab</p>');
        await view.rerender({ onContentChange: second });
        editor.commands.insertContentAt(editor.state.doc.content.size - 1, 'c');
        expect(second).toHaveBeenLastCalledWith('<p>abc</p>');
        expect(first).toHaveBeenCalledTimes(1);
    });

    it('挂载后跟随 content 更新，但不报告为编辑', async () => {
        const { view, onContentChange } = await mountEditor({ content: '<p>first</p>' });
        await view.rerender({ content: '<p>second</p>' });
        await waitFor(() => expect($('.ProseMirror')).toHaveTextContent('second'));
        expect(onContentChange).not.toHaveBeenCalled();
        await view.rerender({ content: undefined });
        await waitFor(() => expect($('.ProseMirror')).toHaveTextContent(''));
    });

    it('content 回传输入内容时保留文档与光标', async () => {
        const { editor, view, onContentChange } = await mountEditor({ content: '<p>ab</p>' });
        editor.commands.setTextSelection(2);
        editor.commands.insertContent('X');
        const latest = onContentChange.mock.lastCall?.[0] as string;
        expect(latest).toBe('<p>aXb</p>');
        const { doc, selection } = editor.state;
        await view.rerender({ content: latest });
        expect(editor.state.doc).toBe(doc);
        expect(editor.state.selection.from).toBe(selection.from);
    });

    it('editable 在挂载后变化时同时作用于菜单栏与编辑器，且不报告为编辑', async () => {
        const { view, onContentChange } = await mountEditor({ editable: false });
        await view.rerender({ editable: true });
        expect($('.semi-sidebar-file-menu-bar')).toBeInTheDocument();
        await waitFor(() => expect($('.ProseMirror')).toHaveAttribute('contenteditable', 'true'));
        await view.rerender({ editable: false });
        expect($('.semi-sidebar-file-menu-bar')).toBeNull();
        await waitFor(() => expect($('.ProseMirror')).toHaveAttribute('contenteditable', 'false'));
        expect(onContentChange).not.toHaveBeenCalled();
    });

    it('卸载时销毁编辑器', async () => {
        const { editor, view } = await mountEditor();
        expect(editor.isDestroyed).toBe(false);
        view.unmount();
        expect(editor.isDestroyed).toBe(true);
    });

    it('菜单栏按钮执行编辑器命令，并反映当前激活的标记', async () => {
        const { editor, onContentChange } = await mountEditor();
        expect(button(text.undo)).toBeDisabled();
        editor.commands.selectAll();
        await fireEvent.click(button(text.bold));
        expect(onContentChange).toHaveBeenLastCalledWith('<p><strong>text</strong></p>');
        await waitFor(() => expect(button(text.bold)).toHaveAttribute('aria-pressed', 'true'));
        expect(button(text.bold)).toHaveClass('semi-sidebar-file-menu-bar-btn-active');
        expect(button(text.undo)).not.toBeDisabled();

        await fireEvent.click(button(text.bulletList));
        expect(editor.getHTML()).toContain('<ul>');
        await fireEvent.click(button(text.undo));
        await fireEvent.click(button(text.undo));
        expect(editor.getHTML()).toBe('<p>text</p>');
        await fireEvent.click(button(text.redo));
        expect(editor.getHTML()).toBe('<p><strong>text</strong></p>');
    });

    it('对齐按钮互斥，段落按钮把标题恢复为段落', async () => {
        const { editor } = await mountEditor({ content: '<h2>head</h2>' });
        await fireEvent.click(button(text.alignCenter));
        await waitFor(() => expect(button(text.alignCenter)).toHaveAttribute('aria-pressed', 'true'));
        await fireEvent.click(button(text.alignLeft));
        await waitFor(() => expect(button(text.alignCenter)).toHaveAttribute('aria-pressed', 'false'));
        await fireEvent.click(button(text.paragraph));
        expect(editor.getHTML()).toContain('<p');
        expect(editor.getHTML()).not.toContain('<h2');
    });

    it('引用按钮在引用内再次点击时取消引用，而不是嵌套', async () => {
        const { editor } = await mountEditor({ content: '<blockquote><p>q</p></blockquote>' });
        editor.commands.setTextSelection(3);
        await waitFor(() => expect(button(text.blockquote)).toHaveAttribute('aria-pressed', 'true'));
        await fireEvent.click(button(text.blockquote));
        expect($('blockquote')).toBeNull();
        expect(editor.getHTML()).toContain('<p>q</p>');
    });

    it('为菜单栏按钮命名，且只有切换按钮暴露按下状态', async () => {
        await mountEditor();
        for (const name of [text.bold, text.italic, text.strike, text.code, text.bulletList, text.orderedList, text.blockquote, text.codeBlock, text.paragraph]) {
            expect(button(name)).toHaveAttribute('aria-pressed');
        }
        for (const name of [text.undo, text.redo, text.horizontalRule, text.heading, text.link]) {
            expect(button(name)).not.toHaveAttribute('aria-pressed');
        }
    });

    it('标题与链接按钮是下拉触发器，直接位于菜单栏下', async () => {
        await mountEditor();
        const bar = $('.semi-sidebar-file-menu-bar');
        for (const name of [text.heading, text.link]) {
            expect(button(name).parentElement).toBe(bar);
            expect(button(name)).toHaveAttribute('aria-haspopup');
        }
    });

    it('Hn 菜单设置标题级别，并为级别项命名', async () => {
        const { editor } = await mountEditor();
        await fireEvent.mouseEnter(button(text.heading));
        const level2 = await screen.findByRole('menuitem', { name: text.headingLevel.replace('${level}', '2') });
        await fireEvent.click(level2);
        expect(editor.getHTML()).toContain('<h2>text</h2>');
    });

    it('为选区添加链接并显示 Toast', async () => {
        const { editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.click(button(text.link));
        const input = await screen.findByPlaceholderText(text.enterLinkAddress);
        await fireEvent.input(input, { target: { value: 'https://semi.design' } });
        await fireEvent.keyDown(input, { key: 'Enter' });
        expect(onContentChange).toHaveBeenLastCalledWith(expect.stringContaining('href="https://semi.design"'));
        expect(await screen.findByText(text.linkAddSuccess)).toBeInTheDocument();
    });

    it('打开链接下拉时的选区高亮不报告为编辑，也不进入撤销栈', async () => {
        const { editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.click(button(text.link));
        await screen.findByPlaceholderText(text.enterLinkAddress);
        expect(editor.getHTML()).toContain('class="select"');
        expect(onContentChange).not.toHaveBeenCalled();
        expect(editor.can().undo()).toBe(false);
    });

    it('关闭链接下拉不会把高亮残留在文档里', async () => {
        const { editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.click(button(text.link));
        await screen.findByPlaceholderText(text.enterLinkAddress);
        await fireEvent.mouseDown(document.body);
        await waitFor(() => expect(screen.queryByPlaceholderText(text.enterLinkAddress)).toBeNull());
        expect(editor.getHTML()).toBe('<p>text</p>');
        expect(onContentChange).not.toHaveBeenCalled();
    });

    it('链接地址不被允许时，不提示成功、不关闭下拉，文档里没有残留的链接', async () => {
        const { editor } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.click(button(text.link));
        const input = await screen.findByPlaceholderText(text.enterLinkAddress);
        await fireEvent.input(input, { target: { value: 'javascript:alert(1)' } });
        await fireEvent.keyDown(input, { key: 'Enter' });
        expect(screen.queryByText(text.linkAddSuccess)).toBeNull();
        expect(screen.getByPlaceholderText(text.enterLinkAddress)).toBeInTheDocument();
        expect(editor.getHTML()).not.toMatch(/<a |javascript/);
    });

    it('全局 Input 默认值不给链接输入框加清除按钮', async () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        await mountEditor();
        await fireEvent.click(button(text.link));
        const input = await screen.findByPlaceholderText(text.enterLinkAddress);
        await fireEvent.input(input, { target: { value: 'https://semi.design' } });
        expect(input.closest('.semi-input-wrapper')?.querySelector('.semi-input-clearbtn')).toBeNull();
    });

    it('文档以非段落结尾时，仅聚焦编辑器不报告为编辑', async () => {
        const { editor, onContentChange } = await mountEditor({ content: '<ul><li><p>a</p></li></ul>' });
        editor.commands.focus();
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(onContentChange).not.toHaveBeenCalled();
    });
});

describe('Svelte Sidebar.FileItem 图片上传', () => {
    it('没有上传地址或 customRequest 时不显示图片按钮', async () => {
        await mountEditor();
        expect(screen.queryByRole('button', { name: text.image })).toBeNull();
    });

    it('图片按钮插入上传位，文案来自语言包，配置转给 Upload，class 落在上传位上', async () => {
        await mountEditor({ imgUploadProps: { action: 'https://semi.design/upload', accept: '.png', class: 'custom-slot' } });
        await fireEvent.click(button(text.image));
        await waitFor(() => expect($('.tiptap-image-slot.custom-slot')).toBeInTheDocument());
        expect(screen.getByText(text.uploadImgInfo)).toBeInTheDocument();
        expect((await slotInput()).getAttribute('accept')).toBe('.png');
    });

    it('getUploadImageSrc 收到上传响应，返回值成为插入图片的 src', async () => {
        const getUploadImageSrc = vi.fn<(response: { url: string }) => string>((response) => response.url);
        const customRequest = vi.fn<(args: UploadCustomRequestArgs) => void>(({ onSuccess }) => onSuccess({ url: 'https://semi.design/uploaded.png' }));
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local');
        await mountEditor({ imgUploadProps: { action: 'x', customRequest, getUploadImageSrc } });
        await fireEvent.click(button(text.image));
        await fireEvent.change(await slotInput(), { target: { files: [pngFile()] } });
        await waitFor(() => expect($('.ProseMirror img')).toHaveAttribute('src', 'https://semi.design/uploaded.png'));
        expect(getUploadImageSrc).toHaveBeenCalledExactlyOnceWith({ url: 'https://semi.design/uploaded.png' });
    });

    it('imgUploadProps 的 onError 在上传失败时被调用', async () => {
        const onError = vi.fn<NonNullable<ImageUploadNodeOptions['onError']>>();
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local');
        await mountEditor({ imgUploadProps: { action: 'x', customRequest: ({ onError: fail }) => fail({ status: 500 }), onError } });
        await fireEvent.click(button(text.image));
        await fireEvent.change(await slotInput(), { target: { files: [pngFile()] } });
        await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
        expect(onError.mock.calls[0][1]).toEqual(expect.objectContaining({ name: 'a.png' }));
    });

    it('上传位不把上传配置写进 HTML，只有拖拽区一个 Tab 停靠点，状态类名带组件前缀', async () => {
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local');
        const { editor } = await mountEditor({ imgUploadProps: { action: 'https://semi.design/upload', accept: '.png', customRequest: () => {} } });
        await fireEvent.click(button(text.image));
        const input = await slotInput();
        const slot = $('.tiptap-image-slot') as HTMLElement;
        expect(editor.getHTML()).toContain('data-type="image-upload"');
        expect(editor.getHTML()).not.toMatch(/action=|accept=|limit=/);
        expect(slot).not.toHaveAttribute('tabindex');
        expect(slot.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
        await fireEvent.change(input, { target: { files: [pngFile()] } });
        await waitFor(() => expect(slot.querySelector('.semi-sidebar-file-image-slot-uploading')).toBeInTheDocument());
    });
});

describe('Svelte Sidebar.FileItem 内容同步', () => {
    it('content 值没变时重新传入不重置用户的编辑', async () => {
        const { editor, view } = await mountEditor({ content: '<p>a</p>' });
        editor.commands.insertContentAt(editor.state.doc.content.size - 1, 'b');
        // rerender hands every prop over again, as a parent that re-renders without touching content does
        await view.rerender({ name: 'a.md' });
        expect(editor.getHTML()).toBe('<p>ab</p>');
    });

    it('content 变回之前的值时仍会应用', async () => {
        const { editor, view } = await mountEditor({ content: '<p>a</p>' });
        await view.rerender({ content: '<p>b</p>' });
        await waitFor(() => expect(editor.getHTML()).toBe('<p>b</p>'));
        await view.rerender({ content: '<p>a</p>' });
        await waitFor(() => expect(editor.getHTML()).toBe('<p>a</p>'));
    });
});

describe('Svelte Sidebar.FileItem 工具栏格式', () => {
    // the trailing paragraph comes from the trailing-node extension
    it.each([
        ['bold', text.bold, '<p><strong>text</strong></p>'],
        ['italic', text.italic, '<p><em>text</em></p>'],
        ['strike', text.strike, '<p><s>text</s></p>'],
        ['code', text.code, '<p><code>text</code></p>'],
        ['bullet list', text.bulletList, '<ul><li><p>text</p></li></ul><p></p>'],
        ['ordered list', text.orderedList, '<ol><li><p>text</p></li></ol><p></p>'],
        ['blockquote', text.blockquote, '<blockquote><p>text</p></blockquote><p></p>'],
        ['code block', text.codeBlock, '<pre><code>text</code></pre><p></p>'],
        ['horizontal rule', text.horizontalRule, '<hr><p></p>'],
        ['align center', text.alignCenter, '<p style="text-align: center;">text</p>'],
        ['align right', text.alignRight, '<p style="text-align: right;">text</p>'],
        ['align justify', text.alignJustify, '<p style="text-align: justify;">text</p>'],
    ])('%s 按钮对选区进行格式化', async (_name, name, html) => {
        const { editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.click(button(name));
        expect(onContentChange).toHaveBeenLastCalledWith(html);
    });

    it('左对齐按钮会移除其他对齐方式', async () => {
        const { editor, onContentChange } = await mountEditor({ content: '<p style="text-align: right;">text</p>' });
        editor.commands.selectAll();
        await waitFor(() => expect(button(text.alignRight)).toHaveClass('semi-sidebar-file-menu-bar-btn-active'));
        await fireEvent.click(button(text.alignLeft));
        expect(onContentChange).toHaveBeenLastCalledWith('<p style="text-align: left;">text</p>');
    });

    it('Hn 菜单设置标题级别，段落按钮把标题恢复为段落，两者的激活态跟随选区', async () => {
        const { editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.mouseEnter(button(text.heading));
        await fireEvent.click(await screen.findByRole('menuitem', { name: text.headingLevel.replace('${level}', '3') }));
        expect(onContentChange).toHaveBeenLastCalledWith('<h3>text</h3><p></p>');
        editor.commands.setTextSelection(2);
        await waitFor(() => expect(button(text.heading)).toHaveClass('semi-sidebar-file-menu-bar-btn-active'));
        await fireEvent.click(button(text.paragraph));
        expect(onContentChange).toHaveBeenLastCalledWith('<p>text</p><p></p>');
        await waitFor(() => expect(button(text.paragraph)).toHaveClass('semi-sidebar-file-menu-bar-btn-active'));
    });

    it('Hn 菜单中当前标题级别的项保留基础类名并标为激活', async () => {
        const { editor } = await mountEditor({ content: '<h3>text</h3>' });
        editor.commands.setTextSelection(2);
        await fireEvent.mouseEnter(button(text.heading));
        const item = (level: number) => screen.findByRole('menuitem', { name: text.headingLevel.replace('${level}', String(level)) });
        const h3 = await item(3);
        expect(h3).toHaveClass('semi-sidebar-file-menu-bar-dropdown-item', 'semi-sidebar-file-menu-bar-dropdown-item-active');
        const h1 = await item(1);
        expect(h1).toHaveClass('semi-sidebar-file-menu-bar-dropdown-item');
        expect(h1).not.toHaveClass('semi-sidebar-file-menu-bar-dropdown-item-active');
    });

    it('重做按钮重新应用已撤销的修改', async () => {
        const { editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        expect(button(text.redo)).toBeDisabled();
        await fireEvent.click(button(text.bold));
        await fireEvent.click(button(text.undo));
        await waitFor(() => expect(button(text.redo)).not.toBeDisabled());
        await fireEvent.click(button(text.redo));
        expect(onContentChange).toHaveBeenLastCalledWith('<p><strong>text</strong></p>');
    });

    it('命令绕过菜单栏改变选区标记时，aria-pressed 在同一更新内跟随', async () => {
        const { editor } = await mountEditor();
        const bold = button(text.bold);
        editor.commands.selectAll();
        editor.commands.toggleBold();
        await tick();
        expect(bold).toHaveAttribute('aria-pressed', 'true');
        editor.commands.toggleBold();
        await tick();
        expect(bold).toHaveAttribute('aria-pressed', 'false');
    });

    it('图标按钮不带可见文字，以免违反 label in name', async () => {
        await mountEditor();
        expect(button(text.codeBlock).textContent?.trim()).toBe('');
        expect(button(text.alignLeft)).toHaveAttribute('aria-pressed', 'false');
    });

    it('imgUploadProps 之后才传入时不会新增图片按钮', async () => {
        const { view } = await mountEditor();
        await view.rerender({ imgUploadProps: { action: 'https://semi.design/upload' } });
        expect(screen.queryByRole('button', { name: text.image })).toBeNull();
    });

    it('配置了上传地址时显示图片按钮', async () => {
        await mountEditor({ imgUploadProps: { action: 'https://semi.design/upload' } });
        expect(screen.getByRole('button', { name: text.image })).toBeInTheDocument();
    });
});

describe('Svelte Sidebar.FileItem 键盘', () => {
    it.each([
        ['Mod-b 加粗', { key: 'b', ctrlKey: true }, '<p><strong>text</strong></p>'],
        ['Mod-i 斜体', { key: 'i', ctrlKey: true }, '<p><em>text</em></p>'],
        ['Mod-Shift-s 删除线', { key: 'S', keyCode: 83, ctrlKey: true, shiftKey: true }, '<p><s>text</s></p>'],
        ['Mod-e 行内代码', { key: 'e', ctrlKey: true }, '<p><code>text</code></p>'],
        ['Mod-Shift-8 无序列表', { key: '8', code: 'Digit8', ctrlKey: true, shiftKey: true }, '<ul><li><p>text</p></li></ul><p></p>'],
        ['Mod-Shift-7 有序列表', { key: '7', code: 'Digit7', ctrlKey: true, shiftKey: true }, '<ol><li><p>text</p></li></ol><p></p>'],
        ['Mod-Shift-b 引用', { key: 'B', keyCode: 66, ctrlKey: true, shiftKey: true }, '<blockquote><p>text</p></blockquote><p></p>'],
        ['Mod-Alt-c 代码块', { key: 'c', code: 'KeyC', ctrlKey: true, altKey: true }, '<pre><code>text</code></pre><p></p>'],
        ['Mod-Alt-2 二级标题', { key: '2', code: 'Digit2', ctrlKey: true, altKey: true }, '<h2>text</h2><p></p>'],
    ])('%s', async (_name, event, html) => {
        const { editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.keyDown($('.ProseMirror') as Element, event);
        expect(onContentChange).toHaveBeenLastCalledWith(html);
    });

    it('Mod-z 撤销，Mod-Shift-z 重做', async () => {
        const { editor, onContentChange } = await mountEditor();
        editor.commands.selectAll();
        await fireEvent.click(button(text.bold));
        const node = $('.ProseMirror') as Element;
        await fireEvent.keyDown(node, { key: 'z', ctrlKey: true });
        expect(onContentChange).toHaveBeenLastCalledWith('<p>text</p>');
        await fireEvent.keyDown(node, { key: 'Z', keyCode: 90, ctrlKey: true, shiftKey: true });
        expect(onContentChange).toHaveBeenLastCalledWith('<p><strong>text</strong></p>');
    });

    it('Shift-Enter 插入换行，Enter 拆分段落', async () => {
        const { editor, onContentChange } = await mountEditor({ content: '<p>ab</p>' });
        editor.commands.setTextSelection(2);
        const node = $('.ProseMirror') as Element;
        await fireEvent.keyDown(node, { key: 'Enter', shiftKey: true });
        expect(onContentChange).toHaveBeenLastCalledWith('<p>a<br>b</p>');
        await fireEvent.keyDown(node, { key: 'Enter' });
        expect(onContentChange).toHaveBeenLastCalledWith('<p>a<br></p><p>b</p>');
    });

    it('能解析菜单栏可产生的每种格式的 HTML', async () => {
        const html = '<h2>h</h2><p><strong>b</strong><em>i</em><s>s</s><code>c</code><a href="https://semi.design">l</a></p><ul><li><p>u</p></li></ul><ol><li><p>o</p></li></ol><blockquote><p>q</p></blockquote><pre><code>k</code></pre><hr><p style="text-align: center">m</p>';
        const { editor } = await mountEditor({ content: html, editable: false });
        const names = new Set<string>();
        editor.state.doc.descendants((node) => {
            names.add(node.type.name);
            node.marks.forEach((mark) => names.add(mark.type.name));
        });
        expect([...names].toSorted((a, b) => a.localeCompare(b))).toEqual(['blockquote', 'bold', 'bulletList', 'code', 'codeBlock', 'heading', 'horizontalRule', 'italic', 'link', 'listItem', 'orderedList', 'paragraph', 'strike', 'text'].toSorted((a, b) => a.localeCompare(b)));
    });
});

describe('Svelte Sidebar 编辑器名称', () => {
    it('以文件名为编辑器命名，name 变化后跟随', async () => {
        const view = render(FileItem, { props: { name: 'notes.md', content: '<p>hello</p>' } });
        expect(await screen.findByRole('textbox', { name: 'notes.md' })).toHaveTextContent('hello');
        await view.rerender({ name: 'other.md' });
        await waitFor(() => expect(screen.getByRole('textbox', { name: 'other.md' })).toBeInTheDocument());
    });

    it('折叠列表中的只读编辑器以其文件名命名', async () => {
        render(FileContent, { props: { activeKey: 'a', files: [{ key: 'a', name: 'a.md', content: '<p>x</p>' }] } });
        expect(await screen.findByRole('textbox', { name: 'a.md' })).toBeInTheDocument();
    });
});

describe('Svelte Sidebar.FileContent', () => {
    const files = [
        { key: 'a', name: 'a.md', content: '<p>file a</p>' },
        { key: 'b', name: 'b.md', content: '<p>file b</p>' },
    ];

    it('为每个激活面板渲染一个只读编辑器，并报告展开点击', async () => {
        const onExpand = vi.fn<(event: MouseEvent, item: unknown, mode: string) => void>();
        render(FileContent, { props: { activeKey: ['a'], files, onExpand, class: 'custom' } });
        expect($('.semi-sidebar-collapse')).toHaveClass('semi-sidebar-collapse-file', 'custom');
        expect(screen.getByText('a.md')).toBeInTheDocument();
        expect(screen.getByText('b.md')).toBeInTheDocument();
        expect((await screen.findByText('file a')).closest('.ProseMirror')).toHaveAttribute('contenteditable', 'false');
        expect($('.semi-sidebar-file-menu-bar')).toBeNull();
        await fireEvent.click(document.querySelectorAll('.semi-sidebar-collapse-header-expand-btn')[1]);
        expect(onExpand).toHaveBeenCalledWith(expect.any(MouseEvent), files[1], 'file');
    });

    it('没有 onExpand 时不渲染展开按钮', async () => {
        render(FileContent, { props: { activeKey: ['a'], files } });
        await screen.findByText('file a');
        expect($('.semi-sidebar-collapse-header-expand-btn')).toBeNull();
    });

    it('条目的 extensions 与 imgUploadProps 传给只读预览', async () => {
        const { editors, extension } = captureEditors();
        render(FileContent, { props: { activeKey: 'a', files: [{ key: 'a', name: 'a.md', content: '<div data-type="image-upload"></div>', extensions: [extension], imgUploadProps: { action: 'https://semi.design/upload', accept: '.png' } }] } });
        await waitFor(() => expect(editors).toHaveLength(1));
        expect(editors[0].isEditable).toBe(false);
        expect((await slotInput()).getAttribute('accept')).toBe('.png');
    });
});

describe('Svelte Sidebar.CodeContent', () => {
    const codes = [
        { key: 'a', name: 'a.ts', content: 'const a = 1;', language: 'typescript' },
        { key: 'b', name: 'b.ts', content: 'const b = 2;', language: 'typescript' },
    ];

    it('渲染折叠面板与代码，展开按钮触发 onExpand(event, item, "code")', async () => {
        const onExpand = vi.fn<(event: MouseEvent, item: unknown, mode: string) => void>();
        render(CodeContent, { props: { activeKey: ['a'], codes, onExpand } });
        expect($('.semi-sidebar-collapse')).toHaveClass('semi-sidebar-collapse-code');
        expect(screen.getByText('a.ts')).toBeInTheDocument();
        await waitFor(() => expect($('.semi-sidebar-code-content')).toHaveTextContent('const a = 1;'));
        await fireEvent.click(document.querySelectorAll('.semi-sidebar-collapse-header-expand-btn')[0]);
        expect(onExpand).toHaveBeenCalledWith(expect.any(MouseEvent), codes[0], 'code');
    });

    it('点击面板头展开并触发 onChange', async () => {
        const onChange = vi.fn<(activeKey: string | string[]) => void>();
        render(CodeContent, { props: { codes, onChange } });
        await fireEvent.click(screen.getByText('b.ts'));
        expect(onChange).toHaveBeenCalledTimes(1);
        await waitFor(() => expect($('.semi-sidebar-code-content')).toHaveTextContent('const b = 2;'));
    });
});

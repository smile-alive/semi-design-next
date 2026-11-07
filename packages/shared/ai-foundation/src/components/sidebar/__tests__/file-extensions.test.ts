import { Editor } from '@tiptap/core';
import { describe, expect, it, vi } from 'vite-plus/test';
import { ImageUploadNode, canUploadImage, confirmLink, getEditorAttributes, getFileEditorExtensions, insertUploadedImage, readFileMenuState, readLinkEditorOpenState } from '../file-extensions';

function createEditor(content = '<p>hello</p>') {
    return new Editor({ extensions: [...getFileEditorExtensions(), ImageUploadNode], content });
}

describe('getFileEditorExtensions', () => {
    it('Bold 排在 Blockquote 之前，且不含图片上传节点', () => {
        const names = getFileEditorExtensions().map((extension) => extension.name);
        expect(names.indexOf('bold')).toBeLessThan(names.indexOf('blockquote'));
        expect(names).not.toContain('imageUpload');
    });

    it('每次调用返回新数组', () => {
        expect(getFileEditorExtensions()).not.toBe(getFileEditorExtensions());
    });
});

describe('canUploadImage 与 getEditorAttributes', () => {
    it('有 action 或 customRequest 才能上传', () => {
        expect(canUploadImage()).toBe(false);
        expect(canUploadImage({})).toBe(false);
        expect(canUploadImage({ action: '/upload' })).toBe(true);
        expect(canUploadImage({ customRequest: () => {} })).toBe(true);
    });

    it('有名称时才写 aria-label', () => {
        expect(getEditorAttributes('doc')).toEqual({ 'aria-label': 'doc' });
        expect(getEditorAttributes()).toEqual({});
    });
});

describe('readFileMenuState', () => {
    it('headingLevel 为当前标题级别，非标题时为 undefined', () => {
        const editor = createEditor('<h3>title</h3><p>text</p>');
        editor.commands.setTextSelection(2);
        expect(readFileMenuState(editor)).toMatchObject({ isHeading: true, headingLevel: 3 });
        editor.commands.setTextSelection(10);
        expect(readFileMenuState(editor)).toMatchObject({ isHeading: false, headingLevel: undefined, isParagraph: true });
        editor.destroy();
    });
});

describe('confirmLink', () => {
    it('空地址或被 Link 扩展拒绝的地址返回 false 且不改文档', () => {
        const editor = createEditor();
        expect(confirmLink(editor, '', null)).toBe(false);
        expect(confirmLink(editor, 'javascript:alert(1)', null)).toBe(false);
        expect(editor.getHTML()).toBe('<p>hello</p>');
        editor.destroy();
    });

    it('选区非空时给选区加链接', () => {
        const editor = createEditor();
        expect(confirmLink(editor, 'https://example.com', { from: 1, to: 6 })).toBe(true);
        expect(editor.getHTML()).toContain('<a ');
        expect(editor.getHTML()).toContain('href="https://example.com"');
        expect(editor.getHTML()).toContain('>hello</a>');
        editor.destroy();
    });

    it('选区为空时插入以地址为文本的链接', () => {
        const editor = createEditor();
        expect(confirmLink(editor, 'https://example.com', { from: 1, to: 1 })).toBe(true);
        expect(editor.getHTML()).toContain('>https://example.com</a>');
        editor.destroy();
    });
});

describe('readLinkEditorOpenState', () => {
    it('返回当前选区与链接地址', () => {
        const editor = createEditor('<p><a href="https://example.com">hello</a></p>');
        editor.commands.setTextSelection({ from: 1, to: 3 });
        expect(readLinkEditorOpenState(editor)).toEqual({ range: { from: 1, to: 3 }, href: 'https://example.com' });
        editor.destroy();
    });

    it('选区非空时高亮选区', () => {
        const editor = createEditor();
        editor.commands.setTextSelection({ from: 1, to: 3 });
        readLinkEditorOpenState(editor);
        expect(editor.getHTML()).toContain('class="select"');
        editor.destroy();
    });
});

describe('insertUploadedImage', () => {
    const insertSlot = (editor: Editor) => {
        editor.commands.setContent('<div data-type="image-upload"></div>');
        return editor.state.doc.child(0);
    };

    it.each([
        ['getUploadImageSrc', 'raw', (body: unknown) => `cdn:${body}`, 'cdn:raw'],
        ['字符串响应', 'https://a/b.png', undefined, 'https://a/b.png'],
        ['响应的 src 字段', { src: 'https://a/c.png' }, undefined, 'https://a/c.png'],
    ])('用 %s 取图片地址并替换占位节点', (_label, response, getUploadImageSrc, expected) => {
        const editor = createEditor();
        const slot = insertSlot(editor);
        insertUploadedImage({ editor, pos: 0, nodeSize: slot.nodeSize, type: 'image', response, name: 'a.png', getUploadImageSrc });
        expect(editor.state.doc.firstChild?.type.name).toBe('image');
        expect(editor.state.doc.firstChild?.attrs).toMatchObject({ src: expected, alt: 'a.png', title: 'a.png' });
        editor.destroy();
    });

    it('占位节点已不存在时只解析地址，不改文档', () => {
        const editor = createEditor();
        const before = editor.getHTML();
        const getUploadImageSrc = vi.fn<(response: unknown) => string>(() => 'x');
        insertUploadedImage({ editor, pos: undefined, nodeSize: 1, type: 'image', response: 'r', name: 'a.png', getUploadImageSrc });
        expect(getUploadImageSrc).toHaveBeenCalledWith('r');
        expect(editor.getHTML()).toBe(before);
        editor.destroy();
    });
});

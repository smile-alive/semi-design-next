import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vite-plus/test';
import { renderForm } from './helpers';

describe('Svelte Form 字段（浏览器）', () => {
    // fix #2448: inside Form.Upload the error outline of a failed picture card was hidden, so the card also draws
    // the error color as a border, kept inside its 96px box
    it('修复 #2448：FormUpload 中上传失败的图片卡片在卡片内显示错误边框', () => {
        const children = createRawSnippet(() => ({ render: () => '<span>+</span>' }));
        const { container } = renderForm({}, [
            {
                type: 'upload',
                props: { multiple: true, accept: 'image/*', action: 'https://semi.design/upload', field: 'files', initValue: [{ uid: '1', name: 'dy.png', status: 'uploadFail', url: '' }], listType: 'picture', children },
            },
        ]);
        const card = container.querySelector('.semi-upload-picture-file-card-error') as HTMLElement;
        expect(card).not.toBeNull();
        const style = getComputedStyle(card);
        expect(style.borderTopStyle).toBe('solid');
        expect(style.borderTopWidth).toBe('1px');
        expect(style.borderTopColor).toBe(style.outlineColor);
        expect(style.borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
        const { width, height } = card.getBoundingClientRect();
        expect(width).toBe(96);
        expect(height).toBe(96);
    });
});

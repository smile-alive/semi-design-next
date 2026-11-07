import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import Cropper from '../cropper.svelte';

describe('Svelte Cropper 服务端渲染', () => {
    it('首帧输出图片与裁剪框，裁剪框尚不可聚焦，aria-describedby 指向说明元素', () => {
        const { body } = render(Cropper, { props: { src: 'https://example.com/a.png' } });
        expect(body).toContain('class="semi-cropper-img"');
        expect(body).toContain('src="https://example.com/a.png"');
        expect(body).toContain('class="semi-cropper-box');
        expect(body).not.toContain('tabindex');
        const describedBy = /aria-describedby="([^"]+)"/.exec(body)?.[1];
        expect(describedBy).toBeTruthy();
        expect(body).toContain(`id="${describedBy}"`);
    });
});

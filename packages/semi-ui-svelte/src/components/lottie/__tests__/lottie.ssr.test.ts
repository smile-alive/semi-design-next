import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import Lottie from '../lottie.svelte';

describe('Svelte Lottie 服务端渲染', () => {
    it('首帧输出 aria-hidden 的外层 div', () => {
        const { body } = render(Lottie, { props: { params: { path: 'a.json' }, width: '10px' } });
        expect(body).toContain('class="semi-lottie"');
        expect(body).toContain('aria-hidden="true"');
        expect(body).toContain('width: 10px');
    });
});

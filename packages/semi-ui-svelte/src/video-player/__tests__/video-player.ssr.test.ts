import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import VideoFixture from './video-fixture.svelte';

describe('Svelte VideoPlayer 服务端首帧', () => {
    it('首帧带视频源、海报、暂停遮罩、控件名称与进度条', () => {
        const store = createStore({ props: { src: 'https://example.com/v.mp4', poster: 'https://example.com/p.png', width: 500, 'aria-label': 'Movie', 'data-x': '1' } });
        const { body } = render(VideoFixture, { props: { store } });
        expect(body).toContain('semi-videoPlayer-wrapper-dark');
        expect(body).toMatch(/<div[^>]*role="group"/);
        expect(body).toMatch(/<div[^>]*data-x="1"/);
        expect(body).toContain('width: 500px');
        expect(body).toMatch(/<video[^>]*src="https:\/\/example.com\/v.mp4"/);
        expect(body).toContain('https://example.com/p.png');
        expect(body).toContain('semi-videoPlayer-pause');
        expect(body).toContain('aria-label="播放"');
        expect(body).toContain('role="slider"');
        expect(body).toContain('00:00 / 00:00');
        expect(body).toContain('1.0x');
    });

    it('没有 src 时首帧显示资源缺失提示', () => {
        const store = createStore({ props: {} });
        const { body } = render(VideoFixture, { props: { store } });
        expect(body).toContain('semi-videoPlayer-resource-not-found');
    });
});

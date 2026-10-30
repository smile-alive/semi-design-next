import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import AudioFixture from './audio-fixture.svelte';

describe('Svelte AudioPlayer 服务端首帧', () => {
    it('首帧带 audio 源、曲目信息、控件名称与进度滑块', () => {
        const store = createStore({ props: { audioUrl: [{ src: 'https://example.com/a.mp3', title: 'Track A', cover: 'https://example.com/a.png' }, 'https://example.com/b.mp3'], autoPlay: true, 'aria-label': 'Song', 'data-x': '1' } });
        const { body } = render(AudioFixture, { props: { store } });
        expect(body).toContain('semi-audio-player-dark');
        expect(body).toMatch(/<div[^>]*role="group"/);
        expect(body).toMatch(/<div[^>]*data-x="1"/);
        expect(body).toMatch(/<audio[^>]*src="https:\/\/example.com\/a.mp3"/);
        expect(body).toMatch(/<audio[^>]*autoplay/);
        expect(body).toContain('Track A');
        expect(body).toContain('https://example.com/a.png');
        expect(body).toContain('aria-label="播放"');
        expect(body).toContain('aria-label="上一首"');
        expect(body).toContain('aria-label="播放进度"');
        expect(body).toContain('type="range"');
        expect(body).toContain('1.0x');
        expect(body).toContain('00:00');
    });
});

import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, silentWavUrl, tabTo } from '@test/utils/browser';
import VideoPlayer from '../video-player.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-videoPlayer`;
const DURATION = 60;
// A WAV in a video element still loads and plays, and needs no video fixture
const src = silentWavUrl(DURATION);
const query = <E extends Element = HTMLElement>(container: Element, selector: string) => container.querySelector<E>(selector) as E;
const playButton = (container: Element) => query(container, '.semi-icon-play').closest('button') as HTMLButtonElement;

describe('Svelte VideoPlayer（浏览器）', () => {
    it('点击播放按钮真实播放，再点击暂停', async () => {
        const { container } = render(VideoPlayer, { props: { src, muted: true } });
        const video = query<HTMLVideoElement>(container, 'video');
        await expect.poll(() => video.readyState).toBeGreaterThan(0);
        await userEvent.click(playButton(container));
        await expect.poll(() => video.paused).toBe(false);
        await userEvent.click(query(container, '.semi-icon-pause').closest('button') as HTMLButtonElement);
        await expect.poll(() => video.paused).toBe(true);
    });

    it('键盘聚焦播放按钮后显示主题焦点环，Space 切换播放', async () => {
        const { container } = render(VideoPlayer, { props: { src, muted: true } });
        const video = query<HTMLVideoElement>(container, 'video');
        const button = playButton(container);
        await tabTo(button);
        expectThemeFocusRing(button);
        await userEvent.keyboard(' ');
        await expect.poll(() => video.paused).toBe(false);
    });

    it('倍速菜单真实修改 playbackRate', async () => {
        const { container } = render(VideoPlayer, {
            props: {
                src,
                playbackRateList: [
                    { label: '1.0x', value: 1 },
                    { label: '2.0x', value: 2 },
                ],
            },
        });
        const video = query<HTMLVideoElement>(container, 'video');
        await userEvent.click(query(container, `.${prefixCls}-controls-popup`));
        const findItem = () => [...document.querySelectorAll<HTMLElement>(`.${prefixCls}-controls-popup-menu-item`)].find((el) => el.textContent?.trim() === '2.0x');
        await expect.poll(findItem).toBeTruthy();
        await userEvent.click(findItem() as HTMLElement);
        await expect.poll(() => video.playbackRate).toBe(2);
    });

    it('点击进度条真实跳转到对应位置', async () => {
        const { container } = render(VideoPlayer, { props: { src } });
        const video = query<HTMLVideoElement>(container, 'video');
        await expect.poll(() => video.duration).toBe(DURATION);
        const progress = query(container, `.${prefixCls}-progress`);
        const rect = progress.getBoundingClientRect();
        await userEvent.click(progress, { position: { x: Math.round(rect.width / 2), y: Math.round(rect.height / 2) } });
        await expect.poll(() => video.currentTime).toBeGreaterThan(DURATION / 2 - 3);
        expect(video.currentTime).toBeLessThan(DURATION / 2 + 3);
    });
});

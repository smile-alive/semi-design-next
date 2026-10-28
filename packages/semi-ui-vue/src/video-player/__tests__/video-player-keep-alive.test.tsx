/** @jsxImportSource vue */
import { KeepAlive, defineComponent } from 'vue';
import { fireEvent } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { countLiveListeners, render } from '@test/utils/vue';
import VideoPlayer from '../video-player.vue';

const Host = defineComponent({
    props: { active: { type: Boolean, required: true } },
    setup: (props) => () => <KeepAlive>{props.active ? <VideoPlayer src="https://example.com/video.mp4" /> : <p>other</p>}</KeepAlive>,
});

describe('VideoPlayer KeepAlive', () => {
    it('失活后释放 document 上的 keydown 与 fullscreenchange 监听，激活后恢复', async () => {
        const add = vi.spyOn(document, 'addEventListener');
        const remove = vi.spyOn(document, 'removeEventListener');
        const live = () => [countLiveListeners(add, remove, 'keydown'), countLiveListeners(add, remove, 'fullscreenchange')];
        const view = render(Host, { props: { active: true } });
        expect(live()).toEqual([1, 1]);

        await view.rerender({ active: false });
        expect(live()).toEqual([0, 0]);

        await view.rerender({ active: true });
        expect(live()).toEqual([1, 1]);
    });

    it('全屏中失活，浏览器在监听解除后退出全屏，重新激活时全屏按钮复位', async () => {
        const setFullscreenElement = (element: Element | null) => Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => element });
        try {
            const view = render(Host, { props: { active: true } });
            setFullscreenElement(view.container.querySelector('.semi-videoPlayer'));
            await fireEvent(document, new Event('fullscreenchange'));
            expect(view.getByRole('button', { name: '退出全屏' })).toBeInTheDocument();

            await view.rerender({ active: false });
            setFullscreenElement(null);
            await fireEvent(document, new Event('fullscreenchange'));
            await view.rerender({ active: true });
            expect(view.getByRole('button', { name: '全屏' })).toBeInTheDocument();
        } finally {
            delete (document as { fullscreenElement?: unknown }).fullscreenElement;
        }
    });
});

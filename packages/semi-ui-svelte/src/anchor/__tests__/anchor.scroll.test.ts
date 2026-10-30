import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import scrollIntoView from 'scroll-into-view-if-needed';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { AnchorProps } from '../interface';
import AnchorFixture from './anchor-fixture.svelte';
import { flat, type Fixture } from './fixture-data';

vi.mock('scroll-into-view-if-needed', () => ({ default: vi.fn<() => void>() }));

function renderAnchor(props: AnchorProps = {}) {
    const store = createStore<Fixture>({ props: { links: flat('docs'), ...props }, sections: ['docs'] });
    render(AnchorFixture, { props: { store } });
}
function clickDocs() {
    screen.getByRole('link', { name: 'docs' }).click();
    flushSync();
}

// runs the behavior the anchor handed to scroll-into-view-if-needed against one scrollable container
interface RecordedOptions {
    block?: string;
    behavior: (actions: object[]) => void;
}
// the call is read back as the plain-object form the anchor passes
const scrollOptions = () => vi.mocked(scrollIntoView).mock.calls.at(-1)?.[1] as unknown as RecordedOptions;
function runBehavior(action?: object) {
    const el = { scrollHeight: 500, clientHeight: 100, scroll: vi.fn<() => void>() };
    scrollOptions().behavior([{ el, top: 300, left: 40, ...action }]);
    return el.scroll;
}

describe('Svelte Anchor scrollIntoViewOptions', () => {
    beforeEach(() => {
        vi.mocked(scrollIntoView).mockClear();
    });

    it('默认把目标滚动到容器顶部', () => {
        renderAnchor();
        clickDocs();
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(vi.mocked(scrollIntoView).mock.calls[0][0]).toBe(document.getElementById('docs'));
        expect(scrollOptions()).toEqual({ block: 'start', behavior: expect.any(Function) });
        expect(runBehavior()).toHaveBeenCalledWith({ top: 300, left: undefined, behavior: 'auto' });
    });

    it('透传 block、inline、scrollMode 与 boundary，且 block 可覆盖默认值', () => {
        const boundary = document.createElement('div');
        renderAnchor({ scrollIntoViewOptions: { block: 'center', inline: 'start', scrollMode: 'if-needed', boundary } });
        clickDocs();
        expect(scrollOptions()).toEqual({ block: 'center', inline: 'start', scrollMode: 'if-needed', boundary, behavior: expect.any(Function) });
        // inline was asked for, so the horizontal position is applied too
        expect(runBehavior()).toHaveBeenCalledWith({ top: 300, left: 40, behavior: 'auto' });
    });

    it('scrollMotion 决定滚动行为，targetOffset 从滚动位置中减去', () => {
        renderAnchor({ scrollMotion: true, targetOffset: 50, scrollIntoViewOptions: { block: 'end' } });
        clickDocs();
        expect(scrollOptions().block).toBe('end');
        expect(runBehavior()).toHaveBeenCalledWith({ top: 250, left: undefined, behavior: 'smooth' });
    });

    it('不把 scrollIntoViewOptions 传给根元素', () => {
        renderAnchor({ scrollIntoViewOptions: { block: 'center' } });
        expect(screen.getByRole('navigation')).not.toHaveAttribute('scrollintoviewoptions');
    });
});

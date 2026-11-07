import { Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import useCSSAnimation, { type CSSAnimation } from '../css-animation';

let style: HTMLStyleElement;

beforeEach(() => {
    style = document.createElement('style');
    style.textContent = `
        @keyframes css-animation-test-fade { from { opacity: 0; } to { opacity: 1; } }
        .start { animation: css-animation-test-fade 150ms; }
        .child { animation: css-animation-test-fade 10ms; }
    `;
    document.head.append(style);
});

afterEach(() => {
    style.remove();
});

function Target(props: { animation: CSSAnimation }) {
    return (
        <div ref={props.animation.ref} class={props.animation.className()} data-testid="target">
            <span class="child" data-testid="child" />
        </div>
    );
}

function Animated(props: { onAnimationEnd: (stoppedByAnother: boolean) => void; portal?: boolean }) {
    const animation = useCSSAnimation({ startClassName: () => 'start', endClassName: () => 'end', onAnimationEnd: (stopped) => props.onAnimationEnd(stopped) });
    return (
        <Show when={props.portal} fallback={<Target animation={animation} />}>
            <Portal>
                <Target animation={animation} />
            </Portal>
        </Show>
    );
}

const target = () => screen.getByTestId('target');

describe('useCSSAnimation（浏览器）', () => {
    it('关键帧动画结束后切换到 end 类名，子元素先结束的动画不算', async () => {
        const onAnimationEnd = vi.fn<(stoppedByAnother: boolean) => void>();
        render(() => <Animated onAnimationEnd={onAnimationEnd} />);
        const childEnded = new Promise((resolve) => screen.getByTestId('child').addEventListener('animationend', resolve, { once: true }));
        expect(target().className).toBe('start');

        await childEnded;
        expect(target().className).toBe('start');
        expect(onAnimationEnd).not.toHaveBeenCalled();

        await waitFor(() => expect(target().className).toBe('end'));
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
        expect(onAnimationEnd).toHaveBeenCalledWith(false);
    });

    it('页面关闭了动画（animation: none）时挂载后立即结束', () => {
        style.textContent += '* { animation: none !important; }';
        const onAnimationEnd = vi.fn<(stoppedByAnother: boolean) => void>();
        render(() => <Animated onAnimationEnd={onAnimationEnd} />);
        expect(target().className).toBe('end');
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
    });

    it('Portal 中的元素挂载后检查到正在播放的动画，等它结束', async () => {
        const onAnimationEnd = vi.fn<(stoppedByAnother: boolean) => void>();
        render(() => <Animated portal onAnimationEnd={onAnimationEnd} />);
        expect(target().className).toBe('start');
        expect(onAnimationEnd).not.toHaveBeenCalled();
        await waitFor(() => expect(target().className).toBe('end'));
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
    });
});

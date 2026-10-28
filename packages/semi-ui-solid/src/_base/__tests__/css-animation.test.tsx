import { createRenderEffect, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import useCSSAnimation, { type CSSAnimationOptions } from '../css-animation';

function renderAnimated(options: Partial<CSSAnimationOptions>) {
    return render(() => {
        const animation = useCSSAnimation({ startClassName: () => 'start', endClassName: () => 'end', ...options });
        return (
            <div ref={animation.ref} class={animation.className()} style={animation.style()} data-animating={String(animation.isAnimating())} data-testid="target">
                <span data-testid="child" />
            </div>
        );
    });
}

const target = () => screen.getByTestId('target');
const animationStart = (node: Element) => node.dispatchEvent(new Event('animationstart', { bubbles: true }));
const animationEnd = (node: Element) => node.dispatchEvent(new Event('animationend', { bubbles: true }));
const callbacks = () => ({ onAnimationStart: vi.fn<() => void>(), onAnimationEnd: vi.fn<(stoppedByAnother: boolean) => void>() });

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useCSSAnimation', () => {
    beforeEach(() => {
        // the setup stubs getAnimations() with [], which would end every run at once
        vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ animationName: 'running' } as unknown as Animation]);
    });

    it('动画过程中应用 start 类名与 fillMode', () => {
        const { onAnimationStart, onAnimationEnd } = callbacks();
        renderAnimated({ fillMode: () => 'forwards', onAnimationStart, onAnimationEnd });
        expect(target().className).toBe('start');
        expect(target().style.animationFillMode).toBe('forwards');
        expect(target().dataset.animating).toBe('true');
        expect(onAnimationStart).toHaveBeenCalledTimes(1);
        expect(onAnimationEnd).not.toHaveBeenCalled();
    });

    it('animationstart 事件再次触发时调用 onAnimationStart', () => {
        const { onAnimationStart } = callbacks();
        renderAnimated({ onAnimationStart });
        animationStart(target());
        expect(onAnimationStart).toHaveBeenCalledTimes(2);
    });

    it('animationend 时切换到 end 类名', () => {
        const { onAnimationEnd } = callbacks();
        renderAnimated({ fillMode: () => 'both', onAnimationEnd });
        animationEnd(target());
        expect(target().className).toBe('end');
        expect(target().style.animationFillMode).toBe('both');
        expect(target().dataset.animating).toBe('false');
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
        expect(onAnimationEnd).toHaveBeenCalledWith(false);
    });

    it('未设置 endClassName 时，animationend 后不保留类名', () => {
        renderAnimated({ endClassName: undefined });
        animationEnd(target());
        expect(target().className).toBe('');
    });

    it('换成新的 start 类名时重新开始', () => {
        const { onAnimationStart, onAnimationEnd } = callbacks();
        const [start, setStart] = createSignal('enter');
        renderAnimated({ startClassName: start, onAnimationStart, onAnimationEnd });
        animationEnd(target());
        setStart('leave');
        expect(target().className).toBe('leave');
        expect(target().dataset.animating).toBe('true');
        expect(onAnimationStart).toHaveBeenCalledTimes(2);
        animationEnd(target());
        expect(target().className).toBe('end');
        expect(onAnimationEnd).toHaveBeenCalledTimes(2);
        expect(onAnimationEnd).toHaveBeenLastCalledWith(false);
    });

    it('动画中途换类名时，不上报被打断的动画', () => {
        const { onAnimationStart, onAnimationEnd } = callbacks();
        const [start, setStart] = createSignal('enter');
        renderAnimated({ startClassName: start, onAnimationStart, onAnimationEnd });
        setStart('leave');
        expect(target().className).toBe('leave');
        expect(onAnimationStart).toHaveBeenCalledTimes(2);
        expect(onAnimationEnd).not.toHaveBeenCalled();
    });

    it('同值写入不重新开始', () => {
        const { onAnimationStart } = callbacks();
        const [start, setStart] = createSignal('start', { equals: false });
        renderAnimated({ startClassName: start, onAnimationStart });
        animationEnd(target());
        setStart('start');
        expect(target().className).toBe('end');
        expect(target().dataset.animating).toBe('false');
        expect(onAnimationStart).toHaveBeenCalledTimes(1);
    });

    it('replayKey 变化时重播', () => {
        const { onAnimationStart } = callbacks();
        const [key, setKey] = createSignal('a', { equals: false });
        renderAnimated({ replayKey: key, onAnimationStart });
        animationEnd(target());
        setKey('a');
        expect(target().className).toBe('end');
        setKey('b');
        expect(target().className).toBe('start');
        expect(target().dataset.animating).toBe('true');
        expect(onAnimationStart).toHaveBeenCalledTimes(2);
    });

    it('关闭动效时立即结束', () => {
        const { onAnimationStart, onAnimationEnd } = callbacks();
        renderAnimated({ motion: () => false, fillMode: () => 'forwards', onAnimationStart, onAnimationEnd });
        expect(target().className).toBe('');
        expect(target().getAttribute('style')).toBeNull();
        expect(target().dataset.animating).toBe('false');
        expect(onAnimationStart).toHaveBeenCalledTimes(1);
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
        expect(onAnimationEnd).toHaveBeenCalledWith(false);
        animationStart(target());
        animationEnd(target());
        expect(onAnimationStart).toHaveBeenCalledTimes(1);
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
    });

    it('关闭动效时被重新开始，上报 stoppedByAnother', () => {
        const { onAnimationStart, onAnimationEnd } = callbacks();
        const [start, setStart] = createSignal('enter');
        renderAnimated({ startClassName: start, motion: () => false, onAnimationStart, onAnimationEnd });
        setStart('leave');
        expect(target().dataset.animating).toBe('false');
        expect(onAnimationStart).toHaveBeenCalledTimes(2);
        expect(onAnimationEnd).toHaveBeenCalledTimes(2);
        expect(onAnimationEnd).toHaveBeenLastCalledWith(true);
    });

    it('开启动效时重新开始', () => {
        const { onAnimationStart, onAnimationEnd } = callbacks();
        const [motion, setMotion] = createSignal(false);
        renderAnimated({ motion, onAnimationStart, onAnimationEnd });
        setMotion(true);
        expect(target().className).toBe('start');
        expect(target().dataset.animating).toBe('true');
        expect(onAnimationStart).toHaveBeenCalledTimes(2);
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
    });

    it('忽略从子元素冒泡上来的动画事件', () => {
        const { onAnimationStart, onAnimationEnd } = callbacks();
        renderAnimated({ onAnimationStart, onAnimationEnd });
        animationStart(screen.getByTestId('child'));
        animationEnd(screen.getByTestId('child'));
        expect(onAnimationStart).toHaveBeenCalledTimes(1);
        expect(onAnimationEnd).not.toHaveBeenCalled();
        expect(target().className).toBe('start');
        expect(target().dataset.animating).toBe('true');

        animationEnd(target());
        expect(target().className).toBe('end');
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
    });

    it('新的 start 类名与引起它的值在同一次更新中生效', () => {
        const commits: string[] = [];
        const [state, setState] = createSignal('enter');
        function Recorder() {
            const animation = useCSSAnimation({ startClassName: state, endClassName: () => 'end' });
            createRenderEffect(() => commits.push(`${state()}:${animation.className()}`));
            return null;
        }
        render(() => <Recorder />);
        setState('leave');
        expect(commits).toEqual(['enter:enter', 'leave:leave']);
    });

    it('关闭动效时从不上报 isAnimating', () => {
        const committed: boolean[] = [];
        function Recorder() {
            const animation = useCSSAnimation({ startClassName: () => 'start', motion: () => false });
            createRenderEffect(() => committed.push(animation.isAnimating()));
            return null;
        }
        render(() => <Recorder />);
        expect(committed).toEqual([false]);
    });
});

describe('useCSSAnimation 元素没有运行中的动画', () => {
    it('挂载后立即结束，且只上报一次', () => {
        const { onAnimationEnd } = callbacks();
        renderAnimated({ onAnimationEnd });
        expect(target().className).toBe('end');
        expect(target().dataset.animating).toBe('false');
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
        expect(onAnimationEnd).toHaveBeenCalledWith(false);
    });

    it('检查时元素已带上新的 start 类名', () => {
        const seen: string[] = [];
        vi.spyOn(Element.prototype, 'getAnimations').mockImplementation(function (this: Element) {
            seen.push(this.className);
            return [];
        });
        const [start, setStart] = createSignal('enter');
        renderAnimated({ startClassName: start });
        setStart('leave');
        expect(seen).toEqual(['enter', 'leave']);
        expect(target().className).toBe('end');
    });

    it('Portal 中稍后挂载的元素同样立即结束', () => {
        const { onAnimationEnd } = callbacks();
        function PortalHost() {
            const animation = useCSSAnimation({ startClassName: () => 'start', endClassName: () => 'end', onAnimationEnd });
            return (
                <Portal>
                    <div ref={animation.ref} class={animation.className()} data-testid="target" />
                </Portal>
            );
        }
        render(() => <PortalHost />);
        expect(target().className).toBe('end');
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
    });
});

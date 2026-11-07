import { StrictMode, useLayoutEffect, type ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import CSSAnimation from '../index';

type AnimationProps = ComponentProps<typeof CSSAnimation>;
type RenderArgs = Parameters<AnimationProps['children']>[0];

function Target({ animationClassName, animationStyle, animationEventsNeedBind, isAnimating }: RenderArgs) {
    return (
        <div className={animationClassName} style={animationStyle} data-animating={String(isAnimating)} data-testid="target" {...animationEventsNeedBind}>
            <span data-testid="child" />
        </div>
    );
}

function getAnimation(props: Partial<AnimationProps>) {
    return (
        <CSSAnimation endClassName="end" startClassName="start" animationState="enter" {...props}>
            {(args) => <Target {...args} />}
        </CSSAnimation>
    );
}

const target = () => screen.getByTestId('target');
// jsdom has no AnimationEvent, so React listens for the webkit-prefixed names
const animationStart = (node: Element) => fireEvent(node, new Event('webkitAnimationStart', { bubbles: true }));
const animationEnd = (node: Element) => fireEvent(node, new Event('webkitAnimationEnd', { bubbles: true }));

describe('CSSAnimation', () => {
    it('动画过程中应用 start 类名与 fillMode', () => {
        const onAnimationStart = vi.fn<() => void>();
        const onAnimationEnd = vi.fn<(stoppedByAnother: boolean) => void>();
        render(getAnimation({ fillMode: 'forwards', onAnimationStart, onAnimationEnd }));
        expect(target().className).toBe('start');
        expect(target().style.animationFillMode).toBe('forwards');
        expect(target().dataset.animating).toBe('true');
        expect(onAnimationStart).toHaveBeenCalledTimes(1);
        expect(onAnimationEnd).not.toHaveBeenCalled();
    });

    it('animationstart 事件再次触发时调用 onAnimationStart', () => {
        const onAnimationStart = vi.fn<() => void>();
        render(getAnimation({ onAnimationStart }));
        animationStart(target());
        expect(onAnimationStart).toHaveBeenCalledTimes(2);
    });

    it('animationend 时切换到 end 类名', () => {
        const onAnimationEnd = vi.fn<(stoppedByAnother: boolean) => void>();
        render(getAnimation({ fillMode: 'both', onAnimationEnd }));
        animationEnd(target());
        expect(target().className).toBe('end');
        expect(target().style.animationFillMode).toBe('both');
        expect(target().dataset.animating).toBe('false');
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
        expect(onAnimationEnd).toHaveBeenCalledWith(false);
    });

    it('未设置 endClassName 时，animationend 后不保留类名', () => {
        render(getAnimation({ endClassName: undefined }));
        animationEnd(target());
        expect(target().className).toBe('');
    });

    it('从 enter 切换到 leave 时，以新的 start 类名重新开始', () => {
        const onAnimationStart = vi.fn<() => void>();
        const onAnimationEnd = vi.fn<(stoppedByAnother: boolean) => void>();
        const { rerender } = render(getAnimation({ onAnimationStart, onAnimationEnd }));
        animationEnd(target());
        rerender(getAnimation({ animationState: 'leave', startClassName: 'leave', onAnimationStart, onAnimationEnd }));
        expect(target().className).toBe('leave');
        expect(target().dataset.animating).toBe('true');
        expect(onAnimationStart).toHaveBeenCalledTimes(2);
        animationEnd(target());
        expect(target().className).toBe('end');
        expect(onAnimationEnd).toHaveBeenCalledTimes(2);
        expect(onAnimationEnd).toHaveBeenLastCalledWith(false);
    });

    it('动画中途切换状态时，不上报被打断的动画', () => {
        const onAnimationStart = vi.fn<() => void>();
        const onAnimationEnd = vi.fn<(stoppedByAnother: boolean) => void>();
        const { rerender } = render(getAnimation({ onAnimationStart, onAnimationEnd }));
        rerender(getAnimation({ animationState: 'leave', startClassName: 'leave', onAnimationStart, onAnimationEnd }));
        expect(target().className).toBe('leave');
        expect(onAnimationStart).toHaveBeenCalledTimes(2);
        expect(onAnimationEnd).not.toHaveBeenCalled();
    });

    it('单独的 animationState 变化被忽略', () => {
        const onAnimationStart = vi.fn<() => void>();
        const { rerender } = render(getAnimation({ onAnimationStart }));
        animationEnd(target());
        rerender(getAnimation({ animationState: 'leave', onAnimationStart }));
        expect(target().className).toBe('end');
        expect(target().dataset.animating).toBe('false');
        expect(onAnimationStart).toHaveBeenCalledTimes(1);
    });

    it('replayKey 变化时重播', () => {
        const onAnimationStart = vi.fn<() => void>();
        const { rerender } = render(getAnimation({ replayKey: 'a', onAnimationStart }));
        animationEnd(target());
        rerender(getAnimation({ replayKey: 'a', onAnimationStart }));
        expect(target().className).toBe('end');
        rerender(getAnimation({ replayKey: 'b', onAnimationStart }));
        expect(target().className).toBe('start');
        expect(target().dataset.animating).toBe('true');
        expect(onAnimationStart).toHaveBeenCalledTimes(2);
    });

    it('关闭动效时立即结束', () => {
        const onAnimationStart = vi.fn<() => void>();
        const onAnimationEnd = vi.fn<(stoppedByAnother: boolean) => void>();
        render(getAnimation({ motion: false, fillMode: 'forwards', onAnimationStart, onAnimationEnd }));
        expect(target().className).toBe('');
        expect(target().getAttribute('style')).toBeNull();
        expect(target().dataset.animating).toBe('false');
        expect(onAnimationStart).toHaveBeenCalledTimes(1);
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
        expect(onAnimationEnd).toHaveBeenCalledWith(false);
        animationEnd(target());
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
    });

    it('关闭动效时被重新开始，上报 stoppedByAnother', () => {
        const onAnimationStart = vi.fn<() => void>();
        const onAnimationEnd = vi.fn<(stoppedByAnother: boolean) => void>();
        const { rerender } = render(getAnimation({ motion: false, onAnimationStart, onAnimationEnd }));
        rerender(
            getAnimation({
                motion: false,
                animationState: 'leave',
                startClassName: 'leave',
                onAnimationStart,
                onAnimationEnd,
            })
        );
        expect(target().dataset.animating).toBe('false');
        expect(onAnimationStart).toHaveBeenCalledTimes(2);
        expect(onAnimationEnd).toHaveBeenCalledTimes(2);
        expect(onAnimationEnd).toHaveBeenLastCalledWith(true);
    });

    it('开启动效时重新开始', () => {
        const onAnimationStart = vi.fn<() => void>();
        const onAnimationEnd = vi.fn<(stoppedByAnother: boolean) => void>();
        const { rerender } = render(getAnimation({ motion: false, onAnimationStart, onAnimationEnd }));
        rerender(getAnimation({ motion: true, onAnimationStart, onAnimationEnd }));
        expect(target().className).toBe('start');
        expect(target().dataset.animating).toBe('true');
        expect(onAnimationStart).toHaveBeenCalledTimes(2);
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
    });

    it('忽略从子元素冒泡上来的动画事件', () => {
        const onAnimationStart = vi.fn<() => void>();
        const onAnimationEnd = vi.fn<(stoppedByAnother: boolean) => void>();
        render(getAnimation({ onAnimationStart, onAnimationEnd }));
        expect(onAnimationStart).toHaveBeenCalledTimes(1);
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

    it('每次 StrictMode 挂载过程只触发一次挂载回调', () => {
        const onAnimationStart = vi.fn<() => void>();
        const onAnimationEnd = vi.fn<(stoppedByAnother: boolean) => void>();
        render(<StrictMode>{getAnimation({ onAnimationStart, onAnimationEnd })}</StrictMode>);
        expect(onAnimationStart).toHaveBeenCalledTimes(2);
        expect(onAnimationEnd).not.toHaveBeenCalled();
        animationEnd(target());
        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
    });

    it('每次 StrictMode 挂载过程只触发一次无动效回调', () => {
        const onAnimationStart = vi.fn<() => void>();
        const onAnimationEnd = vi.fn<(stoppedByAnother: boolean) => void>();
        render(<StrictMode>{getAnimation({ motion: false, onAnimationStart, onAnimationEnd })}</StrictMode>);
        expect(onAnimationStart).toHaveBeenCalledTimes(2);
        expect(onAnimationEnd).toHaveBeenCalledTimes(2);
        expect(onAnimationEnd).toHaveBeenNthCalledWith(2, false);
    });

    it('新的 start 类名与新 props 一起提交', () => {
        const commits: string[] = [];
        function Recorder({ animationState, animationClassName }: { animationState: string; animationClassName: string }) {
            useLayoutEffect(() => {
                commits.push(`${animationState}:${animationClassName}`);
            });
            return null;
        }
        const animation = (animationState: AnimationProps['animationState']) => (
            <CSSAnimation endClassName="end" startClassName={animationState} animationState={animationState}>
                {({ animationClassName }) => <Recorder animationClassName={animationClassName} animationState={animationState} />}
            </CSSAnimation>
        );
        const { rerender } = render(animation('enter'));
        rerender(animation('leave'));
        expect(commits).toEqual(['enter:enter', 'leave:leave']);
    });

    it('关闭动效时从不上报 isAnimating', () => {
        const committed: boolean[] = [];
        function Recorder({ isAnimating }: { isAnimating: boolean }) {
            useLayoutEffect(() => {
                committed.push(isAnimating);
            });
            return null;
        }
        render(
            <CSSAnimation startClassName="start" animationState="enter" motion={false}>
                {({ isAnimating }) => <Recorder isAnimating={isAnimating} />}
            </CSSAnimation>
        );
        expect(committed).toEqual([false]);
    });
});

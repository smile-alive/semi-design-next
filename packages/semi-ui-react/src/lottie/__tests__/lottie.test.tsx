import { StrictMode, createRef } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import lottie from 'lottie-web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import Lottie, { type LottieProps } from '../index';

// a hoisted mock the tests read directly: lottie-web types loadAnimation as a method, which lint forbids passing around
const loadAnimation = vi.hoisted(() => {
    const animation = (params: object) => ({
        params,
        destroy: vi.fn<() => void>(),
        play: vi.fn<() => void>(),
        pause: vi.fn<() => void>(),
    });
    return vi.fn<typeof animation>(animation);
});
vi.mock('lottie-web', () => ({ default: { loadAnimation } }));

type MediaHandler = (event: { matches: boolean }) => void;

interface ReducedMotionList {
    media: string;
    matches: boolean;
    handlers: MediaHandler[];
    addEventListener: (type: string, handler: MediaHandler, options?: { signal?: AbortSignal }) => number;
    removeEventListener: (type: string, handler: MediaHandler) => void;
    set: (matches: boolean) => void;
}

// the setup's matchMedia never matches or fires changes; this one reports the reduced-motion setting and can flip it
function mockReducedMotion(initial: boolean) {
    const original = window.matchMedia;
    const list: ReducedMotionList = {
        media: '(prefers-reduced-motion: reduce)',
        matches: initial,
        handlers: [],
        addEventListener: vi.fn<ReducedMotionList['addEventListener']>((_, handler, options) => {
            options?.signal?.addEventListener('abort', () => list.removeEventListener('change', handler));
            return list.handlers.push(handler);
        }),
        removeEventListener: vi.fn<ReducedMotionList['removeEventListener']>((_, handler) => {
            list.handlers = list.handlers.filter((h) => h !== handler);
        }),
        set(matches) {
            list.matches = matches;
            list.handlers.forEach((handler) => handler({ matches }));
        },
    };
    window.matchMedia = vi.fn<typeof window.matchMedia>((media) => (media.includes('prefers-reduced-motion') ? (list as unknown as MediaQueryList) : original(media)));
    return { list, restore: () => (window.matchMedia = original) };
}

const animations = () => loadAnimation.mock.results.map((result) => result.value);
const live = () => animations().filter((animation) => animation.destroy.mock.calls.length === 0);
// lottie-web is imported on demand, so animations appear a few microtasks after mounting
const loaded = (count = 1) => waitFor(() => expect(loadAnimation).toHaveBeenCalledTimes(count));

describe('Lottie', () => {
    // the setup's matchMedia matches every query without a width condition, which would read as reduced motion
    let motion;
    beforeEach(() => {
        loadAnimation.mockClear();
        motion = mockReducedMotion(false);
    });
    afterEach(() => motion.restore());

    it('渲染带 className、style、width、height 与 data-* 属性的外层 div', () => {
        const { container } = render(<Lottie className="custom" style={{ top: '1px' }} data-testid="lottie" height="200px" params={{ path: 'a.json' }} width="300px" />);
        const root = container.firstChild as HTMLElement;
        expect(root.tagName).toBe('DIV');
        expect(root).toHaveClass('semi-lottie', 'custom');
        expect(root).toHaveStyle({ width: '300px', height: '200px', top: '1px' });
        expect(root).toHaveAttribute('data-testid', 'lottie');
        expect(root).toBeEmptyDOMElement();
    });

    it('style 覆盖 width 与 height', () => {
        const { container } = render(<Lottie style={{ width: '10px' }} params={{}} width="300px" />);
        expect(container.firstChild).toHaveStyle({ width: '10px' });
    });

    it('以 svg 方式把动画加载到外层，loop 与 autoplay 默认值可被 params 覆盖', async () => {
        const { container } = render(<Lottie params={{ path: 'a.json', loop: false, renderer: 'canvas' }} />);
        await loaded();
        expect(loadAnimation).toHaveBeenCalledWith({
            container: container.firstChild,
            renderer: 'canvas',
            loop: false,
            autoplay: true,
            path: 'a.json',
        });
    });

    it('使用 params.container，自身不渲染任何内容', async () => {
        const target = document.createElement('div');
        const { container } = render(<Lottie params={{ container: target, animationData: {} }} />);
        expect(container).toBeEmptyDOMElement();
        await loaded();
        expect(loadAnimation).toHaveBeenCalledWith({
            container: target,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: {},
        });
    });

    it('把动画传给 getAnimationInstance，把 lottie 模块传给 getLottie', async () => {
        const getAnimationInstance = vi.fn<NonNullable<LottieProps['getAnimationInstance']>>();
        const getLottie = vi.fn<NonNullable<LottieProps['getLottie']>>();
        render(<Lottie getAnimationInstance={getAnimationInstance} getLottie={getLottie} params={{}} />);
        await loaded();
        expect(getAnimationInstance).toHaveBeenLastCalledWith(animations()[0]);
        expect(getLottie).toHaveBeenCalledTimes(1);
        expect(getLottie).toHaveBeenCalledWith(lottie);
    });

    it('加载动画失败时输出错误日志而不是放任未处理的 rejection，之后的更新仍可重新加载', async () => {
        const listeners = process.listeners('unhandledRejection');
        const reasons: string[] = [];
        process.removeAllListeners('unhandledRejection');
        process.on('unhandledRejection', (reason) => reasons.push(String(reason)));
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        loadAnimation.mockImplementationOnce(() => {
            throw new Error('bad animation data');
        });
        try {
            const getAnimationInstance = vi.fn<NonNullable<LottieProps['getAnimationInstance']>>();
            const { rerender } = render(<Lottie getAnimationInstance={getAnimationInstance} params={{ path: 'bad.json' }} />);
            await waitFor(() => expect(error).toHaveBeenCalledTimes(1));
            expect(String(error.mock.calls[0][0])).toMatch(/bad animation data/);
            await new Promise((resolve) => setTimeout(resolve, 20));
            expect(reasons).toEqual([]);
            expect(getAnimationInstance).not.toHaveBeenCalled();

            rerender(<Lottie getAnimationInstance={getAnimationInstance} params={{ path: 'good.json' }} />);
            await waitFor(() => expect(getAnimationInstance).toHaveBeenCalledTimes(1));
        } finally {
            error.mockRestore();
            process.removeAllListeners('unhandledRejection');
            for (const listener of listeners) {
                process.on('unhandledRejection', listener);
            }
        }
    });

    it('静态 getLottie 解析为 lottie 模块', async () => {
        const result = Lottie.getLottie();
        expect(result).toBeInstanceOf(Promise);
        await expect(result).resolves.toBe(lottie);
    });

    it('params 深度相等时保留动画，变化时重新加载', async () => {
        const getAnimationInstance = vi.fn<NonNullable<LottieProps['getAnimationInstance']>>();
        const { rerender } = render(<Lottie getAnimationInstance={getAnimationInstance} params={{ path: 'a.json', loop: false }} />);
        await loaded();
        rerender(<Lottie getAnimationInstance={getAnimationInstance} params={{ path: 'a.json', loop: false }} />);
        expect(loadAnimation).toHaveBeenCalledTimes(1);

        rerender(<Lottie getAnimationInstance={getAnimationInstance} params={{ path: 'b.json', loop: false }} />);
        await loaded(2);
        const [first, second] = animations();
        expect(first.destroy).toHaveBeenCalledTimes(1);
        expect(second.params.path).toBe('b.json');
        expect(getAnimationInstance).toHaveBeenLastCalledWith(second);
        expect(live()).toEqual([second]);
    });

    it('仅 width、height、className 或 style 变化时不重新加载', async () => {
        const { rerender } = render(<Lottie params={{ path: 'a.json' }} width="1px" />);
        await loaded();
        rerender(<Lottie className="x" style={{ top: 0 }} height="3px" params={{ path: 'a.json' }} width="2px" />);
        expect(loadAnimation).toHaveBeenCalledTimes(1);
    });

    it('卸载时销毁动画', async () => {
        const { unmount } = render(<Lottie params={{}} />);
        await loaded();
        const [animation] = animations();
        expect(animation.destroy).not.toHaveBeenCalled();
        unmount();
        expect(animation.destroy).toHaveBeenCalledTimes(1);
        expect(live()).toEqual([]);
    });

    it('StrictMode 下只保留一个存活的动画，卸载后不保留', async () => {
        const { container, unmount } = render(
            <StrictMode>
                <Lottie params={{ path: 'a.json' }} />
            </StrictMode>
        );
        await loaded();
        // the remount's load has to settle too before a stale second animation could show up
        await new Promise((resolve) => setTimeout(resolve));
        expect(live()).toHaveLength(1);
        expect(live()[0].params.container).toBe(container.firstChild);
        unmount();
        expect(live()).toEqual([]);
    });

    it('每创建一个动画，调用一次 getAnimationInstance', async () => {
        const getAnimationInstance = vi.fn<NonNullable<LottieProps['getAnimationInstance']>>();
        render(<Lottie getAnimationInstance={getAnimationInstance} params={{}} />);
        await loaded();
        expect(getAnimationInstance).toHaveBeenCalledTimes(1);
    });

    it('ref 绑定到外层 div', () => {
        const ref = createRef<HTMLDivElement>();
        const { container } = render(<Lottie ref={ref} params={{}} />);
        expect(ref.current).toBe(container.firstChild);
    });

    it('未知属性透传到外层 div', () => {
        const { container } = render(<Lottie id="anim" aria-label="loading" params={{}} />);
        expect(container.firstChild).toHaveAttribute('id', 'anim');
        expect(container.firstChild).toHaveAttribute('aria-label', 'loading');
        expect(container.firstChild).not.toHaveAttribute('params');
    });

    describe('减少动态效果', () => {
        it('用户要求减少动态效果时，不自动开始播放', async () => {
            motion.list.matches = true;
            render(<Lottie params={{ path: 'a.json' }} />);
            await loaded();
            expect(loadAnimation).toHaveBeenCalledWith(expect.objectContaining({ autoplay: false, loop: true }));
        });

        it('用户要求减少动态效果时，仍保留显式设置的 autoplay', async () => {
            motion.list.matches = true;
            render(<Lottie params={{ path: 'a.json', autoplay: true }} />);
            await loaded();
            expect(loadAnimation).toHaveBeenCalledWith(expect.objectContaining({ autoplay: true }));
        });

        it('设置变化时，暂停并恢复默认自动播放的动画', async () => {
            render(<Lottie params={{ path: 'a.json' }} />);
            await loaded();
            const [animation] = animations();
            await act(() => motion.list.set(true));
            expect(animation.pause).toHaveBeenCalledTimes(1);
            await act(() => motion.list.set(false));
            expect(animation.play).toHaveBeenCalledTimes(1);
        });

        it('设置变化时，不改动显式设置的 autoplay', async () => {
            render(<Lottie params={{ path: 'a.json', autoplay: false }} />);
            await loaded();
            const [animation] = animations();
            await act(() => motion.list.set(true));
            await act(() => motion.list.set(false));
            expect(animation.pause).not.toHaveBeenCalled();
            expect(animation.play).not.toHaveBeenCalled();
        });

        it('卸载时停止监听', async () => {
            const { unmount } = render(<Lottie params={{ path: 'a.json' }} />);
            await loaded();
            expect(motion.list.handlers).toHaveLength(1);
            unmount();
            expect(motion.list.handlers).toHaveLength(0);
        });
    });

    describe('语义', () => {
        it('未命名（装饰性）的动画对辅助技术隐藏', () => {
            const { container } = render(<Lottie params={{}} />);
            expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
            expect(container.firstChild).not.toHaveAttribute('role');
        });

        it('有名称的动画暴露为 image', () => {
            render(<Lottie aria-label="Loading" params={{}} />);
            const image = screen.getByRole('img', { name: 'Loading' });
            expect(image).not.toHaveAttribute('aria-hidden');
        });

        it('调用方可以覆盖 role 与隐藏状态', () => {
            const { container } = render(<Lottie aria-hidden="false" role="presentation" params={{}} />);
            expect(container.firstChild).toHaveAttribute('aria-hidden', 'false');
            expect(container.firstChild).toHaveAttribute('role', 'presentation');
        });
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Lottie: { className: 'global', width: '42px' } };
        try {
            const { container } = render(<Lottie params={{}} />);
            expect(container.firstChild).toHaveClass('semi-lottie', 'global');
            expect(container.firstChild).toHaveStyle({ width: '42px' });
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });
});

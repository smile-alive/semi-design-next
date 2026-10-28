import { createSignal, onMount } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Lottie, { type LottieProps } from '..';
import semiGlobal from '../../_utils/semi-global';

// a hoisted mock the tests read directly: lottie-web types loadAnimation as a method, which lint forbids passing around
const loadAnimation = vi.hoisted(() => {
    const animation = (params: { path?: string; container?: Element }) => ({
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
    let motion: ReturnType<typeof mockReducedMotion>;
    beforeEach(() => {
        loadAnimation.mockClear();
        motion = mockReducedMotion(false);
    });
    afterEach(() => {
        motion.restore();
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('渲染带 class、style、width、height 与 data-* 属性的外层 div', () => {
        const { container } = render(() => <Lottie class="custom" style={{ top: '1px' }} data-testid="lottie" height="200px" params={{ path: 'a.json' }} width="300px" />);
        const root = container.firstChild as HTMLElement;
        expect(root.tagName).toBe('DIV');
        expect(root).toHaveClass('semi-lottie', 'custom');
        expect(root).toHaveStyle({ width: '300px', height: '200px', top: '1px' });
        expect(root).toHaveAttribute('data-testid', 'lottie');
        expect(root).toBeEmptyDOMElement();
    });

    it('style 覆盖 width 与 height', () => {
        const { container } = render(() => <Lottie style={{ width: '10px' }} params={{}} width="300px" />);
        expect(container.firstChild).toHaveStyle({ width: '10px' });
    });

    it('字符串形式的 style 与 width、height 合并', () => {
        const style: string = 'top: 1px';
        const { container } = render(() => <Lottie style={style} params={{}} width="300px" height="200px" />);
        expect(container.firstChild).toHaveStyle({ width: '300px', height: '200px', top: '1px' });
    });

    it('以 svg 方式把动画加载到外层，loop 与 autoplay 默认值可被 params 覆盖', async () => {
        const { container } = render(() => <Lottie params={{ path: 'a.json', loop: false, renderer: 'canvas' }} />);
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
        const { container } = render(() => <Lottie params={{ container: target, animationData: {} }} />);
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
        render(() => <Lottie getAnimationInstance={getAnimationInstance} getLottie={getLottie} params={{}} />);
        await loaded();
        expect(getAnimationInstance).toHaveBeenLastCalledWith(animations()[0]);
        expect(getLottie).toHaveBeenCalledTimes(1);
        expect(getLottie).toHaveBeenCalledWith({ loadAnimation });
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
            const [params, setParams] = createSignal({ path: 'bad.json' });
            render(() => <Lottie getAnimationInstance={getAnimationInstance} params={params()} />);
            await waitFor(() => expect(error).toHaveBeenCalledTimes(1));
            expect(String(error.mock.calls[0][0])).toMatch(/bad animation data/);
            await new Promise((resolve) => setTimeout(resolve, 20));
            expect(reasons).toEqual([]);
            expect(getAnimationInstance).not.toHaveBeenCalled();

            setParams({ path: 'good.json' });
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
        await expect(result).resolves.toEqual({ loadAnimation });
    });

    it('params 深度相等时保留动画，变化时重新加载', async () => {
        const getAnimationInstance = vi.fn<NonNullable<LottieProps['getAnimationInstance']>>();
        const [params, setParams] = createSignal({ path: 'a.json', loop: false });
        render(() => <Lottie getAnimationInstance={getAnimationInstance} params={params()} />);
        await loaded();
        setParams({ path: 'a.json', loop: false });
        expect(loadAnimation).toHaveBeenCalledTimes(1);

        setParams({ path: 'b.json', loop: false });
        await loaded(2);
        const [first, second] = animations();
        expect(first.destroy).toHaveBeenCalledTimes(1);
        expect(second.params.path).toBe('b.json');
        expect(getAnimationInstance).toHaveBeenLastCalledWith(second);
        expect(live()).toEqual([second]);
    });

    it('params 中的 container 取消后，重新加载到外层 div', async () => {
        const target = document.createElement('div');
        const [params, setParams] = createSignal<LottieProps['params']>({ container: target });
        const { container } = render(() => <Lottie params={params()} />);
        await loaded();
        expect(container).toBeEmptyDOMElement();

        setParams({ path: 'a.json' });
        await loaded(2);
        expect(loadAnimation.mock.calls[1][0]).toMatchObject({ container: container.firstChild, path: 'a.json' });
        expect(live()).toHaveLength(1);
    });

    it('仅 width、height、class 或 style 变化时不重新加载', async () => {
        const [props, setProps] = createSignal<LottieProps>({ params: { path: 'a.json' }, width: '1px' });
        render(() => <Lottie {...props()} />);
        await loaded();
        setProps({ class: 'x', style: { top: '0px' }, height: '3px', params: { path: 'a.json' }, width: '2px' });
        expect(loadAnimation).toHaveBeenCalledTimes(1);
    });

    it('卸载时销毁动画', async () => {
        const { unmount } = render(() => <Lottie params={{}} />);
        await loaded();
        const [animation] = animations();
        expect(animation.destroy).not.toHaveBeenCalled();
        unmount();
        expect(animation.destroy).toHaveBeenCalledTimes(1);
        expect(live()).toEqual([]);
    });

    it('每创建一个动画，调用一次 getAnimationInstance', async () => {
        const getAnimationInstance = vi.fn<NonNullable<LottieProps['getAnimationInstance']>>();
        render(() => <Lottie getAnimationInstance={getAnimationInstance} params={{}} />);
        await loaded();
        expect(getAnimationInstance).toHaveBeenCalledTimes(1);
    });

    it('ref 绑定到外层 div', () => {
        let ref: HTMLDivElement | undefined;
        const { container } = render(() => <Lottie ref={(node) => (ref = node)} params={{}} />);
        expect(ref).toBe(container.firstChild);
    });

    it('未知属性透传到外层 div', () => {
        const { container } = render(() => <Lottie id="anim" aria-label="loading" params={{}} />);
        expect(container.firstChild).toHaveAttribute('id', 'anim');
        expect(container.firstChild).toHaveAttribute('aria-label', 'loading');
        expect(container.firstChild).not.toHaveAttribute('params');
    });

    describe('减少动态效果', () => {
        it('用户要求减少动态效果时，不自动开始播放', async () => {
            motion.list.matches = true;
            render(() => <Lottie params={{ path: 'a.json' }} />);
            await loaded();
            expect(loadAnimation).toHaveBeenCalledWith(expect.objectContaining({ autoplay: false, loop: true }));
        });

        it('用户要求减少动态效果时，仍保留显式设置的 autoplay', async () => {
            motion.list.matches = true;
            render(() => <Lottie params={{ path: 'a.json', autoplay: true }} />);
            await loaded();
            expect(loadAnimation).toHaveBeenCalledWith(expect.objectContaining({ autoplay: true }));
        });

        it('设置变化时，暂停并恢复默认自动播放的动画', async () => {
            render(() => <Lottie params={{ path: 'a.json' }} />);
            await loaded();
            const [animation] = animations();
            motion.list.set(true);
            expect(animation.pause).toHaveBeenCalledTimes(1);
            motion.list.set(false);
            expect(animation.play).toHaveBeenCalledTimes(1);
        });

        it('设置变化时，不改动显式设置的 autoplay', async () => {
            render(() => <Lottie params={{ path: 'a.json', autoplay: false }} />);
            await loaded();
            const [animation] = animations();
            motion.list.set(true);
            motion.list.set(false);
            expect(animation.pause).not.toHaveBeenCalled();
            expect(animation.play).not.toHaveBeenCalled();
        });

        it('卸载时停止监听', async () => {
            const { unmount } = render(() => <Lottie params={{ path: 'a.json' }} />);
            await loaded();
            expect(motion.list.handlers).toHaveLength(1);
            unmount();
            expect(motion.list.handlers).toHaveLength(0);
        });
    });

    describe('语义', () => {
        it('未命名（装饰性）的动画对辅助技术隐藏', () => {
            const { container } = render(() => <Lottie params={{}} />);
            expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
            expect(container.firstChild).not.toHaveAttribute('role');
        });

        it('有名称的动画暴露为 image', () => {
            render(() => <Lottie aria-label="Loading" params={{}} />);
            const image = screen.getByRole('img', { name: 'Loading' });
            expect(image).not.toHaveAttribute('aria-hidden');
        });

        it('调用方可以覆盖 role 与隐藏状态', () => {
            const { container } = render(() => <Lottie aria-hidden="false" role="presentation" params={{}} />);
            expect(container.firstChild).toHaveAttribute('aria-hidden', 'false');
            expect(container.firstChild).toHaveAttribute('role', 'presentation');
        });
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Lottie: { class: 'global', width: '42px' } };
        const { container } = render(() => <Lottie params={{}} />);
        expect(container.firstChild).toHaveClass('semi-lottie', 'global');
        expect(container.firstChild).toHaveStyle({ width: '42px' });
    });

    it('父组件挂载时就换了 params，之后换回最初的 params 时重新加载', async () => {
        const initial = { path: 'a.json' };
        const [params, setParams] = createSignal(initial);
        function Demo() {
            onMount(() => setParams({ path: 'b.json' }));
            return <Lottie params={params()} />;
        }
        render(() => <Demo />);
        await loaded(1);
        expect(loadAnimation.mock.lastCall?.[0].path).toBe('b.json');
        setParams(initial);
        await loaded(2);
        expect(loadAnimation.mock.lastCall?.[0].path).toBe('a.json');
    });

    it('整体替换 props 时保留根节点', () => {
        const params = { path: 'a.json' };
        const [props, setProps] = createSignal<LottieProps>({ params, title: 'a' });
        const { container } = render(() => <Lottie {...props()} />);
        const root = container.firstChild;
        setProps({ params, title: 'b' });
        expect(container.firstChild).toBe(root);
        expect(root).toHaveAttribute('title', 'b');
    });
});

/** @jsxImportSource vue */
import { createSSRApp, isReactive, reactive, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { screen, waitFor } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import Lottie, { type LottieParams } from '..';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import CachedLottie from './fixtures/cached-lottie.vue';

// a hoisted mock the tests read directly: lottie-web types loadAnimation as a method, which lint forbids passing
// around. The module object is hoisted too, because semi-ui-vue does not depend on lottie-web to import it.
const { loadAnimation, lottie } = vi.hoisted(() => {
    const animation = (params: Record<string, unknown>) => ({
        params,
        destroy: vi.fn<() => void>(),
        play: vi.fn<() => void>(),
        pause: vi.fn<() => void>(),
    });
    const loadAnimation = vi.fn<typeof animation>(animation);
    return { loadAnimation, lottie: { loadAnimation } };
});
vi.mock('lottie-web', () => ({ default: lottie }));

type MediaHandler = (event: { matches: boolean }) => void;

interface ReducedMotionList {
    media: string;
    matches: boolean;
    handlers: MediaHandler[];
    addEventListener: (type: string, handler: MediaHandler, options?: { signal?: AbortSignal }) => number;
    removeEventListener: (type: string, handler: MediaHandler) => void;
    set: (matches: boolean) => void;
}

// the setup's matchMedia never matches and never fires changes; this one reports the reduced-motion setting and can
// flip it
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
const getRoot = (container: Element) => {
    const root = container.querySelector<HTMLElement>('.semi-lottie');
    if (!root) throw new Error('missing .semi-lottie');
    return root;
};

describe('Lottie', () => {
    // the setup's matchMedia matches every query without a width condition, which would read as reduced motion
    let motion: ReturnType<typeof mockReducedMotion>;
    beforeEach(() => {
        loadAnimation.mockClear();
        motion = mockReducedMotion(false);
    });
    afterEach(() => motion.restore());

    it('渲染带 class、style、width、height 与 data-* 属性的外层 div', () => {
        const { container } = render(Lottie, {
            attrs: { class: 'custom', style: { top: '1px' }, 'data-testid': 'lottie' },
            props: { height: '200px', params: { path: 'a.json' }, width: '300px' },
        });
        const root = container.firstElementChild as HTMLElement;
        expect(root.tagName).toBe('DIV');
        expect(root).toHaveClass('semi-lottie', 'custom');
        expect(root).toHaveStyle({ width: '300px', height: '200px', top: '1px' });
        expect(root).toHaveAttribute('data-testid', 'lottie');
        expect(root).toBeEmptyDOMElement();
    });

    it('style 覆盖 width 与 height', () => {
        const { container } = render(Lottie, {
            attrs: { style: { width: '10px' } },
            props: { params: {}, width: '300px' },
        });
        expect(getRoot(container)).toHaveStyle({ width: '10px' });
    });

    it('以 svg 方式把动画加载到外层，loop 与 autoplay 默认值可被 params 覆盖', async () => {
        const { container } = render(Lottie, {
            props: { params: { path: 'a.json', loop: false, renderer: 'canvas' } },
        });
        await loaded();
        expect(loadAnimation).toHaveBeenCalledWith({
            container: getRoot(container),
            renderer: 'canvas',
            loop: false,
            autoplay: true,
            path: 'a.json',
        });
    });

    it('使用 params.container，自身只渲染注释节点并丢弃 attrs', async () => {
        const target = document.createElement('div');
        const { container } = render(Lottie, {
            attrs: { id: 'dropped', class: 'dropped' },
            props: { params: { container: target, animationData: {} } },
        });
        expect(container.children).toHaveLength(0);
        expect(container.innerHTML.replace(/<!--.*?-->/g, '')).toBe('');
        await loaded();
        expect(loadAnimation).toHaveBeenCalledWith({
            container: target,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: {},
        });
    });

    it('params.container 在更新中由有变无时，外层 div 出现并把动画加载到它', async () => {
        const target = document.createElement('div');
        const view = render(Lottie, { props: { params: { container: target } } });
        await loaded();
        await view.rerender({ params: { path: 'a.json' } });
        await loaded(2);
        expect(loadAnimation.mock.calls[1][0]).toMatchObject({ container: getRoot(view.container), path: 'a.json' });
    });

    it('把动画作为 getAnimationInstance 事件的载荷，把 lottie 模块作为 getLottie 事件的载荷', async () => {
        const view = render(Lottie, { props: { params: {} } });
        await loaded();
        expect(view.emitted('getAnimationInstance')).toEqual([[animations()[0]]]);
        expect(view.emitted('getLottie')).toEqual([[lottie]]);
    });

    it('getLottie 每个挂载只通知一次，getAnimationInstance 随每次重载通知', async () => {
        const view = render(Lottie, { props: { params: { path: 'a.json' } } });
        await loaded();
        await view.rerender({ params: { path: 'b.json' } });
        await loaded(2);
        await waitFor(() => expect(view.emitted('getAnimationInstance')).toHaveLength(2));
        expect(view.emitted('getLottie')).toHaveLength(1);
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
            const view = render(Lottie, { props: { params: { path: 'bad.json' } } });
            await waitFor(() => expect(error).toHaveBeenCalledTimes(1));
            expect(String(error.mock.calls[0][0])).toMatch(/bad animation data/);
            await new Promise((resolve) => setTimeout(resolve, 20));
            expect(reasons).toEqual([]);
            expect(view.emitted('getAnimationInstance')).toBeUndefined();

            await view.rerender({ params: { path: 'good.json' } });
            await waitFor(() => expect(view.emitted('getAnimationInstance')).toHaveLength(1));
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

    describe('params 变化', () => {
        it('深度相等时保留动画，变化时重新加载', async () => {
            const view = render(Lottie, { props: { params: { path: 'a.json', loop: false } } });
            await loaded();
            await view.rerender({ params: { path: 'a.json', loop: false } });
            expect(loadAnimation).toHaveBeenCalledTimes(1);

            await view.rerender({ params: { path: 'b.json', loop: false } });
            await loaded(2);
            const [first, second] = animations();
            expect(first.destroy).toHaveBeenCalledTimes(1);
            expect(second.params.path).toBe('b.json');
            expect(view.emitted('getAnimationInstance')?.at(-1)).toEqual([second]);
            expect(live()).toEqual([second]);
        });

        it('shallowRef 持有的 params 整体替换后重新加载', async () => {
            const params = shallowRef<LottieParams>({ animationData: { v: 1 } });
            const view = render(() => <Lottie params={params.value} />);
            await loaded();
            params.value = { animationData: { v: 2 } };
            await loaded(2);
            expect(loadAnimation.mock.calls[1][0]).toMatchObject({ animationData: { v: 2 } });
            view.unmount();
        });

        it('仅 width、height、class 或 style 变化时不重新加载', async () => {
            const view = render(Lottie, { props: { params: { path: 'a.json' }, width: '1px' } });
            await loaded();
            await view.rerender({ height: '3px', params: { path: 'a.json' }, width: '2px' });
            expect(loadAnimation).toHaveBeenCalledTimes(1);
        });

        it('交给 lottie-web 的是原始对象而不是响应式代理', async () => {
            const params = reactive({ animationData: { v: 1 } });
            render(Lottie, { props: { params } });
            await loaded();
            expect(isReactive(loadAnimation.mock.calls[0][0].animationData)).toBe(false);
        });
    });

    it('卸载时销毁动画', async () => {
        const view = render(Lottie, { props: { params: {} } });
        await loaded();
        const [animation] = animations();
        expect(animation.destroy).not.toHaveBeenCalled();
        view.unmount();
        expect(animation.destroy).toHaveBeenCalledTimes(1);
        expect(live()).toEqual([]);
    });

    it('每创建一个动画，通知一次 getAnimationInstance', async () => {
        const view = render(Lottie, { props: { params: {} } });
        await loaded();
        expect(view.emitted('getAnimationInstance')).toHaveLength(1);
    });

    it('KeepAlive 失活时销毁动画并停止监听，激活后重新创建', async () => {
        const view = render(CachedLottie, { props: { active: true } });
        await loaded();
        const [first] = animations();
        expect(motion.list.handlers).toHaveLength(1);

        await view.rerender({ active: false });
        expect(first.destroy).toHaveBeenCalledTimes(1);
        expect(motion.list.handlers).toHaveLength(0);

        await view.rerender({ active: true });
        await loaded(2);
        const second = animations()[1];
        expect(live()).toEqual([second]);
        expect(motion.list.handlers).toHaveLength(1);
        view.unmount();
        expect(live()).toEqual([]);
    });

    it('未知属性透传到外层 div', () => {
        const { container } = render(Lottie, { attrs: { id: 'anim', 'aria-label': 'loading' }, props: { params: {} } });
        expect(getRoot(container)).toHaveAttribute('id', 'anim');
        expect(getRoot(container)).toHaveAttribute('aria-label', 'loading');
        expect(getRoot(container)).not.toHaveAttribute('params');
    });

    describe('减少动态效果', () => {
        it('用户要求减少动态效果时，不自动开始播放', async () => {
            motion.list.matches = true;
            render(Lottie, { props: { params: { path: 'a.json' } } });
            await loaded();
            expect(loadAnimation).toHaveBeenCalledWith(expect.objectContaining({ autoplay: false, loop: true }));
        });

        it('用户要求减少动态效果时，仍保留显式设置的 autoplay', async () => {
            motion.list.matches = true;
            render(Lottie, { props: { params: { path: 'a.json', autoplay: true } } });
            await loaded();
            expect(loadAnimation).toHaveBeenCalledWith(expect.objectContaining({ autoplay: true }));
        });

        it('设置变化时，暂停并恢复默认自动播放的动画', async () => {
            render(Lottie, { props: { params: { path: 'a.json' } } });
            await loaded();
            const [animation] = animations();
            motion.list.set(true);
            expect(animation.pause).toHaveBeenCalledTimes(1);
            motion.list.set(false);
            expect(animation.play).toHaveBeenCalledTimes(1);
        });

        it('设置变化时，不改动显式设置的 autoplay', async () => {
            render(Lottie, { props: { params: { path: 'a.json', autoplay: false } } });
            await loaded();
            const [animation] = animations();
            motion.list.set(true);
            motion.list.set(false);
            expect(animation.pause).not.toHaveBeenCalled();
            expect(animation.play).not.toHaveBeenCalled();
        });

        it('卸载时停止监听', async () => {
            const view = render(Lottie, { props: { params: { path: 'a.json' } } });
            await loaded();
            expect(motion.list.handlers).toHaveLength(1);
            view.unmount();
            expect(motion.list.handlers).toHaveLength(0);
        });
    });

    describe('语义', () => {
        it('未命名（装饰性）的动画对辅助技术隐藏', () => {
            const { container } = render(Lottie, { props: { params: {} } });
            expect(getRoot(container)).toHaveAttribute('aria-hidden', 'true');
            expect(getRoot(container)).not.toHaveAttribute('role');
        });

        it('有名称的动画暴露为 image', () => {
            render(Lottie, { attrs: { 'aria-label': 'Loading' }, props: { params: {} } });
            const image = screen.getByRole('img', { name: 'Loading' });
            expect(image).not.toHaveAttribute('aria-hidden');
        });

        it('aria-labelledby 同样让动画成为 image', () => {
            const { container } = render(Lottie, { attrs: { 'aria-labelledby': 'title' }, props: { params: {} } });
            expect(getRoot(container)).toHaveAttribute('role', 'img');
            expect(getRoot(container)).not.toHaveAttribute('aria-hidden');
        });

        it('调用方可以覆盖 role 与隐藏状态', () => {
            const { container } = render(Lottie, {
                attrs: { 'aria-hidden': 'false', role: 'presentation' },
                props: { params: {} },
            });
            expect(getRoot(container)).toHaveAttribute('aria-hidden', 'false');
            expect(getRoot(container)).toHaveAttribute('role', 'presentation');
        });
    });

    it('从 overrideDefaultProps 读取 width 与 height，实例参数优先', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Lottie: { width: '42px', height: '24px' } };
        const global = { provide: { [semiGlobalKey]: semi } };
        const { container } = render(
            () => (
                <div>
                    <Lottie params={{}} />
                    <Lottie params={{}} width="5px" />
                </div>
            ),
            {
                global,
            }
        );
        const [fromGlobal, explicit] = container.querySelectorAll<HTMLElement>('.semi-lottie');
        expect(fromGlobal).toHaveStyle({ width: '42px', height: '24px' });
        expect(explicit).toHaveStyle({ width: '5px', height: '24px' });
    });

    it('props 运行时：没有 Boolean 类型的 prop，params 必填', () => {
        const declared = (Lottie as unknown as { props: Record<string, { type?: unknown; required?: boolean }> }).props;
        expect(Object.values(declared).filter((option) => [option.type].flat().includes(Boolean))).toEqual([]);
        expect(declared.params.required).toBe(true);
    });

    it('服务端渲染输出 aria-hidden 的外层 div，且不查询 matchMedia', async () => {
        const html = await renderToString(createSSRApp({ render: () => <Lottie params={{ path: 'a.json' }} /> }));
        const host = document.createElement('div');
        host.innerHTML = html;
        expect(host.querySelector('.semi-lottie')).toHaveAttribute('aria-hidden', 'true');
        expect(window.matchMedia).not.toHaveBeenCalled();
    });
});

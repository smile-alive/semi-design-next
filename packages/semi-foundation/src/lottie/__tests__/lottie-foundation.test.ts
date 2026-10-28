import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import LottieFoundation, { type LottieAdapter, type LottieBaseProps } from '../foundation';

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

type Handler = (event: { matches: boolean }) => void;

function stubReducedMotion(initial: boolean) {
    const list = { matches: initial, handlers: [] as Handler[] };
    const matchMedia = vi.fn<(media: string) => MediaQueryList>(
        () =>
            ({
                get matches() {
                    return list.matches;
                },
                addEventListener: (_: string, handler: Handler, options?: { signal?: AbortSignal }) => {
                    list.handlers.push(handler);
                    options?.signal?.addEventListener('abort', () => {
                        list.handlers = list.handlers.filter((item) => item !== handler);
                    });
                },
            }) as unknown as MediaQueryList
    );
    vi.stubGlobal('matchMedia', matchMedia);
    return {
        matchMedia,
        list,
        set(matches: boolean) {
            list.matches = matches;
            list.handlers.forEach((handler) => handler({ matches }));
        },
    };
}

function mount(params: LottieBaseProps['params'], reducedMotion: boolean) {
    const motion = stubReducedMotion(reducedMotion);
    const container = document.createElement('div');
    const props: LottieBaseProps = { params };
    const adapter = {
        getProp: (key: keyof LottieBaseProps) => props[key],
        getProps: () => props,
        getContainer: () => container,
        notifyLoadError: vi.fn<LottieAdapter['notifyLoadError']>(),
    } as unknown as LottieAdapter;
    const foundation = new LottieFoundation(adapter);
    foundation.connect();
    foundation.init();
    return { foundation, motion, container };
}

const animation = () => loadAnimation.mock.results[0]?.value;
const loaded = () => vi.waitFor(() => expect(loadAnimation).toHaveBeenCalledTimes(1));

describe('LottieFoundation', () => {
    afterEach(() => loadAnimation.mockClear());

    it('默认以 svg 渲染到适配器提供的容器，循环且自动播放', async () => {
        const { container } = mount({ path: 'a.json' }, false);
        await loaded();
        expect(animation().params).toMatchObject({
            container,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'a.json',
        });
    });

    it('系统偏好减少动画时默认不自动播放', async () => {
        mount({ path: 'a.json' }, true);
        await loaded();
        expect(animation().params).toMatchObject({ autoplay: false });
    });

    it('params 里的 autoplay、loop、container 以使用方为准', async () => {
        const container = document.createElement('section');
        mount({ path: 'a.json', autoplay: true, loop: false, container }, true);
        await loaded();
        expect(animation().params).toMatchObject({ autoplay: true, loop: false, container });
    });

    it('只创建一个 matchMedia 查询，加载与监听共用', async () => {
        const { motion } = mount({ path: 'a.json' }, false);
        await loaded();
        expect(motion.matchMedia).toHaveBeenCalledTimes(1);
    });

    it('偏好变化时暂停或继续播放', async () => {
        const { motion } = mount({ path: 'a.json' }, false);
        await loaded();
        motion.set(true);
        expect(animation().pause).toHaveBeenCalledTimes(1);
        motion.set(false);
        expect(animation().play).toHaveBeenCalledTimes(1);
    });

    it('使用方显式传入 autoplay 时忽略偏好变化', async () => {
        const { motion } = mount({ path: 'a.json', autoplay: false }, false);
        await loaded();
        motion.set(true);
        motion.set(false);
        expect(animation().pause).not.toHaveBeenCalled();
        expect(animation().play).not.toHaveBeenCalled();
    });

    it('卸载后移除偏好监听并销毁动画', async () => {
        const { foundation, motion } = mount({ path: 'a.json' }, false);
        await loaded();
        foundation.destroy();
        foundation.disconnect();
        expect(motion.list.handlers).toHaveLength(0);
        expect(animation().destroy).toHaveBeenCalledTimes(1);
    });
});

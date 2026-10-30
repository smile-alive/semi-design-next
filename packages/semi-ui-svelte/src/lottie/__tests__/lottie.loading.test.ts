import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { LottieProps } from '../interface';
import LottieHost from './lottie-host.svelte';

// the module factory only settles once the test opens the gate, which stands in for a slow network
const gate = vi.hoisted(() => {
    const { promise, resolve: open } = Promise.withResolvers<void>();
    return { promise, open };
});

// hoisted so the test reads the mock directly: lottie-web types loadAnimation as a method, which lint forbids passing
// around. The module object is hoisted too, because semi-ui-svelte does not depend on lottie-web to import it.
const { loadAnimation, lottie } = vi.hoisted(() => {
    const animation = (params: object) => ({ params, destroy: vi.fn<() => void>() });
    const loadAnimation = vi.fn<typeof animation>(animation);
    return { loadAnimation, lottie: { loadAnimation } };
});

vi.mock('lottie-web', async () => {
    await gate.promise;
    return { default: lottie };
});

describe('lottie-web 加载期间的 Lottie', () => {
    it('加载完成前不创建动画，跳过加载期间已卸载的动画，然后创建其余动画', async () => {
        const keptEvents = { animations: [] as unknown[], lottie: [] as unknown[] };
        const kept = render(LottieHost, {
            props: {
                store: createStore<LottieProps>({
                    params: { path: 'a.json' },
                    getAnimationInstance: (animation) => keptEvents.animations.push(animation),
                    getLottie: (module) => keptEvents.lottie.push(module),
                }),
            },
        });
        const dropped = render(LottieHost, { props: { store: createStore<LottieProps>({ params: { path: 'b.json' } }) } });
        dropped.unmount();

        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(keptEvents.animations).toEqual([]);
        expect(keptEvents.lottie).toEqual([]);
        expect(kept.container.querySelector('.semi-lottie')).toBeEmptyDOMElement();

        gate.open();
        await waitFor(() => expect(keptEvents.animations).toHaveLength(1));
        expect(loadAnimation).toHaveBeenCalledTimes(1);
        expect(loadAnimation.mock.calls[0][0]).toMatchObject({
            container: kept.container.querySelector('.semi-lottie'),
            path: 'a.json',
        });
        expect(keptEvents.lottie).toEqual([lottie]);
    });
});

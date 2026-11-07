import { render, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import Lottie, { type LottieProps } from '..';

// the module factory only settles once the test opens the gate, which stands in for a slow network
const gate = vi.hoisted(() => {
    const { promise, resolve: open } = Promise.withResolvers<void>();
    return { promise, open };
});

// hoisted so the test reads the mock directly: lottie-web types loadAnimation as a method, which lint forbids passing
// around
const loadAnimation = vi.hoisted(() => {
    const animation = (params: object) => ({ params, destroy: vi.fn<() => void>() });
    return vi.fn<typeof animation>(animation);
});

vi.mock('lottie-web', async () => {
    await gate.promise;
    return { default: { loadAnimation } };
});

describe('lottie-web 加载期间的 Lottie', () => {
    it('加载完成前不创建动画，跳过加载期间已卸载的动画，然后创建其余动画', async () => {
        const getAnimationInstance = vi.fn<NonNullable<LottieProps['getAnimationInstance']>>();
        const getLottie = vi.fn<NonNullable<LottieProps['getLottie']>>();
        const kept = render(() => <Lottie getAnimationInstance={getAnimationInstance} getLottie={getLottie} params={{ path: 'a.json' }} />);
        const dropped = render(() => <Lottie getAnimationInstance={getAnimationInstance} params={{ path: 'b.json' }} />);
        dropped.unmount();

        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(getAnimationInstance).not.toHaveBeenCalled();
        expect(getLottie).not.toHaveBeenCalled();
        expect(kept.container.firstChild).toBeEmptyDOMElement();

        gate.open();
        const lottieModule = await Lottie.getLottie();
        await waitFor(() => expect(getAnimationInstance).toHaveBeenCalledTimes(1));
        expect(loadAnimation).toHaveBeenCalledTimes(1);
        expect(loadAnimation.mock.calls[0][0]).toMatchObject({
            container: kept.container.firstChild,
            path: 'a.json',
        });
        expect(getLottie).toHaveBeenCalledWith(lottieModule);
    });
});

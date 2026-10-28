import { waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import Lottie from '..';

// the module factory only settles once the test opens the gate, which stands in for a slow network
const gate = vi.hoisted(() => {
    const { promise, resolve: open } = Promise.withResolvers<void>();
    return { promise, open };
});

// hoisted so the test reads the mock directly: lottie-web types loadAnimation as a method, which lint forbids passing
// around. The module object is hoisted too, because semi-ui-vue does not depend on lottie-web to import it.
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
        const kept = render(Lottie, { props: { params: { path: 'a.json' } } });
        const dropped = render(Lottie, { props: { params: { path: 'b.json' } } });
        dropped.unmount();

        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(kept.emitted('getAnimationInstance')).toBeUndefined();
        expect(kept.emitted('getLottie')).toBeUndefined();
        expect(kept.container.firstElementChild).toBeEmptyDOMElement();

        gate.open();
        await waitFor(() => expect(kept.emitted('getAnimationInstance')).toHaveLength(1));
        expect(loadAnimation).toHaveBeenCalledTimes(1);
        expect(loadAnimation.mock.calls[0][0]).toMatchObject({
            container: kept.container.firstElementChild,
            path: 'a.json',
        });
        expect(kept.emitted('getLottie')).toEqual([[lottie]]);
    });
});

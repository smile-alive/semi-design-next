import { untrack } from 'svelte';
import { SpinDelay, type SpinDelayOptions } from '@fibrae/semi-foundation/components/spin/spin-delay';

/**
 * `visible` tells whether to show a spinner for `loading()`: true only once it has lasted `delay` ms (500 by default),
 * then for at least `minDuration` ms (200). Effects do not run on the server, which renders the initial value only.
 */
export default function useSpinDelay(loading: () => boolean, options: () => SpinDelayOptions = () => ({})) {
    const initial = untrack(() => SpinDelay.initialVisible(loading(), options().ssr));

    let visible = $state(initial);

    const spin = new SpinDelay(initial, (value) => {
        visible = value;
    });

    $effect(() => {
        spin.mount();
        return () => spin.unmount();
    });

    $effect(() => {
        const { delay, minDuration } = options();
        spin.update(loading(), { delay, minDuration });
    });

    return {
        get visible() {
            return visible;
        },
    };
}

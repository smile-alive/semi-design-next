import { type Accessor, createEffect, createSignal, onCleanup, onMount, untrack } from 'solid-js';
import { SpinDelay, type SpinDelayOptions } from '@fibrae/semi-foundation/components/spin/spin-delay';

/**
 * Whether to show a spinner for `loading()`: true only once it has lasted `delay` ms (500 by default), then for at least
 * `minDuration` ms (200). Pairs with any pending flag, such as `useTransition`'s `pending` or a resource's `loading`.
 */
export default function useSpinDelay(loading: Accessor<boolean>, options: Accessor<SpinDelayOptions> = () => ({})): Accessor<boolean> {
    const initial = untrack(() => SpinDelay.initialVisible(loading(), options().ssr));
    const [visible, setVisible] = createSignal(initial);
    const spin = new SpinDelay(initial, setVisible);

    onMount(() => {
        spin.mount();
        createEffect(() => {
            const { delay, minDuration } = options();
            spin.update(loading(), { delay, minDuration });
        });
    });

    onCleanup(() => spin.unmount());

    return visible;
}

import { type Ref, onBeforeUnmount, onMounted, readonly, shallowRef, watchEffect } from 'vue';
import { SpinDelay, type SpinDelayOptions } from '@fibrae/semi-foundation/components/spin/spin-delay';

/**
 * Whether to show a spinner for `loading()`: true only once it has lasted `delay` ms (500 by default), then for at least
 * `minDuration` ms (200). Timers start on mount, so the server renders the initial value only.
 */
export default function useSpinDelay(loading: () => boolean, options: () => SpinDelayOptions = () => ({})): Readonly<Ref<boolean>> {
    const visible = shallowRef(SpinDelay.initialVisible(loading(), options().ssr));

    const spin = new SpinDelay(visible.value, (value) => {
        visible.value = value;
    });

    onMounted(() => {
        spin.mount();
        watchEffect(() => {
            const { delay, minDuration } = options();
            spin.update(loading(), { delay, minDuration });
        });
    });

    onBeforeUnmount(() => spin.unmount());

    return readonly(visible);
}

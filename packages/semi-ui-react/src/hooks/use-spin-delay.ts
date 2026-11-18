import { useEffect, useState } from 'react';
import { SpinDelay, type SpinDelayOptions } from '@fibrae/semi-foundation/components/spin/spin-delay';

/**
 * Whether to show a spinner for `loading`: true only once `loading` has lasted `delay` ms (500 by default), then for at
 * least `minDuration` ms (200). Pairs with any pending flag, such as `useTransition`'s `isPending`.
 */
export default function useSpinDelay(loading: boolean, { delay, minDuration, ssr }: SpinDelayOptions = {}) {
    const [visible, setVisible] = useState(() => SpinDelay.initialVisible(loading, ssr));
    const [spin] = useState(() => new SpinDelay(visible, setVisible));

    useEffect(() => {
        spin.mount();
        return () => spin.unmount();
    }, [spin]);

    useEffect(() => spin.update(loading, { delay, minDuration }), [spin, loading, delay, minDuration]);

    return visible;
}

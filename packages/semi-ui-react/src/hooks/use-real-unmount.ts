import { useLayoutEffect, useRef } from 'react';

/**
 * Calls `onUnmount` when the component really unmounts. StrictMode's simulated unmount remounts at once, so the
 * microtask tells the two apart; hiding a subtree with Activity cleans up layout effects too and counts as unmounting.
 */
export default function useRealUnmount(onUnmount: () => void) {
    const latest = useRef(onUnmount);
    const mounted = useRef(false);
    useLayoutEffect(() => {
        latest.current = onUnmount;
    });
    useLayoutEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            queueMicrotask(() => {
                if (!mounted.current) {
                    latest.current();
                }
            });
        };
    }, []);
}

import { useCallback, useEffect, useState } from 'react';
import { copyText } from '@fibrae/semi-foundation/utils/clipboard';
import { ResetTimer } from '@fibrae/semi-foundation/utils/reset-timer';

/**
 * `copy(text)` writes to the clipboard and resolves whether it succeeded; after a success `copied` stays true for
 * `duration` ms. A repeated copy restarts the countdown and unmounting cancels it.
 */
export default function useCopied(duration: number): [boolean, (text: string) => Promise<boolean>] {
    const [copied, setCopied] = useState(false);
    const [timer] = useState(() => new ResetTimer());

    useEffect(() => {
        timer.mount();
        return () => timer.unmount();
    }, [timer]);

    const copy = useCallback(
        (text: string) =>
            copyText(text).then((res) => {
                if (res && timer.isMounted) {
                    setCopied(true);
                    timer.start(duration, () => setCopied(false));
                }
                return res;
            }),
        [duration, timer]
    );

    return [copied, copy];
}

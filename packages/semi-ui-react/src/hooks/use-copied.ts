import { useCallback, useEffect, useState } from 'react';
import { CopiedTimer } from '@fibrae/semi-foundation/utils/clipboard';

/**
 * `copy(text)` writes to the clipboard and resolves whether it succeeded; after a success `copied` stays true for
 * `duration` ms. A repeated copy restarts the countdown and unmounting cancels it.
 */
export default function useCopied(duration: number): [boolean, (text: string) => Promise<boolean>] {
    const [copied, setCopied] = useState(false);
    const [timer] = useState(() => new CopiedTimer(setCopied));

    useEffect(() => {
        timer.mount();
        return () => timer.unmount();
    }, [timer]);

    const copy = useCallback((text: string) => timer.copy(text, duration), [duration, timer]);

    return [copied, copy];
}

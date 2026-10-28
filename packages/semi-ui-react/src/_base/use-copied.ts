import { useCallback, useEffect, useState } from 'react';
import { copyText } from '@fibrae/semi-foundation/utils/clipboard';

class ResetTimer {
    #id: ReturnType<typeof setTimeout> | undefined;
    // a copy may resolve after unmount; mount and unmount pair up so StrictMode's replayed effect re-enables it
    #mounted = false;

    mount() {
        this.#mounted = true;
    }

    unmount() {
        this.#mounted = false;
        this.clear();
    }

    start(ms: number, onEnd: () => void) {
        if (!this.#mounted) {
            return;
        }
        this.clear();
        this.#id = setTimeout(() => {
            this.#id = undefined;
            onEnd();
        }, ms);
    }

    clear() {
        clearTimeout(this.#id);
        this.#id = undefined;
    }
}

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
                if (res) {
                    setCopied(true);
                    timer.start(duration, () => setCopied(false));
                }
                return res;
            }),
        [duration, timer]
    );

    return [copied, copy];
}

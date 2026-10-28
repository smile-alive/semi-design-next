import { createSignal, onCleanup } from 'solid-js';
import Announcer from '@fibrae/semi-foundation/utils/announcer';

/** Returns the text of a persistent live region and the announcer that writes messages into it */
export default function useAnnouncer() {
    const [text, setText] = createSignal('');
    const announcer = new Announcer(setText);
    onCleanup(() => announcer.dispose());
    return [text, announcer] as const;
}

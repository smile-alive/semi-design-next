import { onMount } from 'svelte';
import Announcer from '@fibrae/semi-foundation/utils/announcer';

/** Returns the text of a persistent live region and the announcer that writes messages into it */
export default function useAnnouncer() {
    let text = $state('');

    const announcer = new Announcer((value) => {
        text = value;
    });

    onMount(() => () => announcer.dispose());

    return { text: () => text, announcer };
}

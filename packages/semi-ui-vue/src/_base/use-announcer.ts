import { onBeforeUnmount, shallowRef } from 'vue';
import Announcer from '@fibrae/semi-foundation/utils/announcer';

/** Returns the text of a persistent live region and the announcer that writes messages into it */
export default function useAnnouncer() {
    const text = shallowRef('');

    const announcer = new Announcer((value) => {
        text.value = value;
    });

    onBeforeUnmount(() => announcer.dispose());

    return { text, announcer };
}

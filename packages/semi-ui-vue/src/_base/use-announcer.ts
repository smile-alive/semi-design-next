import { onBeforeUnmount, shallowRef } from 'vue';
import Announcer from '@fibrae/semi-foundation/utils/announcer';

export default function useAnnouncer() {
    const text = shallowRef('');

    const announcer = new Announcer((value) => {
        text.value = value;
    });

    onBeforeUnmount(() => announcer.dispose());

    return { text, announcer };
}

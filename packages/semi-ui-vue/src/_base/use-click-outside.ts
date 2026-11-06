import { type MaybeRefOrGetter, onActivated, onDeactivated, shallowRef, toValue } from 'vue';
import { isEventInside } from '@fibrae/semi-foundation/utils/dom';
import useEventListener, { getDocument } from './use-event-listener';

/** `nested`: more nodes that count as inside, read on every press (the popups `useNestedPopups` collects) */
export default function useClickOutside(targets: MaybeRefOrGetter<Node | null | undefined>[], onOutside: (event: MouseEvent) => void, enabled: MaybeRefOrGetter<boolean> = true, nested?: () => readonly (Node | null | undefined)[]) {
    // A component cached by KeepAlive keeps its open popups hidden, like a hidden React Activity; no press reaches it.
    const active = shallowRef(true);

    onDeactivated(() => {
        active.value = false;
    });

    onActivated(() => {
        active.value = true;
    });

    useEventListener(
        getDocument,
        'mousedown',
        (event) => {
            if (!isEventInside(event, ...targets.map((target) => toValue(target)), ...(nested?.() ?? []))) {
                onOutside(event);
            }
        },
        { enabled: () => active.value && toValue(enabled) }
    );
}

import { type MaybeRefOrGetter, toValue } from 'vue';
import { isEventInside } from '@fibrae/semi-foundation/utils/dom';
import useEventListener, { getDocument } from './use-event-listener';

/** `nested`: more nodes that count as inside, read on every press (the popups `useNestedPopups` collects) */
export default function useClickOutside(targets: MaybeRefOrGetter<Node | null | undefined>[], onOutside: (event: MouseEvent) => void, enabled: MaybeRefOrGetter<boolean> = true, nested?: () => readonly (Node | null | undefined)[]) {
    useEventListener(
        getDocument,
        'mousedown',
        (event) => {
            if (!isEventInside(event, ...targets.map((target) => toValue(target)), ...(nested?.() ?? []))) {
                onOutside(event);
            }
        },
        { enabled }
    );
}

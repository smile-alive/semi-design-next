import { on } from 'svelte/events';
import { isEventInside } from '@fibrae/semi-foundation/utils/dom';

/**
 * Calls `onOutside` for a mousedown outside every target. Each getter is read on every press, so targets may mount
 * later. `nested`: more nodes that count as inside, the popups `useNestedPopups` collects.
 */
export default function useClickOutside(targets: (() => Node | null | undefined)[], onOutside: (event: MouseEvent) => void, enabled: () => boolean = () => true, nested?: () => readonly (Node | null | undefined)[]) {
    $effect(() => {
        if (!enabled()) {
            return;
        }
        return on(document, 'mousedown', (event) => {
            if (!isEventInside(event, ...targets.map((target) => target()), ...(nested?.() ?? []))) {
                onOutside(event);
            }
        });
    });
}

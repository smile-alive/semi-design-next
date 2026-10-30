import { getTriggerContext, type TriggerState } from './context.js';

/**
 * The attachments among `props` (Tooltip's `child` snippet hands its trigger attachment over under a symbol key):
 * splitting the props by `Object.entries` drops them, so a component that splits them spreads these on its root.
 */
export function attachmentProps(props: object) {
    return Object.fromEntries(Object.getOwnPropertySymbols(props).map((key) => [key, (props as Record<symbol, unknown>)[key]]));
}

/**
 * Registers a component's root element with the Tooltip around it, so the Tooltip can wrap a disabled or loading
 * trigger and route its description to the component's own control. Returns the binding to apply, which is only
 * defined when this element is the Tooltip's trigger. Call during component initialization.
 */
export default function useTrigger(element: () => HTMLElement | undefined, state: () => TriggerState) {
    const registry = getTriggerContext();

    $effect(() => {
        const root = element();
        if (root && registry) {
            return registry.register(root, state);
        }
        return undefined;
    });

    return () => registry?.bind(element());
}

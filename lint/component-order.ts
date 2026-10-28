export const GROUPS = ['import', 'type', 'props', 'context', 'state', 'composable', 'derived', 'provide', 'function', 'effect', 'lifecycle', 'expose', 'return', 'other'] as const;
export type Group = (typeof GROUPS)[number];
// What a call registers. A framework may run watchers, effects and lifecycle hooks from separate queues, so only calls
// of the same kind are ordered against each other; `opaque` calls may register anything and are ordered against every kind.
export type Sequence = 'opaque' | 'watch' | 'lifecycle' | 'effect';
export type Calls = Record<string, [Group, Sequence?]>;

export interface ComponentOrder {
    // Unlisted `use*` calls are opaque composables
    calls: Calls;
    // components: capitalised top-level functions; script-setup: an SFC's first <script setup>;
    // composables: top-level use* functions and defineComponent setups
    targets: { kind: 'components' | 'script-setup' | 'composables'; pathspecs: string[] }[];
}

// Semi's host API and es-toolkit helpers: same name and meaning in every framework
export const semiCalls: Calls = {
    useLocale: ['context'],
    useSemiGlobal: ['context'],
    useConfig: ['context'],
    useFoundation: ['composable', 'opaque'],
    debounce: ['function'],
    throttle: ['function'],
};

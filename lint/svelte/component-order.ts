import type { ComponentOrder } from '../component-order.ts';

export const svelteComponentOrder: ComponentOrder = {
    calls: {
        // Reads the global defaults the `$props()` destructuring falls back to, so it precedes `$props`
        useDefaultProps: ['props'],
        $props: ['props'],
        getContext: ['context'],
        $state: ['state'],
        '$state.raw': ['state'],
        '$props.id': ['state'],
        $derived: ['derived'],
        '$derived.by': ['derived'],
        setContext: ['provide'],
        $effect: ['effect', 'effect'],
        '$effect.pre': ['effect', 'watch'],
        // _base/watch.svelte.ts wraps $effect
        watch: ['effect', 'effect'],
        // Svelte's onMount is a user effect, so it keeps its order among $effect calls
        onMount: ['lifecycle', 'effect'],
        onDestroy: ['lifecycle', 'lifecycle'],
    },
    targets: [
        { kind: 'svelte-script', pathspecs: ['packages/semi-ui-svelte/src/*.svelte'] },
        { kind: 'composables', pathspecs: ['packages/semi-ui-svelte/src/*.svelte.ts'] },
        { kind: 'svelte-script', pathspecs: ['packages/semi-ai-svelte/src/*.svelte'] },
        { kind: 'composables', pathspecs: ['packages/semi-ai-svelte/src/*.svelte.ts'] },
    ],
};

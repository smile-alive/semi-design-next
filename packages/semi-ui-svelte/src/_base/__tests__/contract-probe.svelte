<script lang="ts">
    import { type ContractAdapter, type ContractProps, type ContractState, ContractFoundation } from '@test/utils/host-contract';
    import useFoundation from '../use-foundation.svelte';
    import watch from '../watch.svelte';

    interface Hooks {
        log: (entry: string) => void;
        notifyChange: (x: number) => void;
        commit: (foundation: ContractFoundation, state: ContractState) => void;
        expose: (foundation: ContractFoundation) => void;
    }

    const props: ContractProps & { theme: string; hooks: Hooks } = $props();

    const host = useFoundation<ContractFoundation, ContractAdapter, ContractProps, ContractState>(
        ContractFoundation,
        props,
        () => ({ x: 0 }),
        () => ({ log: (entry) => props.hooks.log(entry), notifyChange: (x) => props.hooks.notifyChange(x) }),
        { context: () => ({ theme: props.theme }) }
    );
    props.hooks.expose(host.foundation);

    watch(
        () => props.label,
        () => host.foundation.handleLabelChange()
    );

    // Svelte has no component re-render: the commit hook is an effect that reads everything the component shows
    $effect(() => {
        void props.label;
        void props.theme;
        props.hooks.commit(host.foundation, { x: host.states().x });
    });
</script>

<span data-contract-state>{host.states().x}</span>
<span data-contract-label>{props.label}</span>
<button type="button" onclick={() => host.foundation.increment()}>increment</button>

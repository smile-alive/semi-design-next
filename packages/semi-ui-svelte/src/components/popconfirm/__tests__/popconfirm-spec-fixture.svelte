<script lang="ts">
    import type { PopconfirmSpecProps } from '@test/specs/popconfirm';
    import type { TooltipTriggerProps } from '../../tooltip';
    import Popconfirm from '../popconfirm.svelte';

    let { store }: { store: PopconfirmSpecProps } = $props();

    // A one-way `visible` lets the component override it locally, so the spec's controlled value goes through a function binding that rejects writes
    let chosen = $state<boolean>();
</script>

{#snippet child({ props: triggerProps }: { props: TooltipTriggerProps })}
    <button {...triggerProps} type="button">trigger</button>
{/snippet}

<Popconfirm
    bind:visible={
        () => (store.visible === undefined ? chosen : store.visible),
        (value) => {
            chosen = value;
        }
    }
    cancelText={store.cancelText}
    {child}
    disabled={store.disabled}
    motion={false}
    okText={store.okText}
    onCancel={store.onCancel}
    onConfirm={store.onConfirm}
    onEscKeyDown={store.onEscKeyDown}
    onVisibleChange={store.onVisibleChange}
    title={store.title}
    trigger={store.trigger}
/>

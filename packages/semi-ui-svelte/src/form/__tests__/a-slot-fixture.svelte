<script lang="ts" module>
    export interface SlotStore {
        formProps?: Record<string, unknown>;
        slots: Record<string, unknown>[];
    }
</script>

<script lang="ts">
    import Form from '../form.svelte';
    import Slot from '../slot.svelte';

    let { store }: { store: SlotStore } = $props();
</script>

<span id="own">Own</span>
<Form {...store.formProps}>
    {#each store.slots as props, index (index)}
        <Slot {...props} />
    {/each}
</Form>

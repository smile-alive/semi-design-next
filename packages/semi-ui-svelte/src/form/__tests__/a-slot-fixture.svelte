<script lang="ts" module>
    export interface SlotStore {
        formProps?: Record<string, unknown>;
        /** One FormSlot per entry, with the entry spread onto it, snippet props included */
        slots: Record<string, unknown>[];
    }
</script>

<script lang="ts">
    import Form from '../form.svelte';
    import Slot from '../slot.svelte';

    let { store }: { store: SlotStore } = $props();
</script>

<!-- referenced by the aria-labelledby the tests give a slot -->
<span id="own">Own</span>
<Form {...store.formProps}>
    {#each store.slots as props, index (index)}
        <Slot {...props} />
    {/each}
</Form>

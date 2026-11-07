<script lang="ts" module>
    import type { WithFieldOption } from '../interface';

    export interface WithFieldStore {
        control: 'plain' | 'slotted';
        form: Record<string, unknown>;
        fieldOptions?: WithFieldOption;
        fieldProps: Record<string, unknown>;
    }
</script>

<script lang="ts">
    import FormField from '../field.svelte';
    import Form from '../form.svelte';
    import type { FormApi } from '../interface';
    import PlainControl from './b-plain-control.svelte';
    import SlottedControl from './b-slotted-control.svelte';

    let { store, onApi }: { store: WithFieldStore; onApi?: (api: FormApi) => void } = $props();

    const fieldProps = $derived(store.fieldProps as { field: string });
</script>

<Form {...store.form} getFormApi={onApi}>
    {#if store.control === 'plain'}
        <FormField component={PlainControl} fieldOptions={store.fieldOptions} {...fieldProps} />
    {:else}
        <FormField component={SlottedControl} fieldOptions={store.fieldOptions} {...fieldProps} />
    {/if}
</Form>

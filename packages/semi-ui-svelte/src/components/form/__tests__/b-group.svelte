<script lang="ts" module>
    export interface GroupStore {
        form: Record<string, unknown>;
        group: Record<string, unknown>;
        fields: { props: { field: string; [key: string]: unknown }; shown?: boolean }[];
    }
</script>

<script lang="ts">
    import FormInput from '../form-input.svelte';
    import Form from '../form.svelte';
    import InputGroup from '../input-group.svelte';
    import type { FormApi } from '../interface';

    let { store, onApi }: { store: GroupStore; onApi?: (api: FormApi) => void } = $props();
</script>

<Form {...store.form} getFormApi={onApi}>
    <InputGroup {...store.group}>
        {#each store.fields as spec, index (index)}
            {#if spec.shown ?? true}
                <FormInput {...spec.props} />
            {/if}
        {/each}
    </InputGroup>
</Form>

<script lang="ts" module>
    export interface GroupStore {
        formProps?: Record<string, unknown>;
        groupProps?: Record<string, unknown>;
        fieldA?: Record<string, unknown>;
        fieldB?: Record<string, unknown>;
    }
</script>

<script lang="ts">
    import FormInput from '../fields/form-input.svelte';
    import Form from '../form.svelte';
    import InputGroup from '../input-group.svelte';

    let { store }: { store: GroupStore } = $props();
</script>

<span id="own-name">Own</span>
<span id="own-desc">Note</span>
<span id="phone-hint">Hint</span>
<Form {...store.formProps}>
    <InputGroup {...store.groupProps}>
        <FormInput field="a" {...store.fieldA} />
        {#if store.fieldB}
            <FormInput field="b" {...store.fieldB} />
        {/if}
    </InputGroup>
</Form>

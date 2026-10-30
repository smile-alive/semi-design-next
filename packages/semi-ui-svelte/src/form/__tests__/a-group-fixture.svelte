<script lang="ts" module>
    export interface GroupStore {
        formProps?: Record<string, unknown>;
        /** Spread onto FormInputGroup, including its snippet props */
        groupProps?: Record<string, unknown>;
        fieldA?: Record<string, unknown>;
        /** The second field is rendered only when given */
        fieldB?: Record<string, unknown>;
    }
</script>

<script lang="ts">
    import FormInput from '../form-input.svelte';
    import Form from '../form.svelte';
    import InputGroup from '../input-group.svelte';

    let { store }: { store: GroupStore } = $props();
</script>

<!-- referenced by the aria-* props the tests give the group and its fields -->
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

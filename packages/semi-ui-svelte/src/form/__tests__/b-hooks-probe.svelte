<script lang="ts">
    import { onMount } from 'svelte';
    import { useFieldApi, useFieldState, useFormApi, useFormState } from '../hooks';

    let { store, onProbe }: { store: { field: string }; onProbe?: (probe: { formApi: ReturnType<typeof useFormApi>; fieldApi: ReturnType<typeof useFieldApi>; formState: ReturnType<typeof useFormState> }) => void } = $props();

    const formApi = useFormApi();
    const formState = useFormState();
    const fieldApi = useFieldApi(() => store.field);
    const fieldState = useFieldState(() => store.field);

    onMount(() => onProbe?.({ formApi, fieldApi, formState }));
</script>

<output data-testid="form-state">{JSON.stringify(formState())}</output>
<output data-testid="field-state">{JSON.stringify(fieldState())}</output>

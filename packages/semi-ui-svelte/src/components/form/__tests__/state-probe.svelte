<script lang="ts">
    import { useFieldState, useFormState } from '../hooks';

    let { field = 'name' }: { field?: string } = $props();

    const formState = useFormState();
    const fieldState = useFieldState(() => field);
</script>

<output data-testid="form-state">{JSON.stringify(formState())}</output>
<output data-testid="field-state">{JSON.stringify(fieldState())}</output>

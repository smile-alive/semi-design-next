<script lang="ts">
    import FormInput from '../form-input.svelte';
    import Form from '../form.svelte';
    import InputGroup from '../input-group.svelte';
    import type { FormApi } from '../interface';

    let { fast, slow, onApi }: { fast: () => Promise<string>; slow: () => Promise<string>; onApi: (api: FormApi) => void } = $props();
</script>

<Form getFormApi={onApi}>
    <InputGroup label="分组">
        <FormInput field="fast" validator={fast} />
        <FormInput field="slow" validator={slow} />
    </InputGroup>
</Form>

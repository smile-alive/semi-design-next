<script lang="ts">
    import { useFieldState } from '@fibrae/semi-ui-svelte';

    let { field }: { field: string } = $props();

    // useFieldState reads the Form from context, so it has to run in a component rendered inside the Form
    const fieldState = useFieldState(() => field);
</script>

<div>
    <span>【{field}】FieldState read by 【useFieldState】：</span>
    <code>{JSON.stringify(fieldState())}</code>
</div>

<script lang="ts">
    import { Button, useFormApi } from '@fibrae/semi-ui-svelte';

    // useFormApi reads the Form from context, so it has to run in a component rendered inside the Form
    const formApi = useFormApi();
</script>

<Button onclick={() => formApi.setValue('name', Math.random())}>ChangeName By【formApi】</Button>

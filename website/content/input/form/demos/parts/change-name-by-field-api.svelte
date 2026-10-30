<script lang="ts">
    import { Button, useFieldApi } from '@fibrae/semi-ui-svelte';

    // useFieldApi reads the Form from context, so it has to run in a component rendered inside the Form
    const nameFieldApi = useFieldApi('name');
</script>

<Button onclick={() => nameFieldApi.setValue(Math.random())}>Click Me!!! changeNameBy【fieldApi】</Button>

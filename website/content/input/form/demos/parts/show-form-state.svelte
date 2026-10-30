<script lang="ts">
    import { useFormState } from '@fibrae/semi-ui-svelte';

    // useFormState reads the Form from context, so it has to run in a component rendered inside the Form
    const formState = useFormState();
</script>

<pre><code>{JSON.stringify(formState())}</code></pre>

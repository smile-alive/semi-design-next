<script lang="ts">
    import { Form, FormField, Input } from '@fibrae/semi-ui-svelte';
</script>

<Form>
    {#snippet children({ formState })}
        <FormField component={Input} field="name" />
        <pre><code>{JSON.stringify(formState)}</code></pre>
    {/snippet}
</Form>

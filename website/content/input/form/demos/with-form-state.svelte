<script lang="ts">
    import { Form, FormInput } from '@fibrae/semi-ui-svelte';
</script>

<Form>
    {#snippet children({ formState })}
        <FormInput field="name" initValue="semi" />
        <FormInput field="familyName" initValue="design" />
        <code>{JSON.stringify(formState)}</code>
    {/snippet}
</Form>

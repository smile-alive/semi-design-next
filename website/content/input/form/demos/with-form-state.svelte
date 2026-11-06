<script lang="ts">
    import { Form, FormInput } from '@fibrae/semi-ui-svelte';
</script>

<Form>
    {#snippet children(form)}
        <FormInput field="name" initValue="semi" />
        <FormInput field="familyName" initValue="design" />
        <code>{JSON.stringify(form.formState)}</code>
    {/snippet}
</Form>

<script lang="ts">
    import { Button, Form, FormInput } from '@fibrae/semi-ui-svelte';
</script>

<Form>
    {#snippet children(form)}
        <FormInput field="name" initValue="semi" />
        <FormInput field="familyName" initValue="design" />
        <Button htmlType="submit" style="margin-inline-end: 4px">submit</Button>
        <Button onclick={() => form.formApi.setValue('name', Math.random())}>Click Me!!! ChangeName By【formApi】</Button>
    {/snippet}
</Form>

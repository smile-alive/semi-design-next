<script lang="ts">
    import { Button, Form, FormInput } from '@fibrae/semi-ui-svelte';
</script>

<Form>
    {#snippet children({ formApi })}
        <FormInput field="name" initValue="semi" />
        <FormInput field="familyName" initValue="design" />
        <Button htmlType="submit" style="margin-right: 4px">submit</Button>
        <Button onclick={() => formApi.setValue('name', Math.random())}>Click Me!!! ChangeName By【formApi】</Button>
    {/snippet}
</Form>

<script lang="ts">
    import { Form, FormInput, FormSelect } from '@fibrae/semi-ui-svelte';

    const roleOptions = [
        { label: '管理员', value: 'admin' },
        { label: '普通用户', value: 'user' },
        { label: '访客', value: 'guest' },
    ];
</script>

<Form layout="horizontal" onValueChange={(values) => console.log(values)}>
    {#snippet children(form)}
        <FormSelect field="Role" label="角色" optionList={roleOptions} style="width: 176px" />
        <FormInput field="UserName" label="用户名" style="width: 80px" />
        <FormInput field="Password" label="密码" style="width: 176px" />
        <code style="margin-block-start: 24px">{JSON.stringify(form.formState)}</code>
    {/snippet}
</Form>

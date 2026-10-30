<script lang="ts">
    import { IconHelpCircle } from '@fibrae/semi-icons-svelte';
    import { Form, FormInput, FormSelect, Tooltip } from '@fibrae/semi-ui-svelte';

    const roleOptions = [
        { label: '管理员', value: 'admin' },
        { label: '普通用户', value: 'user' },
        { label: '访客', value: 'guest' },
    ];
</script>

{#snippet help()}
    详情
{/snippet}

<Form layout="horizontal" onValueChange={(values) => console.log(values)}>
    <FormInput field="UserName" label="用户名" style="width: 80px" />
    <FormInput field="Password" label="密码" style="width: 176px">
        {#snippet labelExtra()}
            <Tooltip content={help}>
                <IconHelpCircle aria-label="帮助" style="color: var(--semi-color-text-2)" />
            </Tooltip>
        {/snippet}
    </FormInput>
    <FormSelect field="Role" label={{ text: '角色', optional: true }} optionList={roleOptions} style="width: 176px" />
</Form>

<script lang="ts">
    import { Button, Form, FormInput, useForm } from '@fibrae/semi-ui-svelte';

    const form = useForm();

    const handleClick = () => {
        form.formApi.setValue('username', 'semi');
        console.log('当前表单值：', form.values);
    };
</script>

<Button onclick={handleClick}>外部设置值</Button>
<Button onclick={() => form.formApi.reset()}>重置表单</Button>

<Form form={form.formApi}>
    <FormInput field="username" label="用户名" />
    <FormInput field="email" label="邮箱" />
</Form>

<div style="margin-top: 16px">
    <div>表单值：{JSON.stringify(form.values)}</div>
    <div>touched 状态：{JSON.stringify(form.formState.touched)}</div>
</div>

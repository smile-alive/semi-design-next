<script lang="ts">
    import * as z from 'zod';
    import { Button, Form, FormInput } from '@fibrae/semi-ui-svelte';

    const nickname = z.string('请输入昵称').min(3, '昵称至少 3 个字符').max(12, '昵称最多 12 个字符');

    const usernameRules = [
        { required: true, message: '请输入用户名' },
        { pattern: /^[a-z0-9_]+$/, message: '只能包含小写字母、数字和下划线' },
    ];
</script>

<Form style="width: 400px">
    <FormInput field="nickname" label="昵称（validator 传 schema）" validator={nickname} />
    <FormInput field="username" label="用户名（rules）" rules={usernameRules} />
    <Button htmlType="submit">提交</Button>
</Form>

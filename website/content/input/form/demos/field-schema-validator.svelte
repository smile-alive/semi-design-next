<script lang="ts">
    import * as z from 'zod';
    import { Button, Form, FormInput, type RuleItem } from '@fibrae/semi-ui-svelte';

    const validator = z.string({ error: '请输入用户名' }).min(3, '用户名至少 3 个字符');
    const rules: RuleItem[] = [
        { required: true, message: '请输入用户名' },
        { min: 3, message: '用户名至少 3 个字符' },
    ];
</script>

<Form style="width: 400px">
    <FormInput field="bySchema" label={{ text: 'validator 传 z.string().min(3)', required: true }} {validator} />
    <FormInput field="byRules" label="rules 传 required 与 min" {rules} />
    <Button htmlType="submit">提交</Button>
</Form>

<script lang="ts">
    import * as z from 'zod';
    import { Button, SchemaForm } from '@fibrae/semi-ui-svelte';

    const schema = z.object({
        name: z.string({ error: '请输入姓名' }).min(2, '姓名至少 2 个字符').meta({ title: '姓名' }),
        email: z.email('邮箱格式不正确').meta({ title: '邮箱' }),
        bio: z.string().max(500, '最多 500 个字符').optional().meta({ title: '简介', description: '不超过 500 个字符' }),
        age: z.number({ error: '请输入年龄' }).int().min(18, '需要年满 18 岁').max(120).meta({ title: '年龄' }),
        subscribed: z.boolean().default(false).meta({ title: '订阅周报' }),
        role: z.enum(['engineer', 'designer', 'pm']).meta({ title: '角色' }),
        address: z
            .object({
                city: z.string({ error: '请输入城市' }).meta({ title: '城市' }),
                street: z.string().optional().meta({ title: '街道' }),
            })
            .meta({ title: '地址' }),
        contacts: z
            .array(
                z.object({
                    name: z.string({ error: '请输入联系人' }).meta({ title: '联系人' }),
                    phone: z.string({ error: '请输入电话' }).meta({ title: '电话' }),
                })
            )
            .max(3, '最多 3 位联系人')
            .meta({ title: '紧急联系人' }),
        tags: z.array(z.enum(['frontend', 'backend', 'design'])).meta({ title: '标签' }),
    });

    let output = $state<z.output<typeof schema>>();
</script>

<SchemaForm onSubmit={(values) => (output = values)} {schema} style="width: 560px">
    <Button htmlType="submit" type="primary">提交</Button>
    {#if output}
        <pre>{JSON.stringify(output, null, 2)}</pre>
    {/if}
</SchemaForm>

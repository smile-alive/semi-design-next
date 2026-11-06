<script lang="ts">
    import * as z from 'zod';
    import { Button, SchemaForm } from '@fibrae/semi-ui-svelte';

    const schema = z.object({
        email: z.email('邮箱格式不正确').meta({ title: '邮箱' }),
        bio: z.string().max(500).optional().meta({ title: '简介', description: '最多 500 字' }),
        age: z.int().min(0).max(150).meta({ title: '年龄' }),
        subscribed: z.boolean().default(false).meta({ title: '订阅周报' }),
        role: z.enum(['engineer', 'designer', 'pm']).meta({ title: '角色' }),
        address: z
            .object({
                city: z.string().meta({ title: '城市' }),
                street: z.string().optional().meta({ title: '街道' }),
            })
            .meta({ title: '地址' }),
        contacts: z
            .array(
                z.object({
                    name: z.string().meta({ title: '联系人' }),
                    phone: z.string().optional().meta({ title: '电话' }),
                })
            )
            .max(3)
            .meta({ title: '紧急联系人' }),
        tags: z.array(z.enum(['frontend', 'backend', 'design'])).meta({ title: '标签' }),
    });

    let output = $state<z.output<typeof schema>>();
</script>

<SchemaForm onSubmit={(values) => (output = values)} {schema} style="width: 480px">
    <Button htmlType="submit" type="primary">提交</Button>
    {#if output}
        <pre style="margin-block-start: 12px">{JSON.stringify(output, null, 2)}</pre>
    {/if}
</SchemaForm>

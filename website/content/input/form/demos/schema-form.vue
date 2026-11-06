<script setup lang="ts">
    import { shallowRef } from 'vue';
    import * as z from 'zod';
    import { Button, SchemaForm } from '@fibrae/semi-ui-vue';

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

    const output = shallowRef<z.output<typeof schema>>();
</script>

<template>
    <SchemaForm :schema="schema" :style="{ width: '480px' }" @submit="(values: z.output<typeof schema>) => (output = values)">
        <Button htmlType="submit" type="primary">提交</Button>
        <pre v-if="output" :style="{ marginBlockStart: '12px' }">{{ JSON.stringify(output, null, 2) }}</pre>
    </SchemaForm>
</template>

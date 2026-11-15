<script setup lang="ts">
    import { h } from 'vue';
    import * as z from 'zod';
    import { IconLink } from '@fibrae/semi-icons-vue';
    import { Button, Form, FormInput, FormRating, SchemaField, type SchemaFieldProps, type SchemaFieldRenderers, semiRenderers, Toast } from '@fibrae/semi-ui-vue';

    const schema = z.object({
        title: z.string().min(2, '标题至少 2 个字符'),
        profile: z
            .object({
                homepage: z.url('请输入完整的网址').meta({ title: '主页' }),
                score: z.int().min(1).max(5).meta({ title: '评分' }),
                intro: z.string().optional().meta({ title: '介绍' }),
            })
            .meta({ title: '资料' }),
    });

    const renderers: SchemaFieldRenderers = {
        ...semiRenderers,
        field: (context) => (context.node.format === 'uri' ? h(FormInput, { field: context.node.field, label: { text: context.node.title, required: context.node.required }, placeholder: 'https://' }, { prefix: () => h(IconLink) }) : semiRenderers.field(context)),
    };

    const renderField: SchemaFieldProps['renderField'] = {
        'profile.score': ({ node }) => h(FormRating, { field: node.field, label: { text: node.title, required: node.required } }),
    };

    const handleSubmit = (values: z.output<typeof schema>) => Toast.success(JSON.stringify(values));
</script>

<template>
    <Form :schema="schema" :style="{ width: '480px' }" @submit="handleSubmit">
        <FormInput field="title" :label="{ text: '标题', required: true }" />
        <SchemaField field="profile" :renderField="renderField" :renderers="renderers" />
        <Button htmlType="submit" type="primary">提交</Button>
    </Form>
</template>

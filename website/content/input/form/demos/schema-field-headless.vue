<script setup lang="ts">
    import { h, shallowRef } from 'vue';
    import * as z from 'zod';
    import { Button, Collapse, Form, type FormApi, SchemaField, type SchemaFieldProps, type SchemaFieldRenderers, semiRenderers, Typography } from '@fibrae/semi-ui-vue';

    const schema = z.object({
        contacts: z
            .array(
                z.object({
                    name: z.string().min(1, '请填写姓名').meta({ title: '姓名' }),
                    email: z.email('邮箱格式不正确').meta({ title: '邮箱' }),
                })
            )
            .min(1, '至少一位联系人')
            .meta({ title: '联系人', description: '每位联系人折叠成一张卡片，卡片标题取姓名' }),
    });

    const rowOf = (field: string) => /^contacts\[\d+\]/.exec(field)?.[0];

    const open = shallowRef(['contacts[0]']);
    const formApi = shallowRef<FormApi>();

    const renderContacts: SchemaFieldRenderers['array'] = ({ node, items, render, add, canAdd, count, error, fieldProps }) =>
        h('div', { ...fieldProps, style: { display: 'grid', gap: '8px' } }, [
            h(Typography.Text, { strong: true }, () => `${node.title}（${count}）`),
            h(Typography.Text, { type: 'tertiary' }, () => node.description),
            h(Collapse, { activeKey: open.value, onChange: (keys: string[]) => (open.value = keys) }, () =>
                items.map((item) => h(Collapse.Panel, { key: item.key, itemKey: item.field, 'x-field-id': item.field }, { header: () => (item.value as { name?: string } | undefined)?.name || `联系人 ${item.index + 1}`, default: () => render(item.field) }))
            ),
            error && h(Typography.Text, { type: 'danger' }, () => error.join(' ')),
            h(Button, { disabled: !canAdd, onClick: add, style: { justifySelf: 'start' } }, () => '添加联系人'),
        ]);

    const renderers: SchemaFieldRenderers = { ...semiRenderers, array: renderContacts };

    const renderField: SchemaFieldProps['renderField'] = {
        'contacts[]': (context) => context.kind === 'object' && context.content,
    };

    const onGetFormApi = (api: FormApi) => {
        formApi.value = api;
    };

    const onRevealField = (field: string) => {
        const row = rowOf(field);
        if (row) open.value = [...open.value, row];
    };
</script>

<template>
    <Form :initValues="{ contacts: [{ name: 'Ann', email: 'ann@example.com' }, { name: 'Bob' }] }" :schema="schema" :style="{ width: '480px' }" @getFormApi="onGetFormApi" @revealField="onRevealField">
        <SchemaField :renderField="renderField" :renderers="renderers" />
        <Button :style="{ marginBlockStart: '12px' }" @click="formApi?.focusField('contacts[1].email')">定位到 Bob 的邮箱</Button>
    </Form>
</template>

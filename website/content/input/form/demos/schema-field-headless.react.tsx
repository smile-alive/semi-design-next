import { useState } from 'react';
import * as z from 'zod';
import { Button, Collapse, Form, type FormApi, type SchemaArrayContext, SchemaField, semiRenderers, Typography } from '@fibrae/semi-ui-react';

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

export default function FormDemo() {
    const [open, setOpen] = useState(['contacts[0]']);
    const [formApi, setFormApi] = useState<FormApi>();

    const renderContacts = ({ node, items, render, add, canAdd, count, error, fieldProps }: SchemaArrayContext) => (
        <div {...fieldProps} style={{ display: 'grid', gap: 8 }}>
            <Typography.Text strong>{`${node.title}（${count}）`}</Typography.Text>
            <Typography.Text type="tertiary">{node.description}</Typography.Text>
            <Collapse activeKey={open} onChange={(keys) => setOpen(keys)}>
                {items.map((item) => (
                    <Collapse.Panel key={item.key} header={(item.value as { name?: string } | undefined)?.name || `联系人 ${item.index + 1}`} itemKey={item.field} x-field-id={item.field}>
                        {render(item.field)}
                    </Collapse.Panel>
                ))}
            </Collapse>
            {error && <Typography.Text type="danger">{error.join(' ')}</Typography.Text>}
            <Button disabled={!canAdd} onClick={add} style={{ justifySelf: 'start' }}>
                添加联系人
            </Button>
        </div>
    );

    return (
        <Form
            getFormApi={setFormApi}
            initValues={{ contacts: [{ name: 'Ann', email: 'ann@example.com' }, { name: 'Bob' }] }}
            schema={schema}
            style={{ width: 480 }}
            onRevealField={(field) => {
                const row = rowOf(field);
                if (row) setOpen((keys) => [...keys, row]);
            }}
        >
            <SchemaField renderers={{ ...semiRenderers, array: renderContacts }} renderField={{ 'contacts[]': (context) => context.kind === 'object' && context.content }} />
            <Button style={{ marginBlockStart: 12 }} onClick={() => formApi?.focusField('contacts[1].email')}>
                定位到 Bob 的邮箱
            </Button>
        </Form>
    );
}

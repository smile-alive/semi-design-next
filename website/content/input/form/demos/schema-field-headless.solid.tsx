import { For, Show, createSignal } from 'solid-js';
import * as z from 'zod';
import { Button, Collapse, Form, type FormApi, type SchemaArrayContext, SchemaField, type SchemaFieldProps, semiRenderers, Typography } from '@fibrae/semi-ui-solid';

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

const renderField: SchemaFieldProps['renderField'] = {
    'contacts[]': (context) => context.kind === 'object' && context.content,
};

export default function FormDemo() {
    const [open, setOpen] = createSignal(['contacts[0]']);
    let formApi: FormApi | undefined;

    const renderContacts = (context: SchemaArrayContext) => (
        <div {...context.fieldProps} style={{ display: 'grid', gap: '8px' }}>
            <Typography.Text strong>{`${context.node.title}（${context.count}）`}</Typography.Text>
            <Typography.Text type="tertiary">{context.node.description}</Typography.Text>
            <Collapse activeKey={open()} onChange={(keys) => setOpen(keys)}>
                <For each={context.items}>
                    {(item) => (
                        <Collapse.Panel header={(item.value as { name?: string } | undefined)?.name || `联系人 ${item.index + 1}`} itemKey={item.field} x-field-id={item.field}>
                            {context.render(() => item.field)}
                        </Collapse.Panel>
                    )}
                </For>
            </Collapse>
            <Show when={context.error}>{(error) => <Typography.Text type="danger">{error().join(' ')}</Typography.Text>}</Show>
            <Button disabled={!context.canAdd} onClick={context.add} style={{ 'justify-self': 'start' }}>
                添加联系人
            </Button>
        </div>
    );

    return (
        <Form
            getFormApi={(api) => (formApi = api)}
            initValues={{ contacts: [{ name: 'Ann', email: 'ann@example.com' }, { name: 'Bob' }] }}
            schema={schema}
            style={{ width: '480px' }}
            onRevealField={(field) => {
                const row = rowOf(field);
                if (row) setOpen((keys) => [...keys, row]);
            }}
        >
            <SchemaField renderers={{ ...semiRenderers, array: renderContacts }} renderField={renderField} />
            <Button style={{ 'margin-block-start': '12px' }} onClick={() => formApi?.focusField('contacts[1].email')}>
                定位到 Bob 的邮箱
            </Button>
        </Form>
    );
}

<script lang="ts">
    import * as z from 'zod';
    import { Button, Collapse, Form, SchemaField, semiRenderers, Typography, type FormApi, type SchemaArrayContext, type SchemaFieldContext } from '@fibrae/semi-ui-svelte';

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

    let open = $state(['contacts[0]']);
    let formApi: FormApi | undefined;
</script>

{#snippet contacts(context: SchemaArrayContext)}
    <div {...context.fieldProps} style="display: grid; gap: 8px">
        <Typography.Text strong>{context.node.title}（{context.count}）</Typography.Text>
        <Typography.Text type="tertiary">{context.node.description}</Typography.Text>
        <Collapse activeKey={open} onChange={(keys) => (open = keys)}>
            {#each context.items as item (item.key)}
                <Collapse.Panel itemKey={item.field}>
                    {#snippet header()}{(item.value as { name?: string } | undefined)?.name || `联系人 ${item.index + 1}`}{/snippet}
                    <div {...{ 'x-field-id': item.field }}>
                        {@render context.render(item.field)}
                    </div>
                </Collapse.Panel>
            {/each}
        </Collapse>
        {#if context.error}
            <Typography.Text type="danger">{context.error.join(' ')}</Typography.Text>
        {/if}
        <Button disabled={!context.canAdd} style="justify-self: start" onclick={context.add}>添加联系人</Button>
    </div>
{/snippet}

{#snippet contactRow(context: SchemaFieldContext)}
    {#if context.kind === 'object'}
        {@render context.content()}
    {/if}
{/snippet}

<Form
    getFormApi={(api) => (formApi = api)}
    initValues={{ contacts: [{ name: 'Ann', email: 'ann@example.com' }, { name: 'Bob' }] }}
    onRevealField={(field) => {
        const row = rowOf(field);
        if (row) open = [...open, row];
    }}
    {schema}
    style="width: 480px"
>
    <SchemaField renderField={{ 'contacts[]': contactRow }} renderers={{ ...semiRenderers, array: contacts }} />
    <Button style="margin-block-start: 12px" onclick={() => formApi?.focusField('contacts[1].email')}>定位到 Bob 的邮箱</Button>
</Form>

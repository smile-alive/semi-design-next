<script lang="ts">
    import { IconMinusCircle, IconPlusCircle } from '@fibrae/semi-icons-svelte';
    import { ArrayField, Button, Card, Form, FormInput, FormSelect, Typography } from '@fibrae/semi-ui-svelte';

    const selectOption = [
        { label: '发件人地址', value: 'address' },
        { label: '邮件主题', value: 'title' },
        { label: '发送时间', value: 'sendTime' },
        { label: '接收时间', value: 'receiveTime' },
        { label: '正文', value: 'main' },
        { label: '附件名称', value: 'attachmentName' },
    ];
    const typeOption = [
        { label: '包含', value: 'include' },
        { label: '不包含', value: 'exclude' },
    ];

    const initValue = {
        group: [
            {
                name: '收信规则1',
                rules: [
                    { ruleType: 'address', type: 'include', text: 'example.com' },
                    { ruleType: 'title', type: 'exclude', text: '更新日志' },
                ],
            },
            {
                name: '收信规则2',
                rules: [{ ruleType: 'sendTime', type: 'include', text: '2019' }],
            },
        ],
    };

    const newRule = {
        name: '新规则名称',
        rules: [
            { ruleType: 'main', type: 'include', text: '' },
            { ruleType: 'attachmentName', type: 'include', text: '' },
        ],
    };

    const rowStyle = 'margin-block-start: 12px; margin-inline-start: 12px';
</script>

{#snippet plus()}
    <IconPlusCircle />
{/snippet}

{#snippet minus()}
    <IconMinusCircle />
{/snippet}

<Form allowEmpty initValues={initValue} labelPosition="left" onValueChange={(values) => console.log(values)} style="text-align: start">
    <ArrayField field="group">
        {#snippet children(group)}
            <Button icon={plus} theme="solid" onclick={() => group.onAddWithInitValue(newRule)}>新增收信规则</Button>
            {#each group.arrayFields as item (item.key)}
                <div style="width: 1000px; display: flex; flex-wrap: wrap">
                    <FormInput field={`${item.field}[name]`} label="规则名称" labelPosition="top" style="width: 600px" />
                    <Button aria-label="删除规则" icon={minus} style="margin-block-start: 36px; margin-inline-start: 12px" type="danger" onclick={item.onRemove} />
                    <Typography.Text strong style="flex-basis: 100%">当邮件到达，满足以下条件时：</Typography.Text>
                    <Card shadows="hover" style="width: 620px; margin-block-start: 12px; margin-inline-start: 24px">
                        <ArrayField field={`${item.field}.rules`}>
                            {#snippet children(rules)}
                                {#each rules.arrayFields as rule, i (rule.key)}
                                    <div style="display: flex">
                                        <FormSelect field={`${rule.field}[ruleType]`} label={`${rule.field}.ruleType`} noLabel optionList={selectOption} style="width: 120px; margin-inline-end: 12px" />
                                        <FormSelect field={`${rule.field}[type]`} label={`${rule.field}.type`} noLabel optionList={typeOption} style="width: 100px; margin-inline-end: 12px" />
                                        <FormInput aria-label="条件内容" field={`${rule.field}[text]`} label={`${rule.field}.text`} noLabel style="width: 200px" />
                                        <Button aria-label="删除条件" icon={minus} style={rowStyle} theme="borderless" type="danger" onclick={rule.onRemove} />
                                        <Button aria-label="新增条件" disabled={i !== rules.arrayFields.length - 1} icon={plus} style={rowStyle} onclick={() => rules.onAddWithInitValue({ ruleType: `条件${rules.arrayFields.length + 1}`, type: 'include' })} />
                                    </div>
                                {/each}
                            {/snippet}
                        </ArrayField>
                    </Card>
                </div>
            {/each}
        {/snippet}
    </ArrayField>
</Form>

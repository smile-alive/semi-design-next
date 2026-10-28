import { For } from 'solid-js';
import { IconMinusCircle, IconPlusCircle } from '@fibrae/semi-icons-solid';
import { ArrayField, Button, Card, Form, FormInput, FormSelect, Typography } from '@fibrae/semi-ui-solid';

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
                { ruleType: 'address', type: 'include', text: 'bytedance.com' },
                { ruleType: 'title', type: 'exclude', text: '更新日志' },
            ],
        },
        {
            name: '收信规则2',
            rules: [{ ruleType: 'sendTime', type: 'include', text: '2019' }],
        },
    ],
};

const rowStyle = {
    'margin-top': '12px',
    'margin-left': '12px',
};

function NestedField(props: { field: string }) {
    return (
        <ArrayField field={`${props.field}.rules`}>
            {(rules) => (
                <For each={rules.arrayFields}>
                    {(row, i) => (
                        <div style={{ display: 'flex' }}>
                            <FormSelect field={`${row.field}[ruleType]`} label={`${row.field}.ruleType`} noLabel optionList={selectOption} style={{ width: '120px', 'margin-right': '12px' }} />
                            <FormSelect field={`${row.field}[type]`} label={`${row.field}.type`} noLabel style={{ width: '100px', 'margin-right': '12px' }} optionList={typeOption} />
                            <FormInput field={`${row.field}[text]`} label={`${row.field}.text`} aria-label="条件内容" noLabel style={{ width: '200px' }} />
                            <Button type="danger" theme="borderless" style={rowStyle} aria-label="删除条件" icon={<IconMinusCircle />} onClick={row.remove} />
                            <Button
                                aria-label="新增条件"
                                icon={<IconPlusCircle />}
                                style={rowStyle}
                                disabled={i() !== rules.arrayFields.length - 1}
                                onClick={() =>
                                    rules.addWithInitValue({
                                        ruleType: `条件${rules.arrayFields.length + 1}`,
                                        type: 'include',
                                    })
                                }
                            />
                        </div>
                    )}
                </For>
            )}
        </ArrayField>
    );
}

export default function FormDemo() {
    return (
        <Form onValueChange={(values) => console.log(values)} initValues={initValue} labelPosition="left" style={{ 'text-align': 'left' }} allowEmpty>
            <ArrayField field="group">
                {(group) => (
                    <>
                        <Button
                            icon={<IconPlusCircle />}
                            theme="solid"
                            onClick={() =>
                                group.addWithInitValue({
                                    name: '新规则名称',
                                    rules: [
                                        { ruleType: 'main', type: 'include', text: '' },
                                        { ruleType: 'attachmentName', type: 'include', text: '' },
                                    ],
                                })
                            }
                        >
                            新增收信规则
                        </Button>
                        <For each={group.arrayFields}>
                            {(row) => (
                                <div style={{ width: '1000px', display: 'flex', 'flex-wrap': 'wrap' }}>
                                    <FormInput field={`${row.field}[name]`} labelPosition="top" label="规则名称" style={{ width: '600px' }} />
                                    <Button type="danger" style={{ margin: '36px 0 0 12px' }} aria-label="删除规则" icon={<IconMinusCircle />} onClick={row.remove} />
                                    <Typography.Text strong style={{ 'flex-basis': '100%' }}>
                                        当邮件到达，满足以下条件时：
                                    </Typography.Text>
                                    <Card shadows="hover" style={{ width: '620px', margin: '12px 0 0 24px' }}>
                                        <NestedField field={row.field} />
                                    </Card>
                                </div>
                            )}
                        </For>
                    </>
                )}
            </ArrayField>
        </Form>
    );
}

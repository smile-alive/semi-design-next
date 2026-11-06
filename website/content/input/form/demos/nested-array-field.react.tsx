import { IconPlusCircle, IconMinusCircle } from '@fibrae/semi-icons-react';
import { Form, FormInput, FormSelect, ArrayField, Button, Card, Typography } from '@fibrae/semi-ui-react';

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

const newRule = {
    name: '新规则名称',
    rules: [
        { ruleType: 'main', type: 'include', text: '' },
        { ruleType: 'attachmentName', type: 'include', text: '' },
    ],
};

const rowStyle = { marginBlockStart: 12, marginInlineStart: 12 };

export default function FormDemo() {
    return (
        <Form onValueChange={(values) => console.log(values)} initValues={initValue} labelPosition="left" style={{ textAlign: 'start' }} allowEmpty>
            <ArrayField field="group">
                {(group) => (
                    <>
                        <Button icon={<IconPlusCircle />} theme="solid" onClick={() => group.addWithInitValue(newRule)}>
                            新增收信规则
                        </Button>
                        {group.arrayFields.map((item) => (
                            <div key={item.key} style={{ width: 1000, display: 'flex', flexWrap: 'wrap' }}>
                                <FormInput field={`${item.field}[name]`} labelPosition="top" label="规则名称" style={{ width: '600px' }} />
                                <Button type="danger" style={{ marginBlockStart: 36, marginInlineStart: 12 }} aria-label="删除规则" icon={<IconMinusCircle />} onClick={item.remove} />
                                <Typography.Text strong style={{ flexBasis: '100%' }}>
                                    当邮件到达，满足以下条件时：
                                </Typography.Text>
                                <Card shadows="hover" style={{ width: 620, marginBlockStart: 12, marginInlineStart: 24 }}>
                                    <ArrayField field={`${item.field}.rules`}>
                                        {(rules) =>
                                            rules.arrayFields.map((rule, i) => (
                                                <div key={rule.key} style={{ display: 'flex' }}>
                                                    <FormSelect field={`${rule.field}[ruleType]`} label={`${rule.field}.ruleType`} noLabel optionList={selectOption} style={{ width: 120, marginInlineEnd: 12 }} />
                                                    <FormSelect field={`${rule.field}[type]`} label={`${rule.field}.type`} noLabel style={{ width: 100, marginInlineEnd: 12 }} optionList={typeOption} />
                                                    <FormInput field={`${rule.field}[text]`} label={`${rule.field}.text`} aria-label="条件内容" noLabel style={{ width: 200 }} />
                                                    <Button type="danger" theme="borderless" style={rowStyle} aria-label="删除条件" icon={<IconMinusCircle />} onClick={rule.remove} />
                                                    <Button
                                                        aria-label="新增条件"
                                                        icon={<IconPlusCircle />}
                                                        style={rowStyle}
                                                        disabled={i !== rules.arrayFields.length - 1}
                                                        onClick={() =>
                                                            rules.addWithInitValue({
                                                                ruleType: `条件${rules.arrayFields.length + 1}`,
                                                                type: 'include',
                                                            })
                                                        }
                                                    />
                                                </div>
                                            ))
                                        }
                                    </ArrayField>
                                </Card>
                            </div>
                        ))}
                    </>
                )}
            </ArrayField>
        </Form>
    );
}

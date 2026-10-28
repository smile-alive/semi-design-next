import React from 'react';
import { IconPlusCircle, IconMinusCircle } from '@fibrae/semi-icons-react';
import { Form, ArrayField, Button, Card, Typography } from '@fibrae/semi-ui-react';

const selectOption = [
    { label: '发件人地址', value: 'address' },
    { label: '邮件主题', value: 'title' },
    { label: '发送时间', value: 'sendTime' },
    { label: '接收时间', value: 'receiveTime' },
    { label: '正文', value: 'main' },
    { label: '附件名称', value: 'attachmentName' },
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

const NestedField = (props: { field: string }) => {
    const rowStyle = {
        marginTop: 12,
        marginLeft: 12,
    };
    return (
        <ArrayField field={`${props.field}.rules`}>
            {({ arrayFields, addWithInitValue }) => (
                <React.Fragment>
                    {arrayFields.map(({ field, key, remove }, i) => (
                        <div style={{ display: 'flex' }} key={key}>
                            <Form.Select field={`${field}[ruleType]`} label={`${field}.ruleType`} noLabel optionList={selectOption} style={{ width: 120, marginRight: 12 }} />
                            <Form.Select
                                field={`${field}[type]`}
                                label={`${field}.type`}
                                noLabel
                                style={{ width: 100, marginRight: 12 }}
                                optionList={[
                                    { label: '包含', value: 'include' },
                                    { label: '不包含', value: 'exclude' },
                                ]}
                            />
                            <Form.Input field={`${field}[text]`} label={`${field}.text`} aria-label="条件内容" noLabel style={{ width: 200 }} />
                            <Button type="danger" theme="borderless" style={rowStyle} aria-label="删除条件" icon={<IconMinusCircle />} onClick={remove} />
                            <Button
                                aria-label="新增条件"
                                icon={<IconPlusCircle />}
                                style={rowStyle}
                                disabled={i !== arrayFields.length - 1}
                                onClick={() => {
                                    addWithInitValue({
                                        ruleType: `条件${arrayFields.length + 1}`,
                                        type: 'include',
                                    });
                                }}
                            />
                        </div>
                    ))}
                </React.Fragment>
            )}
        </ArrayField>
    );
};

export default function FormDemo() {
    return (
        <Form onValueChange={(values) => console.log(values)} initValues={initValue} labelPosition="left" style={{ textAlign: 'left' }} allowEmpty>
            <ArrayField field="group">
                {({ arrayFields, addWithInitValue }) => (
                    <React.Fragment>
                        <Button
                            icon={<IconPlusCircle />}
                            theme="solid"
                            onClick={() => {
                                addWithInitValue({
                                    name: '新规则名称',
                                    rules: [
                                        { ruleType: 'main', type: 'include', text: '' },
                                        { ruleType: 'attachmentName', type: 'include', text: '' },
                                    ],
                                });
                            }}
                        >
                            新增收信规则
                        </Button>
                        {arrayFields.map(({ field, key, remove }) => (
                            <div key={key} style={{ width: 1000, display: 'flex', flexWrap: 'wrap' }}>
                                <Form.Input field={`${field}[name]`} labelPosition="top" label="规则名称" style={{ width: '600px' }} />
                                <Button type="danger" style={{ margin: '36px 0 0 12px' }} aria-label="删除规则" icon={<IconMinusCircle />} onClick={remove} />
                                <Typography.Text strong style={{ flexBasis: '100%' }}>
                                    当邮件到达，满足以下条件时：
                                </Typography.Text>
                                <Card
                                    shadows="hover"
                                    style={{
                                        width: 620,
                                        margin: '12px 0 0 24px',
                                    }}
                                >
                                    <NestedField field={field} />
                                </Card>
                            </div>
                        ))}
                    </React.Fragment>
                )}
            </ArrayField>
        </Form>
    );
}

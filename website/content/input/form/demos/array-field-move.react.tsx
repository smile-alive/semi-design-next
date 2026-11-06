import { IconArrowDown, IconArrowUp } from '@fibrae/semi-icons-react';
import { ArrayField, Button, Form, Space } from '@fibrae/semi-ui-react';

const steps = [{ title: '需求评审' }, { title: '开发' }, { title: '测试' }, { title: '发布' }];

export default function FormDemo() {
    return (
        <Form style={{ width: 480 }}>
            <ArrayField field="steps" initValue={steps}>
                {({ arrayFields, move }) =>
                    arrayFields.map(({ field, key }, index) => (
                        <Space key={key} align="end">
                            <Form.Input field={`${field}.title`} label={`第 ${index + 1} 步`} style={{ width: 280 }} />
                            <Button aria-label={`上移第 ${index + 1} 步`} disabled={index === 0} theme="borderless" icon={<IconArrowUp />} onClick={() => move(index, index - 1)} />
                            <Button aria-label={`下移第 ${index + 1} 步`} disabled={index === arrayFields.length - 1} theme="borderless" icon={<IconArrowDown />} onClick={() => move(index, index + 1)} />
                        </Space>
                    ))
                }
            </ArrayField>
        </Form>
    );
}

import { RadioGroup, Radio, Space } from '@fibrae/semi-ui-react';

const sizes = ['small', 'middle', 'large'] as const;

export default function RadioDemo() {
    return (
        <Space vertical spacing="loose" align="start">
            {sizes.map((size) => (
                <RadioGroup key={size} type="button" buttonSize={size} defaultValue={1} aria-label="单选组合示例" name={`demo-radio-${size}`}>
                    <Radio value={1}>即时推送</Radio>
                    <Radio value={2}>定时推送</Radio>
                    <Radio value={3}>动态推送</Radio>
                </RadioGroup>
            ))}
        </Space>
    );
}

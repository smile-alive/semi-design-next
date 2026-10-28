import { RadioGroup, Radio, Space } from '@fibrae/semi-ui-react';

export default function RadioDemo() {
    return (
        <Space vertical spacing="loose" align="start">
            <RadioGroup type="button" buttonSize="small" defaultValue={1} aria-label="单选组合示例" name="demo-radio-small">
                <Radio value={1}>即时推送</Radio>
                <Radio value={2}>定时推送</Radio>
                <Radio value={3}>动态推送</Radio>
            </RadioGroup>
            <RadioGroup type="button" buttonSize="middle" defaultValue={1} aria-label="单选组合示例" name="demo-radio-middle">
                <Radio value={1}>即时推送</Radio>
                <Radio value={2}>定时推送</Radio>
                <Radio value={3}>动态推送</Radio>
            </RadioGroup>
            <RadioGroup type="button" buttonSize="large" defaultValue={1} aria-label="单选组合示例" name="demo-radio-large">
                <Radio value={1}>即时推送</Radio>
                <Radio value={2}>定时推送</Radio>
                <Radio value={3}>动态推送</Radio>
            </RadioGroup>
        </Space>
    );
}

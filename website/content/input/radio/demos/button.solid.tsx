import { For } from 'solid-js';
import { Radio, RadioGroup, Space } from '@fibrae/semi-ui-solid';

const sizes = ['small', 'middle', 'large'] as const;

export default function RadioDemo() {
    return (
        <Space vertical spacing="loose" align="start">
            <For each={sizes}>
                {(size) => (
                    <RadioGroup type="button" buttonSize={size} defaultValue={1} aria-label="单选组合示例" name={`demo-radio-${size}`}>
                        <Radio value={1}>即时推送</Radio>
                        <Radio value={2}>定时推送</Radio>
                        <Radio value={3}>动态推送</Radio>
                    </RadioGroup>
                )}
            </For>
        </Space>
    );
}

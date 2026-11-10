import { RadioGroup, Radio } from '@fibrae/semi-ui-react';

const extra = 'Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用';

export default function RadioDemo() {
    return (
        <RadioGroup type="card" defaultValue={2} direction="vertical" aria-label="单选组合示例" name="demo-radio-group-card">
            <Radio value={1} disabled extra={extra} style={{ width: 280 }}>
                单选框标题
            </Radio>
            <Radio value={2} extra={extra} style={{ width: 280 }}>
                单选框标题
            </Radio>
            <Radio value={3} extra={extra} style={{ width: 280 }}>
                单选框标题
            </Radio>
        </RadioGroup>
    );
}

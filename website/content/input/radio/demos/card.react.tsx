import { RadioGroup, Radio } from '@fibrae/semi-ui-react';

export default function RadioDemo() {
    return (
        <RadioGroup type="card" defaultValue={2} direction="vertical" aria-label="单选组合示例" name="demo-radio-group-card">
            <Radio value={1} disabled extra="Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统" style={{ width: 280 }}>
                单选框标题
            </Radio>
            <Radio value={2} extra="Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统" style={{ width: 280 }}>
                单选框标题
            </Radio>
            <Radio value={3} extra="Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统" style={{ width: 280 }}>
                单选框标题
            </Radio>
        </RadioGroup>
    );
}

import { Radio, RadioGroup } from '@fibrae/semi-ui-solid';

const extra = 'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统';

export default function RadioDemo() {
    return (
        <RadioGroup type="pureCard" defaultValue={2} direction="vertical" aria-label="单选组合示例" name="demo-radio-group-pureCard">
            <Radio value={1} disabled extra={extra} style={{ width: '280px' }}>
                单选框标题
            </Radio>
            <Radio value={2} extra={extra} style={{ width: '280px' }}>
                单选框标题
            </Radio>
            <Radio value={3} extra={extra} style={{ width: '280px' }}>
                单选框标题
            </Radio>
        </RadioGroup>
    );
}

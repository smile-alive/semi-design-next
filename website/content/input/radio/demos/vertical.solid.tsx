import { Radio, RadioGroup } from '@fibrae/semi-ui-solid';

export default function RadioDemo() {
    return (
        <RadioGroup direction="vertical" aria-label="单选组合示例" name="demo-radio-group-vertical">
            <Radio value={1}>A</Radio>
            <Radio value={2}>B</Radio>
            <Radio value={3}>C</Radio>
            <Radio value={4}>D</Radio>
        </RadioGroup>
    );
}

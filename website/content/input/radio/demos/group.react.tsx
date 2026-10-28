import { useState } from 'react';
import { RadioGroup, Radio, type RadioChangeEvent } from '@fibrae/semi-ui-react';

export default function RadioDemo() {
    const [value, setValue] = useState(1);
    const onChange = (e: RadioChangeEvent) => {
        console.log('radio checked', e.target.value);
        setValue(e.target.value);
    };
    return (
        <RadioGroup onChange={onChange} value={value} aria-label="单选组合示例" name="demo-radio-group">
            <Radio value={1}>A</Radio>
            <Radio value={2}>B</Radio>
            <Radio value={3}>C</Radio>
            <Radio value={4}>D</Radio>
        </RadioGroup>
    );
}

import { createSignal } from 'solid-js';
import { Radio, type RadioChangeEvent } from '@fibrae/semi-ui-solid';

export default function RadioDemo() {
    const [checked, setChecked] = createSignal(true);
    const toggle = (e: RadioChangeEvent) => {
        console.log('radio checked', e.target.checked);
        setChecked(e.target.checked);
    };
    return (
        <Radio checked={checked()} mode="advanced" onChange={toggle} aria-label="单选示例" name="demo-radio-advanced">
            允许取消选择
        </Radio>
    );
}

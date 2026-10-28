import { createSignal } from 'solid-js';
import { Button, Slider } from '@fibrae/semi-ui-solid';

export default function SliderDemo() {
    const [value, setValue] = createSignal(10);

    const changeValue = () => {
        setValue(value() + 10);
    };

    return (
        <div>
            <Button onClick={changeValue} style={{ 'margin-right': '20px' }}>
                点击改变value值
            </Button>
            <br />
            <br />
            <Slider aria-label="受控滑块" value={value()} />
        </div>
    );
}

import { createSignal } from 'solid-js';
import { InputNumber, Slider } from '@fibrae/semi-ui-solid';

export default function SliderDemo() {
    const [value, setValue] = createSignal(10);

    const getSliderValue = (newValue?: number | string | number[]) => {
        if (isNaN(Number(newValue))) {
            return;
        }
        setValue(Number(newValue));
    };

    return (
        <div>
            <div style={{ width: '320px', 'margin-right': '15px' }}>
                <Slider aria-label="数值" step={1} value={value()} onChange={getSliderValue} />
            </div>
            <InputNumber aria-label="数值" onChange={getSliderValue} style={{ width: '100px' }} value={value()} min={0} max={100} />
        </div>
    );
}

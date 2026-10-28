import { useState } from 'react';
import { Slider, InputNumber } from '@fibrae/semi-ui-react';

export default function SliderDemo() {
    const [value, setValue] = useState(10);

    const getSliderValue = (newValue?: number | string | number[]) => {
        if (isNaN(Number(newValue))) {
            return;
        }
        setValue(Number(newValue));
    };

    return (
        <div>
            <div style={{ width: 320, marginRight: 15 }}>
                <Slider aria-label="数值" step={1} value={value} onChange={getSliderValue} />
            </div>
            <InputNumber aria-label="数值" onChange={getSliderValue} style={{ width: 100 }} value={value} min={0} max={100} />
        </div>
    );
}

import { Slider } from '@fibrae/semi-ui-react';

export default function SliderDemo() {
    return (
        <div>
            <Slider aria-label="带提示的滑块" tipFormatter={(v) => `${v}%`} getAriaValueText={(v) => `${v}%`} />
            <br />
            <br />
            <Slider aria-label="不带提示的滑块" tipFormatter={null} />
        </div>
    );
}

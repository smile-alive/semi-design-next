import { Slider } from '@fibrae/semi-ui-react';

const formatPercent = (value: number) => `${value}%`;

export default function SliderDemo() {
    return (
        <div>
            <Slider aria-label="带提示的滑块" tipFormatter={formatPercent} getAriaValueText={formatPercent} />
            <br />
            <br />
            <Slider aria-label="不带提示的滑块" tipFormatter={null} />
        </div>
    );
}

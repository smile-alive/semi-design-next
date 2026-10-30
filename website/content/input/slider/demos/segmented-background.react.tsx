import { useState, useMemo } from 'react';
import { Slider } from '@fibrae/semi-ui-react';

const range = [10, 100];

function getRailStyle(value: number[]) {
    // transparent lets the middle segment show the track color
    const color = ['var(--semi-color-danger)', 'transparent', 'var(--semi-color-success)'];
    const gradientPos = value.map((val) => Number(((val - range[0]) / (range[1] - range[0])).toFixed(2)) * 100);
    const style = {
        background: `linear-gradient(to right, ${color[0]} ${gradientPos[0]}%, ${color[1]} ${gradientPos[0]}%, ${color[1]} ${gradientPos[1]}%, ${color[2]} ${gradientPos[1]}%)`,
    };
    return style;
}

export default function SliderDemo() {
    const [value, setValue] = useState([20, 60]);

    const changeValue = (newValue?: number | number[]) => {
        if (Array.isArray(newValue)) {
            setValue(newValue);
        }
    };

    const railStyle = useMemo(() => getRailStyle(value), [value]);

    return <Slider aria-label="Value range" range min={range[0]} max={range[1]} onChange={changeValue} railStyle={railStyle} value={value} />;
}

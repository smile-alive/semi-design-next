import { Slider } from '@fibrae/semi-ui-react';

const stepTenMarks = { 0: '0', 10: '10', 20: '20', 30: '30', 40: '40', 50: '50', 100: '100' };
const stepTenthMarks = { 0.1: '0.1', 0.2: '0.2', 0.3: '0.3', 0.4: '0.4', 0.5: '0.5' };
const celsiusMarks = { 20: '20°C', 40: '40°C' };
const formatCelsius = (value: number) => `${value}°C`;

export default function SliderDemo() {
    return (
        <div>
            <div id="slider-marks-step-10">step=10</div>
            <Slider aria-labelledby="slider-marks-step-10" step={10} marks={stepTenMarks} defaultValue={[10, 100]} range />
            <br />
            <br />
            <div id="slider-marks-step-01">step=0.1</div>
            <Slider aria-labelledby="slider-marks-step-01" step={0.1} marks={stepTenthMarks} min={0} max={1} defaultValue={[0.1, 0.5]} range />
            <br />
            <br />
            <div id="slider-marks-marks">Marks</div>
            <Slider aria-labelledby="slider-marks-marks" marks={celsiusMarks} defaultValue={[0, 100]} tipFormatter={formatCelsius} range getAriaValueText={formatCelsius} />
            <br />
            <br />
            <div id="slider-marks-included">Included</div>
            <Slider aria-labelledby="slider-marks-included" marks={celsiusMarks} included={false} defaultValue={[0, 100]} range tipFormatter={formatCelsius} getAriaValueText={formatCelsius} />
        </div>
    );
}

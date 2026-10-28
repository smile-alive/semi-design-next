import { Slider } from '@fibrae/semi-ui-react';

export default function SliderDemo() {
    return (
        <div>
            <div id="slider-marks-step-10">step=10</div>
            <Slider aria-labelledby="slider-marks-step-10" step={10} marks={{ 0: '0', 10: '10', 20: '20', 30: '30', 40: '40', 50: '50', 100: '100' }} defaultValue={[10, 100]} range />
            <br />
            <br />
            <div id="slider-marks-step-01">step=0.1</div>
            <Slider aria-labelledby="slider-marks-step-01" step={0.1} marks={{ 0.1: '0.1', 0.2: '0.2', 0.3: '0.3', 0.4: '0.4', 0.5: '0.5' }} min={0} max={1} defaultValue={[0.1, 0.5]} range />
            <br />
            <br />
            <div id="slider-marks-marks">Marks</div>
            <Slider aria-labelledby="slider-marks-marks" marks={{ 20: '20°C', 40: '40°C' }} defaultValue={[0, 100]} tipFormatter={(v) => `${v}°C`} range getAriaValueText={(value) => `${value}°C`} />
            <br />
            <br />
            <div id="slider-marks-included">Included</div>
            <Slider aria-labelledby="slider-marks-included" marks={{ 20: '20°C', 40: '40°C' }} included={false} defaultValue={[0, 100]} range tipFormatter={(v) => `${v}°C`} getAriaValueText={(value) => `${value}°C`} />
        </div>
    );
}

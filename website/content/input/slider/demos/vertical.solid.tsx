import { Slider } from '@fibrae/semi-ui-solid';

const boxStyle = {
    height: '300px',
    'margin-left': '30px',
    'margin-top': '10px',
    'padding-right': '30px',
    display: 'inline-block',
};

const marks = { 20: '20°C', 40: '40°C' };

export default function SliderDemo() {
    return (
        <div>
            <div style={boxStyle}>
                <Slider aria-label="Vertical slider" vertical />
            </div>
            <div style={boxStyle}>
                <Slider aria-label="Reversed vertical slider" vertical verticalReverse />
            </div>
            <div style={boxStyle}>
                <Slider aria-label="Vertical range slider" vertical range defaultValue={[20, 60]} />
            </div>
            <div style={boxStyle}>
                <Slider aria-label="Reversed vertical range slider" vertical verticalReverse range defaultValue={[20, 60]} />
            </div>
            <div style={boxStyle}>
                <Slider aria-label="Vertical range slider with marks" vertical range marks={marks} step={10} defaultValue={[20, 60]} />
            </div>
            <div style={boxStyle}>
                <Slider aria-label="Reversed vertical range slider with marks" vertical verticalReverse range marks={marks} step={10} defaultValue={[20, 60]} />
            </div>
        </div>
    );
}

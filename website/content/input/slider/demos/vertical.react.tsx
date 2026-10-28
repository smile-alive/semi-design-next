import { Slider } from '@fibrae/semi-ui-react';

export default function SliderDemo() {
    return (
        <div>
            <div style={{ height: 300, marginLeft: 30, marginTop: 10, paddingRight: 30, display: 'inline-block' }}>
                <Slider aria-label="Vertical slider" vertical />
            </div>
            <div style={{ height: 300, marginLeft: 30, marginTop: 10, paddingRight: 30, display: 'inline-block' }}>
                <Slider aria-label="Reversed vertical slider" vertical verticalReverse />
            </div>
            <div style={{ height: 300, marginLeft: 30, marginTop: 10, paddingRight: 30, display: 'inline-block' }}>
                <Slider aria-label="Vertical range slider" vertical range defaultValue={[20, 60]} />
            </div>
            <div style={{ height: 300, marginLeft: 30, marginTop: 10, paddingRight: 30, display: 'inline-block' }}>
                <Slider aria-label="Reversed vertical range slider" vertical verticalReverse range defaultValue={[20, 60]} />
            </div>
            <div style={{ height: 300, marginLeft: 30, marginTop: 10, paddingRight: 30, display: 'inline-block' }}>
                <Slider aria-label="Vertical range slider with marks" vertical range marks={{ 20: '20°C', 40: '40°C' }} step={10} defaultValue={[20, 60]} />
            </div>
            <div style={{ height: 300, marginLeft: 30, marginTop: 10, paddingRight: 30, display: 'inline-block' }}>
                <Slider aria-label="Reversed vertical range slider with marks" vertical verticalReverse range marks={{ 20: '20°C', 40: '40°C' }} step={10} defaultValue={[20, 60]} />
            </div>
        </div>
    );
}

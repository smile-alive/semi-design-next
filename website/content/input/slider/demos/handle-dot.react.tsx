import { Slider } from '@fibrae/semi-ui-react';

export default function SliderDemo() {
    return (
        <div>
            <div>
                <div id="slider-handle-dot-default">Default</div>
                <Slider aria-labelledby="slider-handle-dot-default" showBoundary handleDot={{ size: '4px', color: 'blue' }} />
            </div>
            <br />
            <br />
            <div>
                <div id="slider-handle-dot-range">Range</div>
                <Slider
                    aria-labelledby="slider-handle-dot-range"
                    defaultValue={[20, 60]}
                    range
                    handleDot={[
                        { size: '4px', color: 'blue' },
                        { size: '4px', color: 'pink' },
                    ]}
                />
            </div>
        </div>
    );
}

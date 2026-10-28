import { Slider } from '@fibrae/semi-ui-react';

export default function SliderDemo() {
    return (
        <div>
            <div>
                <div>默认</div>
                <Slider aria-label="默认滑动输入条" showBoundary />
            </div>
            <br />
            <br />
            <div>
                <div>范围</div>
                <Slider aria-label="范围滑动输入条" defaultValue={[20, 60]} range />
            </div>
            <br />
            <br />
            <div>
                <div>禁用</div>
                <Slider aria-label="禁用滑动输入条" defaultValue={40} disabled />
            </div>
        </div>
    );
}

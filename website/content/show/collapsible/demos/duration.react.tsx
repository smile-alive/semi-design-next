import { useState } from 'react';
import { Collapsible, InputNumber, Button } from '@fibrae/semi-ui-react';

export default function CollapsibleDemo() {
    const [isOpen, setOpen] = useState(false);
    const [duration, setDuration] = useState(250);
    const toggle = () => {
        setOpen(!isOpen);
    };
    const collapsed = (
        <ul>
            <li>
                <p>Semi Design 以内容优先进行设计。</p>
            </li>
            <li>
                <p>更容易地自定义主题。</p>
            </li>
            <li>
                <p>适用国际化场景。</p>
            </li>
            <li>
                <p>效率场景加入人性化关怀。</p>
            </li>
        </ul>
    );
    return (
        <div>
            <span id="collapsible-duration-label">设置动画时间：</span>
            <InputNumber aria-labelledby="collapsible-duration-label" min={0} defaultValue={250} style={{ width: 120 }} onChange={(val) => setDuration(Number(val))} step={10} />
            <br />
            <Button onClick={toggle} aria-expanded={isOpen} aria-controls="collapsible-duration">
                Toggle
            </Button>
            <Collapsible isOpen={isOpen} duration={duration} id="collapsible-duration">
                {collapsed}
            </Collapsible>
        </div>
    );
}

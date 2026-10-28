import { useState } from 'react';
import { Collapsible, Button } from '@fibrae/semi-ui-react';

export default function CollapsibleDemo() {
    const [isOpen, setOpen] = useState(false);
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
            <Button onClick={toggle} aria-expanded={isOpen} aria-controls="collapsible-basic">
                Toggle
            </Button>
            <Collapsible isOpen={isOpen} id="collapsible-basic">
                {collapsed}
            </Collapsible>
        </div>
    );
}

import { createSignal } from 'solid-js';
import { Button, Collapsible } from '@fibrae/semi-ui-solid';

export default function CollapsibleDemo() {
    const [isOpen, setOpen] = createSignal(false);
    const toggle = () => {
        setOpen(!isOpen());
    };
    return (
        <div>
            <Button onClick={toggle} aria-expanded={isOpen()} aria-controls="collapsible-basic">
                Toggle
            </Button>
            <Collapsible isOpen={isOpen()} id="collapsible-basic">
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
            </Collapsible>
        </div>
    );
}

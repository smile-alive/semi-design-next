import { createSignal } from 'solid-js';
import { Button, Collapsible } from '@fibrae/semi-ui-solid';

export default function CollapsibleDemo() {
    const [isOpen, setOpen] = createSignal(false);
    const [isChildOpen, setChildOpen] = createSignal(false);

    return (
        <div>
            <Button onClick={() => setOpen(!isOpen())} aria-expanded={isOpen()} aria-controls="collapsible-nested">
                Toggle
            </Button>
            <br />
            <Collapsible isOpen={isOpen()} id="collapsible-nested">
                <div>
                    <span>Semi Design的设计原则包括：</span>
                    <Button onClick={() => setChildOpen(!isChildOpen())} aria-expanded={isChildOpen()} aria-controls="collapsible-nested-list">
                        Toggle List
                    </Button>
                </div>
                <Collapsible isOpen={isChildOpen()} id="collapsible-nested-list">
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
            </Collapsible>
        </div>
    );
}

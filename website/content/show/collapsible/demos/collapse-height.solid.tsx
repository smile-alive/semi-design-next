import { createSignal, type JSX, Show } from 'solid-js';
import { Button, Collapsible } from '@fibrae/semi-ui-solid';

const linkStyle: JSX.CSSProperties = {
    position: 'absolute',
    left: '0',
    right: '0',
    width: '100%',
    padding: '0',
    border: 'none',
    background: 'none',
    'font-size': 'inherit',
    'font-family': 'inherit',
    'line-height': 'inherit',
    'text-align': 'center',
    bottom: '-10px',
    'font-weight': '700',
    cursor: 'pointer',
    color: 'var(--semi-color-link)',
};

export default function CollapsibleDemo() {
    const [isOpen, setOpen] = createSignal(false);
    const toggle = () => {
        setOpen(!isOpen());
    };
    return (
        <>
            <Button onClick={toggle} aria-expanded={isOpen()} aria-controls="collapsible-height">
                Toggle
            </Button>
            <div style={{ position: 'relative' }}>
                <Collapsible
                    isOpen={isOpen()}
                    collapseHeight={60}
                    style={
                        isOpen()
                            ? {}
                            : {
                                  '-webkit-mask-image': 'linear-gradient(to bottom, black 0%, rgba(0, 0, 0, 1) 60%, rgba(0, 0, 0, 0.2) 80%, transparent 100%)',
                              }
                    }
                    id="collapsible-height"
                >
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
                <Show when={!isOpen()}>
                    <button type="button" onClick={toggle} aria-expanded={isOpen()} aria-controls="collapsible-height" style={linkStyle}>
                        + Show More
                    </button>
                </Show>
            </div>
        </>
    );
}

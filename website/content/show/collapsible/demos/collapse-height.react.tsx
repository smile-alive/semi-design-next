import { useState, type CSSProperties } from 'react';
import { Collapsible, Button } from '@fibrae/semi-ui-react';

export default function CollapsibleDemo() {
    const [isOpen, setOpen] = useState(false);
    const maskStyle = isOpen
        ? {}
        : {
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, rgba(0, 0, 0, 1) 60%, rgba(0, 0, 0, 0.2) 80%, transparent 100%)',
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
    const toggle = () => {
        setOpen(!isOpen);
    };
    const linkStyle: CSSProperties = {
        position: 'absolute',
        left: 0,
        right: 0,
        width: '100%',
        padding: 0,
        border: 'none',
        background: 'none',
        fontSize: 'inherit',
        fontFamily: 'inherit',
        lineHeight: 'inherit',
        textAlign: 'center',
        bottom: -10,
        fontWeight: 700,
        cursor: 'pointer',
        color: 'var(--semi-color-link)',
    };
    return (
        <>
            <Button onClick={toggle} aria-expanded={isOpen} aria-controls="collapsible-height">
                Toggle
            </Button>
            <div style={{ position: 'relative' }}>
                <Collapsible isOpen={isOpen} collapseHeight={60} style={{ ...maskStyle }} id="collapsible-height">
                    {collapsed}
                </Collapsible>
                {!isOpen && (
                    <button type="button" onClick={toggle} aria-expanded={isOpen} aria-controls="collapsible-height" style={{ ...linkStyle }}>
                        + Show More
                    </button>
                )}
            </div>
        </>
    );
}

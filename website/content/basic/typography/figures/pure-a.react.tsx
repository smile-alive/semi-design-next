import type { CSSProperties, ReactNode } from 'react';

export default function PureA(props: { style?: CSSProperties; children?: ReactNode }) {
    return (
        <span
            style={{
                fontWeight: 600,
                color: 'var(--semi-color-link-visited)',
                lineHeight: '20px',
                fontSize: 14,
                ...props.style,
            }}
        >
            {props.children}
        </span>
    );
}

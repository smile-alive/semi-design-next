import type { CSSProperties, ReactNode } from 'react';

export interface BaseProps {
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
}

import type { CSSProperties, ReactNode } from 'react';
import type { VALIDATE_STATUS } from '@fibrae/semi-foundation/base/constants';
import type { ArrayElement } from './base';

export type ValidateStatus = ArrayElement<typeof VALIDATE_STATUS>;

export interface BaseProps {
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
}

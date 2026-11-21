import type { CSSProperties } from 'react';
import type { DescriptionsPart } from '@fibrae/semi-foundation/components/descriptions/constants';
import { createContext } from '../../base/index';

export type DescriptionsAlign = 'center' | 'justify' | 'left' | 'plain';
export type DescriptionLayout = 'horizontal' | 'vertical';

export interface DescriptionsContextValue {
    align?: DescriptionsAlign;
    layout?: DescriptionLayout;
    classNames?: Partial<Record<DescriptionsPart, string>>;
    styles?: Partial<Record<DescriptionsPart, CSSProperties>>;
}

export const [DescriptionsContext, useDescriptionsContext] = createContext<DescriptionsContextValue>('Descriptions', { defaultValue: {} });

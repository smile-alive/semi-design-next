import type { ClassValue, ComputedRef, StyleValue } from 'vue';
import type { DescriptionsPart } from '@fibrae/semi-foundation/components/descriptions/constants';
import { createContext } from '../../base/index';
import type { DescriptionsAlign, DescriptionsLayout } from './interface';

export interface DescriptionsContextValue {
    align?: DescriptionsAlign;
    layout?: DescriptionsLayout;
    classNames?: Partial<Record<DescriptionsPart, ClassValue>>;
    styles?: Partial<Record<DescriptionsPart, StyleValue>>;
}

export const [provideDescriptionsContext, useDescriptionsContext] = createContext<ComputedRef<DescriptionsContextValue>>('Descriptions', { optional: true });

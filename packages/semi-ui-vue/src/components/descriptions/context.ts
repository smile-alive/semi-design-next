import type { ComputedRef } from 'vue';
import { createContext } from '../../base/index';
import type { DescriptionsAlign, DescriptionsLayout } from './interface';

export interface DescriptionsContextValue {
    align?: DescriptionsAlign;
    layout?: DescriptionsLayout;
}

export const [provideDescriptionsContext, useDescriptionsContext] = createContext<ComputedRef<DescriptionsContextValue>>('Descriptions', { optional: true });

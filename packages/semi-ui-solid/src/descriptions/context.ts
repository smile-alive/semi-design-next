import type { Accessor } from 'solid-js';
import { createContext } from '../_base/create-context';
import type { DescriptionsAlign, DescriptionsLayout } from './interface';

export interface DescriptionsView {
    align: DescriptionsAlign;
    layout: DescriptionsLayout;
}

export const [DescriptionsContext, useDescriptionsContext] = createContext<Accessor<DescriptionsView>>('Descriptions');

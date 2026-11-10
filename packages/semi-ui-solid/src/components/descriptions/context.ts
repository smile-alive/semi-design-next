import type { Accessor } from 'solid-js';
import { createContext } from '../../base/index';
import type { DescriptionsAlign, DescriptionsLayout } from './interface';

export interface DescriptionsView {
    align: DescriptionsAlign;
    layout: DescriptionsLayout;
}

export const [DescriptionsContext, useDescriptionsContext] = createContext<Accessor<DescriptionsView>>('Descriptions');

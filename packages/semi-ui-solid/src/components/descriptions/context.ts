import type { Accessor, JSX } from 'solid-js';
import type { DescriptionsPart } from '@fibrae/semi-foundation/components/descriptions/constants';
import { createContext } from '../../base/index';
import type { DescriptionsAlign, DescriptionsLayout } from './interface';

export interface DescriptionsView {
    align: DescriptionsAlign;
    layout: DescriptionsLayout;
    classNames?: Partial<Record<DescriptionsPart, string>>;
    styles?: Partial<Record<DescriptionsPart, JSX.CSSProperties | string>>;
}

export const [DescriptionsContext, useDescriptionsContext] = createContext<Accessor<DescriptionsView>>('Descriptions');

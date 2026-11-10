import { createContext } from '../../base/index';

export type DescriptionsAlign = 'center' | 'justify' | 'left' | 'plain';
export type DescriptionLayout = 'horizontal' | 'vertical';

export interface DescriptionsContextValue {
    align?: DescriptionsAlign;
    layout?: DescriptionLayout;
}

export const [DescriptionsContext, useDescriptionsContext] = createContext<DescriptionsContextValue>('Descriptions', { defaultValue: {} });

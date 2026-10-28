import type { StyleValue, VNode } from 'vue';
import type { SpaceProps } from '../space/interface';

export type Shadows = 'hover' | 'always';
export type CardGroupType = 'grid';

export interface CardProps {
    /** Content area inline style */
    bodyStyle?: StyleValue;
    bordered?: boolean;
    footerLine?: boolean;
    footerStyle?: StyleValue;
    headerLine?: boolean;
    headerStyle?: StyleValue;
    loading?: boolean;
    shadows?: Shadows;
    /** Shorthand for the `title` slot, which wins when both are given */
    title?: string;
}

export interface CardSlots {
    default?: () => VNode[];
    title?: () => VNode[];
    headerExtraContent?: () => VNode[];
    /** Replaces the title and headerExtraContent */
    header?: () => VNode[];
    cover?: () => VNode[];
    /** Every direct child becomes one action */
    actions?: () => VNode[];
    footer?: () => VNode[];
}

export interface MetaProps {
    /** Shorthand for the `title` slot, which wins when both are given */
    title?: string;
}

export interface MetaSlots {
    avatar?: () => VNode[];
    title?: () => VNode[];
    description?: () => VNode[];
}

export interface CardGroupProps extends Omit<SpaceProps, 'spacing'> {
    spacing?: number | [number, number];
    type?: CardGroupType;
}

export interface CardGroupSlots {
    default?: () => VNode[];
}

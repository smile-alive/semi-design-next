import type { ClassValue, StyleValue, VNode } from 'vue';
import type { CardMetaPart, CardPart } from '@fibrae/semi-foundation/components/card/constants';
import type { SpaceProps } from '../space/interface';

export type Shadows = 'hover' | 'always';
export type CardGroupType = 'grid';

export interface CardProps {
    bordered?: boolean;
    classNames?: Partial<Record<CardPart, ClassValue>>;
    footerLine?: boolean;
    headerLine?: boolean;
    loading?: boolean;
    shadows?: Shadows;
    styles?: Partial<Record<CardPart, StyleValue>>;
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
    actions?: () => VNode[];
    footer?: () => VNode[];
}

export interface MetaProps {
    classNames?: Partial<Record<CardMetaPart, ClassValue>>;
    styles?: Partial<Record<CardMetaPart, StyleValue>>;
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

import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { CardPart } from '@fibrae/semi-foundation/components/card/constants';
import type { SpaceProps } from '../space/interface.js';

export type Shadows = 'hover' | 'always';
export type CardGroupType = 'grid';

// `title` is the text or snippet of the header, not the native tooltip attribute HTMLAttributes declares
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    bordered?: boolean;
    classNames?: Partial<Record<CardPart, ClassValue>>;
    footerLine?: boolean;
    headerLine?: boolean;
    loading?: boolean;
    shadows?: Shadows;
    styles?: Partial<Record<CardPart, string>>;
    /** A string renders as a 6th-level title with a single-line ellipsis tooltip; a snippet renders as it is */
    title?: string | Snippet;
    headerExtraContent?: Snippet;
    header?: Snippet;
    cover?: Snippet;
    actions?: Snippet[];
    footer?: Snippet;
    children?: Snippet;
}

export interface MetaProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    title?: string | Snippet;
    avatar?: Snippet;
    description?: Snippet;
}

export interface CardGroupProps extends Omit<SpaceProps, 'spacing'> {
    spacing?: number | [number, number];
    type?: CardGroupType;
}

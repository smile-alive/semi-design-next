import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { SpaceProps } from '../space/interface.js';

export type Shadows = 'hover' | 'always';
export type CardGroupType = 'grid';

// `title` is the text or snippet of the header, not the native tooltip attribute HTMLAttributes declares
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Content area inline style */
    bodyStyle?: string;
    bordered?: boolean;
    footerLine?: boolean;
    footerStyle?: string;
    headerLine?: boolean;
    headerStyle?: string;
    loading?: boolean;
    shadows?: Shadows;
    /** A string renders as a 6th-level title with a single-line ellipsis tooltip; a snippet renders as it is */
    title?: string | Snippet;
    headerExtraContent?: Snippet;
    /** Replaces the title and headerExtraContent */
    header?: Snippet;
    cover?: Snippet;
    /** One snippet per action */
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

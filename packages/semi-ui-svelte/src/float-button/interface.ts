import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';
import type { strings } from '@fibrae/semi-foundation/float-button/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import type { BadgeProps } from '../badge/interface.js';

export type FloatButtonShape = ArrayElement<typeof strings.SHAPE>;
export type FloatButtonSize = ArrayElement<typeof strings.SIZE>;

/** Badge props; a count that is not text or a number is the `badgeCount` snippet. Listeners reach the badge's root. */
export type FloatButtonBadge = Omit<BadgeProps, 'children'>;

export interface FloatButtonProps extends Omit<HTMLButtonAttributes, 'children' | 'type' | 'form' | 'formaction' | 'formenctype' | 'formmethod' | 'formnovalidate' | 'formtarget'> {
    badge?: FloatButtonBadge;
    colorful?: boolean;
    disabled?: boolean;
    /** Renders a link instead of a button; a disabled link drops it */
    href?: string;
    rel?: string;
    shape?: FloatButtonShape;
    size?: FloatButtonSize;
    target?: string;
    /** Custom badge count, in place of `badge.count` */
    badgeCount?: Snippet;
    icon?: Snippet;
}

export interface FloatButtonGroupItem extends Pick<FloatButtonProps, 'badge' | 'colorful' | 'disabled' | 'href' | 'rel' | 'shape' | 'size' | 'target'> {
    /** Accessible name, required when the item shows only an icon */
    'aria-label'?: string;
    class?: string;
    /** Text; richer content is the `content` snippet */
    content?: string | number;
    id?: string;
    /** Called before the group's `onClick` */
    onClick?: (event: MouseEvent) => void;
    oncontextmenu?: (event: MouseEvent) => void;
    onmouseenter?: (event: MouseEvent) => void;
    onmouseleave?: (event: MouseEvent) => void;
    style?: string;
    title?: string;
    value?: string;
    [attr: `data-${string}`]: string | undefined;
}

export interface FloatButtonGroupItemSnippetArgs {
    item: FloatButtonGroupItem;
    index: number;
}

export interface FloatButtonGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    disabled?: boolean;
    items: FloatButtonGroupItem[];
    /** Called with the clicked item's `value`, which is optional; not called for clicks outside an item */
    onClick?: (value: string | undefined, event: MouseEvent) => void;
    badgeCount?: Snippet<[FloatButtonGroupItemSnippetArgs]>;
    content?: Snippet<[FloatButtonGroupItemSnippetArgs]>;
    icon?: Snippet<[FloatButtonGroupItemSnippetArgs]>;
}

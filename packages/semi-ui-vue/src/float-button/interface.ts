import type { HTMLAttributes, StyleValue, VNode } from 'vue';
import type { strings } from '@fibrae/semi-foundation/float-button/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import type { BadgeProps } from '../badge/interface';

export type FloatButtonShape = ArrayElement<typeof strings.SHAPE>;
export type FloatButtonSize = ArrayElement<typeof strings.SIZE>;

/** Badge props; a count that is not text or a number is the `badgeCount` slot. Listeners reach the badge's root. */
export interface FloatButtonBadge extends BadgeProps {
    class?: HTMLAttributes['class'];
    style?: StyleValue;
    onClick?: (event: MouseEvent) => void;
    onMouseenter?: (event: MouseEvent) => void;
    onMouseleave?: (event: MouseEvent) => void;
}

export interface FloatButtonProps {
    badge?: FloatButtonBadge;
    colorful?: boolean;
    disabled?: boolean;
    /** Renders a link instead of a button; a disabled link drops it */
    href?: string;
    rel?: string;
    shape?: FloatButtonShape;
    size?: FloatButtonSize;
    target?: string;
}

export interface FloatButtonSlots {
    /** Custom badge count, in place of `badge.count` */
    badgeCount?: () => VNode[];
    icon?: () => VNode[];
}

export interface FloatButtonEmits {
    /** Not emitted while disabled */
    click: [event: MouseEvent];
}

export interface FloatButtonGroupItem extends Pick<FloatButtonProps, 'badge' | 'colorful' | 'disabled' | 'href' | 'rel' | 'shape' | 'size' | 'target'> {
    /** Accessible name, required when the item shows only an icon */
    'aria-label'?: string;
    class?: HTMLAttributes['class'];
    /** Text; richer content is the `content` slot */
    content?: string | number;
    id?: string;
    /** Called before the group's `click` */
    onClick?: (event: MouseEvent) => void;
    onContextmenu?: (event: MouseEvent) => void;
    onMouseenter?: (event: MouseEvent) => void;
    onMouseleave?: (event: MouseEvent) => void;
    style?: StyleValue;
    title?: string;
    value?: string;
    [attr: `data-${string}`]: string | undefined;
}

export interface FloatButtonGroupItemSlotProps {
    item: FloatButtonGroupItem;
    index: number;
}

export interface FloatButtonGroupProps {
    disabled?: boolean;
    items: FloatButtonGroupItem[];
}

export interface FloatButtonGroupSlots {
    badgeCount?: (props: FloatButtonGroupItemSlotProps) => VNode[];
    content?: (props: FloatButtonGroupItemSlotProps) => VNode[];
    icon?: (props: FloatButtonGroupItemSlotProps) => VNode[];
}

export interface FloatButtonGroupEmits {
    /** `value` is the clicked item's, which is optional */
    click: [value: string | undefined, event: MouseEvent];
}

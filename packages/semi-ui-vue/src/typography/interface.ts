import type { AnchorHTMLAttributes, Component, StyleValue, VNode } from 'vue';
import type { strings } from '@fibrae/semi-foundation/typography/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import type { PopoverProps } from '../popover/interface';
import type { TooltipProps } from '../tooltip/interface';

export type TypographyBaseType = ArrayElement<typeof strings.TYPE>;
export type TypographyBaseSize = ArrayElement<typeof strings.SIZE>;
export type TypographyBaseSpacing = ArrayElement<typeof strings.SPACING>;
export type TypographyBaseRule = ArrayElement<typeof strings.RULE>;
export type TypographyBaseTruncate = ArrayElement<typeof strings.TRUNCATE>;

export type LinkType = AnchorHTMLAttributes | boolean;

export type EllipsisPos = 'end' | 'middle';

export interface ShowTooltip {
    /** Defaults to 'tooltip' */
    type?: 'tooltip' | 'popover';
    /** Props of the Tooltip or Popover; `class` and `style` land on the popup. Content is the `ellipsisContent` slot */
    opts?: Partial<TooltipProps> & Partial<PopoverProps> & { class?: unknown; style?: StyleValue };
}

export interface Ellipsis {
    collapseText?: string;
    collapsible?: boolean;
    expandText?: string;
    expandable?: boolean;
    pos?: EllipsisPos;
    rows?: number;
    showTooltip?: boolean | ShowTooltip;
    suffix?: string;
}

/** The icon, tips and custom render are the copyIcon, copyTip, copySuccessTip and copyAction slots */
export interface TypographyCopyableConfig {
    content?: string;
    /** Seconds the copied state lasts */
    duration?: number;
    /** Attached to the copy action's wrapping span */
    class?: unknown;
    /** Attached to the copy action's wrapping span */
    style?: StyleValue;
}

export interface TypographyProps {
    component?: string | Component;
}

export interface TypographySlots {
    default?: () => VNode[];
}

/** Props every Typography component takes besides the attributes of its root element */
export interface TypographyCommonProps {
    component?: string | Component;
    copyable?: TypographyCopyableConfig | boolean;
    delete?: boolean;
    disabled?: boolean;
    link?: LinkType;
    mark?: boolean;
    strong?: boolean;
    type?: TypographyBaseType;
    underline?: boolean;
}

export interface TypographyTextProps extends TypographyCommonProps {
    code?: boolean;
    ellipsis?: Ellipsis | boolean;
    size?: TypographyBaseSize;
    weight?: number;
}

export interface TypographyTitleProps extends TypographyCommonProps {
    ellipsis?: Ellipsis | boolean;
    heading?: ArrayElement<typeof strings.HEADING>;
    weight?: ArrayElement<typeof strings.WEIGHT> | number;
}

export interface TypographyParagraphProps extends TypographyCommonProps {
    ellipsis?: Ellipsis | boolean;
    size?: TypographyBaseSize;
    spacing?: TypographyBaseSpacing;
}

export interface TypographyNumeralProps extends TypographyCommonProps {
    code?: boolean;
    parser?: (value: string) => string;
    precision?: number;
    rule?: TypographyBaseRule;
    size?: TypographyBaseSize;
    truncate?: TypographyBaseTruncate;
}

export interface TypographyCopyActionProps {
    copied: boolean;
    copy: (e: MouseEvent) => void;
    config: TypographyCopyableConfig;
}

export interface TypographyCopySlots {
    copyIcon?: () => VNode[];
    copyTip?: () => VNode[];
    copySuccessTip?: () => VNode[];
    copyAction?: (props: TypographyCopyActionProps) => VNode[];
}

export interface TypographyEllipsisTooltipProps {
    /** The full text */
    content: string;
    /** The text element, to be placed in the custom popup with `<component :is="trigger" />` */
    trigger: VNode;
}

export interface TypographyEllipsisSlots {
    ellipsisContent?: () => VNode[];
    ellipsisTooltip?: (props: TypographyEllipsisTooltipProps) => VNode[];
}

export interface TypographyTextSlots extends TypographyCopySlots, TypographyEllipsisSlots {
    default?: () => VNode[];
    icon?: () => VNode[];
}

export interface TypographyTitleSlots extends TypographyCopySlots, TypographyEllipsisSlots {
    default?: () => VNode[];
}

export type TypographyParagraphSlots = TypographyTitleSlots;

export interface TypographyNumeralSlots extends TypographyCopySlots {
    default?: () => VNode[];
    icon?: () => VNode[];
}

export interface TypographyNumeralEmits {
    copy: [e: MouseEvent, content: string, res: boolean];
}

export interface TypographyTextEmits extends TypographyNumeralEmits {
    expand: [expanded: boolean, e: MouseEvent];
}

export type TypographyTitleEmits = TypographyTextEmits;
export type TypographyParagraphEmits = TypographyTextEmits;

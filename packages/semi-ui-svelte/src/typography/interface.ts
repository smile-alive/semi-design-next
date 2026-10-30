import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';
import type { strings } from '@fibrae/semi-foundation/typography/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import type { PopoverProps } from '../popover/interface.js';
import type { TooltipProps } from '../tooltip/interface.js';

export type TypographyBaseType = ArrayElement<typeof strings.TYPE>;
export type TypographyBaseSize = ArrayElement<typeof strings.SIZE>;
export type TypographyBaseSpacing = ArrayElement<typeof strings.SPACING>;
export type TypographyBaseRule = ArrayElement<typeof strings.RULE>;
export type TypographyBaseTruncate = ArrayElement<typeof strings.TRUNCATE>;

export type LinkType = HTMLAnchorAttributes | boolean;

export type EllipsisPos = 'end' | 'middle';

export interface ShowTooltip {
    /** Defaults to 'tooltip' */
    type?: 'tooltip' | 'popover';
    /** Props of the Tooltip or Popover; `class` and `style` land on the popup. Content is the `ellipsisContent` snippet */
    opts?: Partial<Omit<TooltipProps, 'children' | 'child' | 'content'>> & Partial<Omit<PopoverProps, 'children' | 'child' | 'content'>>;
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
    onExpand?: (expanded: boolean, event: MouseEvent) => void;
}

/** The icon, tips and custom render are the copyIcon, copyTip, copySuccessTip and copyAction snippets */
export interface TypographyCopyableConfig {
    content?: string;
    /** Seconds the copied state lasts */
    duration?: number;
    /** Attached to the copy action's wrapping span */
    class?: ClassValue;
    /** Attached to the copy action's wrapping span */
    style?: string;
    onCopy?: (event: MouseEvent, content: string, success: boolean) => void;
}

export interface TypographyProps extends HTMLAttributes<HTMLElement> {
    component?: string;
}

/** Props every Typography component takes besides the attributes of its root element */
export interface TypographyCommonProps {
    component?: string;
    copyable?: TypographyCopyableConfig | boolean;
    delete?: boolean;
    disabled?: boolean;
    link?: LinkType;
    mark?: boolean;
    strong?: boolean;
    type?: TypographyBaseType;
    underline?: boolean;
}

export interface TypographyCopyActionProps {
    copied: boolean;
    copy: (event: MouseEvent) => void;
    config: TypographyCopyableConfig;
}

export interface TypographyCopySnippets {
    copyIcon?: Snippet;
    copyTip?: Snippet;
    copySuccessTip?: Snippet;
    copyAction?: Snippet<[TypographyCopyActionProps]>;
}

export interface TypographyEllipsisTooltipProps {
    /** The full text */
    content: string;
    /** The text element, to be placed in the custom popup with `{@render trigger()}` */
    trigger: Snippet;
}

export interface TypographyEllipsisSnippets {
    ellipsisContent?: Snippet;
    ellipsisTooltip?: Snippet<[TypographyEllipsisTooltipProps]>;
}

export interface TypographyTextProps extends HTMLAttributes<HTMLSpanElement>, TypographyCommonProps, TypographyCopySnippets, TypographyEllipsisSnippets {
    code?: boolean;
    ellipsis?: Ellipsis | boolean;
    size?: TypographyBaseSize;
    weight?: number;
    icon?: Snippet;
}

export interface TypographyTitleProps extends HTMLAttributes<HTMLHeadingElement>, TypographyCommonProps, TypographyCopySnippets, TypographyEllipsisSnippets {
    ellipsis?: Ellipsis | boolean;
    heading?: ArrayElement<typeof strings.HEADING>;
    weight?: ArrayElement<typeof strings.WEIGHT> | number;
}

export interface TypographyParagraphProps extends HTMLAttributes<HTMLParagraphElement>, TypographyCommonProps, TypographyCopySnippets, TypographyEllipsisSnippets {
    ellipsis?: Ellipsis | boolean;
    size?: TypographyBaseSize;
    spacing?: TypographyBaseSpacing;
}

export interface TypographyNumeralProps extends HTMLAttributes<HTMLSpanElement>, TypographyCommonProps, TypographyCopySnippets {
    code?: boolean;
    parser?: (value: string) => string;
    precision?: number;
    rule?: TypographyBaseRule;
    size?: TypographyBaseSize;
    truncate?: TypographyBaseTruncate;
    icon?: Snippet;
}

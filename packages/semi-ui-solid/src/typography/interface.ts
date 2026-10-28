import type { Component, JSX, ValidComponent } from 'solid-js';
import type { strings } from '@fibrae/semi-foundation/typography/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import type { PopoverProps } from '../popover';
import type { TooltipProps } from '../tooltip';

export interface CopyableConfig {
    content?: string;
    /** Nodes are render functions: an object literal would create them whenever it is evaluated, also on the server where they are never inserted */
    copyTip?: string | (() => JSX.Element);
    successTip?: string | (() => JSX.Element);
    icon?: () => JSX.Element;
    /** Seconds the copied state lasts */
    duration?: number;
    /** Applied to the wrapping span */
    class?: string;
    /** Applied to the wrapping span */
    style?: JSX.CSSProperties | string;

    onCopy?: (e: MouseEvent, content: string, res: boolean) => void;

    render?: (copied: boolean, doCopy: (e: MouseEvent) => void, configs: CopyableConfig) => JSX.Element;
}

export type LinkType = JSX.AnchorHTMLAttributes<HTMLAnchorElement> | boolean;

export type EllipsisPos = 'end' | 'middle';
export type ShowTooltip = {
    type?: string;
    opts?: Partial<PopoverProps> & Partial<TooltipProps>;
    renderTooltip?: (content: TooltipProps['content'], children: JSX.Element) => JSX.Element;
};

export type Ellipsis = {
    collapseText?: string;
    collapsible?: boolean;
    expandText?: string;
    expandable?: boolean;
    pos?: EllipsisPos;
    rows?: number;
    showTooltip?: boolean | ShowTooltip;
    suffix?: string;
    onExpand?: (expanded: boolean, event: MouseEvent) => void;
};

/** Props every Typography component takes besides its own tag's attributes */
export interface TypographyCommonProps {
    class?: string;
    component?: ValidComponent;
    copyable?: CopyableConfig | boolean;
    delete?: boolean;
    disabled?: boolean;
    link?: LinkType;
    mark?: boolean;
    strong?: boolean;
    style?: JSX.CSSProperties | string;
    type?: TypographyBaseType;
    underline?: boolean;
}

/** Props of the components that can truncate their text; Numeral cannot */
export interface TypographyEllipsisProps {
    /**
     * Truncation options. Only plain-text (string) children can be truncated.
     * JS truncation is used for pos='middle', expandable, expandText, a non-empty suffix or copyable; otherwise CSS
     * truncation is used. CSS is cheaper (1-2 calculations, JS uses a binary search), so keep the number of
     * truncated Typography low, for example by paging a Table.
     */
    ellipsis?: Ellipsis | boolean;
}

/** An icon element, or an icon component that takes the size the text implies */
export type TypographyIcon = JSX.Element | Component<{ size?: 'small' | 'default' }>;

export type OmitTypographyProps = 'innerHTML' | 'textContent';
export type TypographyBaseType = ArrayElement<typeof strings.TYPE>;
export type TypographyBaseSize = ArrayElement<typeof strings.SIZE>;
export type TypographyBaseSpacing = ArrayElement<typeof strings.SPACING>;
export type TypographyBaseRule = ArrayElement<typeof strings.RULE>;
export type TypographyBaseTruncate = ArrayElement<typeof strings.TRUNCATE>;

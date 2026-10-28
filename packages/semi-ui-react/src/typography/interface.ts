import type React from 'react';
import type { ReactNode } from 'react';
import type { strings } from '@fibrae/semi-foundation/typography/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import type { PopoverProps } from '../popover';
import type { TooltipProps } from '../tooltip';

export interface CopyableConfig {
    content?: string;
    copyTip?: React.ReactNode;
    successTip?: React.ReactNode;
    icon?: React.ReactNode;
    /** Seconds the copied state lasts */
    duration?: number;
    /** Applied to the wrapping span */
    className?: string;
    /** Applied to the wrapping span */
    style?: React.CSSProperties;

    onCopy?: (e: React.MouseEvent, content: string, res: boolean) => void;

    render?: (copied: boolean, doCopy: (e: React.MouseEvent) => void, configs: CopyableConfig) => React.ReactNode;
}

export type LinkType = React.AnchorHTMLAttributes<HTMLAnchorElement> | boolean;

export type EllipsisPos = 'end' | 'middle';
export type ShowTooltip = {
    type?: string;
    opts?: Partial<PopoverProps> & Partial<TooltipProps>;
    renderTooltip?: (content: TooltipProps['content'], children: ReactNode) => ReactNode;
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
    onExpand?: (expanded: boolean, event: React.MouseEvent<HTMLButtonElement>) => void;
};
/** Props every Typography component takes besides its own tag's attributes */
export interface TypographyCommonProps {
    className?: string;
    component?: React.ElementType;
    copyable?: CopyableConfig | boolean;
    delete?: boolean;
    disabled?: boolean;
    link?: LinkType;
    mark?: boolean;
    strong?: boolean;
    style?: React.CSSProperties;
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

export type OmitTypographyProps = 'dangerouslySetInnerHTML';
export type TypographyBaseType = ArrayElement<typeof strings.TYPE>;
export type TypographyBaseSize = ArrayElement<typeof strings.SIZE>;
export type TypographyBaseSpacing = ArrayElement<typeof strings.SPACING>;
export type TypographyBaseRule = ArrayElement<typeof strings.RULE>;
export type TypographyBaseTruncate = ArrayElement<typeof strings.TRUNCATE>;

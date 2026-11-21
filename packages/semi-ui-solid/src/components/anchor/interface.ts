import type { JSX } from 'solid-js';
import type { AnchorLinkPart, AnchorPart, strings } from '@fibrae/semi-foundation/components/anchor/constants';
import type { AnchorBaseProps } from '@fibrae/semi-foundation/components/anchor/foundation';
import type { ArrayElement } from '@fibrae/semi-foundation/utils';
import type { ElementProps } from '../../base/index';
import type { Position } from '../tooltip';
import type { ShowTooltip } from '../typography/interface';

export type AnchorClickEvent = MouseEvent | KeyboardEvent;

type Style = JSX.CSSProperties | string;

export interface AnchorProps extends ElementProps<'div', 'onChange' | 'onClick'> {
    autoCollapse?: boolean;
    /** `item*` keys apply to every Anchor.Link, before the link's own classNames */
    classNames?: Partial<Record<AnchorPart, string>>;
    defaultAnchor?: string;
    getContainer?: () => HTMLElement | Window | null;
    maxHeight?: string | number;
    maxWidth?: string | number;
    offsetTop?: number;
    position?: Position;
    railTheme?: ArrayElement<typeof strings.SLIDE_COLOR>;
    scrollMotion?: boolean;
    /** Passed to scroll-into-view-if-needed when a link is clicked; `scrollMotion` and `targetOffset` still apply */
    scrollIntoViewOptions?: AnchorBaseProps['scrollIntoViewOptions'];
    showTooltip?: boolean | ShowTooltip;
    size?: ArrayElement<typeof strings.SIZE>;
    styles?: Partial<Record<AnchorPart, Style>>;
    targetOffset?: number;
    onChange?: (currentLink: string, previousLink: string) => void;
    onClick?: (e: AnchorClickEvent, currentLink: string) => void;
}

export type { AnchorBaseState as AnchorState } from '@fibrae/semi-foundation/components/anchor/foundation';

/** `ref` and `class` land on the link's list item div */
export interface LinkProps extends ElementProps<'div', 'title'> {
    /** Applied after the `itemTitle` classNames of the parent Anchor */
    classNames?: Partial<Record<AnchorLinkPart, string>>;
    styles?: Partial<Record<AnchorLinkPart, Style>>;
    href?: string;
    title?: JSX.Element;
    disabled?: boolean;
}

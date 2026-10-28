import type React from 'react';
import { Children, isValidElement, useLayoutEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import type { Options as ScrollIntoViewOptions } from 'scroll-into-view-if-needed';
import { cssClasses, strings } from '@fibrae/semi-foundation/anchor/constants';
import AnchorFoundation, { type AnchorAdapter, type AnchorNode } from '@fibrae/semi-foundation/anchor/foundation';
import { findAnchorTarget } from '@fibrae/semi-foundation/anchor/utils';
import '@fibrae/semi-foundation/anchor/anchor.scss';
import type { ArrayElement, ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';
import useLocale from '../locale/use-locale';
import ReactResizeObserver from '../resize-observer';
import type { Position } from '../tooltip';
import type { ShowTooltip } from '../typography/interface';
import { AnchorContext } from './anchor-context';
import Link from './link';

const prefixCls = cssClasses.PREFIX;

function normalizeChildren(children: React.ReactNode): AnchorNode[] {
    return Children.toArray(children).flatMap((child) => {
        if (!isValidElement<{ href?: string; children?: React.ReactNode }>(child)) {
            return [];
        }
        return [{ href: child.props.href, children: normalizeChildren(child.props.children) }];
    });
}

export type { LinkProps } from './link';

/** A link is activated by a click or by Enter */
type AnchorClickEvent = React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;

export interface AnchorProps extends ElementProps<'div', 'onChange' | 'onClick'> {
    autoCollapse?: boolean;
    className?: string;
    children?: React.ReactNode;
    defaultAnchor?: string;
    getContainer?: () => HTMLElement | Window | null;
    maxHeight?: string | number;
    maxWidth?: string | number;
    offsetTop?: number;
    position?: Position;
    railTheme?: ArrayElement<typeof strings.SLIDE_COLOR>;
    scrollMotion?: boolean;
    /** Passed to scroll-into-view-if-needed when a link is clicked; `scrollMotion` and `targetOffset` still apply */
    scrollIntoViewOptions?: ScrollIntoViewOptions;
    showTooltip?: boolean | ShowTooltip;
    size?: ArrayElement<typeof strings.SIZE>;
    style?: React.CSSProperties;
    targetOffset?: number;
    onChange?: (currentLink: string, previousLink: string) => void;
    onClick?: (e: AnchorClickEvent, currentLink: string) => void;
    'aria-label'?: React.AriaAttributes['aria-label'];
    /** Attached to the root navigation div */
    ref?: React.Ref<HTMLDivElement>;
}

export interface AnchorState {
    activeLink: string;
    links: string[];
    clickLink: boolean;
    slideBarTop: string;
}

const defaultProps = {
    size: 'default',
    railTheme: 'primary',
    className: '',
    scrollMotion: false,
    autoCollapse: false,
    offsetTop: 0,
    targetOffset: 0,
    showTooltip: false,
    maxWidth: strings.MAX_WIDTH,
    maxHeight: strings.MAX_HEIGHT,
    getContainer: () => window,
    defaultAnchor: '',
} satisfies Partial<AnchorProps>;

function Anchor(rawProps: AnchorProps) {
    const props = useDefaultProps('Anchor', rawProps, defaultProps);
    const { ref, size, railTheme, style, className, children, maxWidth, maxHeight, showTooltip, position, autoCollapse, defaultAnchor, getContainer, offsetTop, scrollMotion, scrollIntoViewOptions, targetOffset, onChange, onClick, 'aria-label': ariaLabel, ...rest } = props;

    const { locale } = useLocale('Anchor');

    const rootRef = useRef<HTMLDivElement>(null);

    const [foundation, state] = useFoundation<AnchorFoundation<AnchorProps, AnchorState, AnchorClickEvent>, AnchorAdapter<AnchorProps, AnchorState, AnchorClickEvent>, AnchorProps, AnchorState>(
        AnchorFoundation,
        props,
        () => ({ activeLink: '', links: [], clickLink: false, slideBarTop: '0' }),
        (base) => ({
            getContainer: () => base.getProps().getContainer() || window,
            getAnchorNode: (selector) => rootRef.current?.querySelector<HTMLElement>(selector) ?? null,
            getContentNode: (link) => findAnchorTarget(rootRef.current, link),
            notifyChange: (currentLink, previousLink) => base.getProps().onChange?.(currentLink, previousLink),
            notifyClick: (e, link) => base.getProps().onClick?.(e, link),
        })
    );

    const mergedRef = useMergedRef(ref, rootRef);
    const { activeLink, slideBarTop } = state;

    const wrapperCls = clsx(prefixCls, className, {
        [`${prefixCls}-size-${size}`]: size,
    });

    const slideCls = clsx(`${prefixCls}-slide`, `${prefixCls}-slide-${railTheme}`);

    const slideBarCls = clsx(`${prefixCls}-slide-bar`, {
        [`${prefixCls}-slide-bar-${size}`]: size,
        [`${prefixCls}-slide-bar-${railTheme}`]: railTheme,
        [`${prefixCls}-slide-bar-active`]: activeLink,
    });

    const childMap = useMemo(() => AnchorFoundation.getChildMap(normalizeChildren(children)), [children]);

    // children come from props and skip re-rendering, so a stable value spares every Link the renders that only move
    // the slide bar or the click-scroll flag
    const contextValue = useMemo(
        () => ({
            activeLink,
            showTooltip,
            position,
            childMap,
            autoCollapse,
            size,
            level: 1,
            onClick: foundation.handleClick,
            addLink: foundation.addLink,
            removeLink: foundation.removeLink,
        }),
        [activeLink, showTooltip, position, childMap, autoCollapse, size, foundation]
    );

    // every commit: a stable getContainer can return a node that appears later, and links above the active one can
    // move it without the active link changing
    useLayoutEffect(() => {
        foundation.handleContainerChange();
        foundation.syncSlideBar();
    });

    return (
        <AnchorContext value={contextValue}>
            <div {...rest} ref={mergedRef} className={wrapperCls} style={{ ...style, maxWidth, maxHeight }} aria-label={ariaLabel || locale.label} role="navigation">
                <div className={`${prefixCls}-rail-wrapper`}>
                    <div className={slideCls} aria-hidden>
                        <span className={slideBarCls} style={{ top: slideBarTop }} />
                    </div>
                    {/* a narrower container wraps link titles, which moves the active link without any commit */}
                    <ReactResizeObserver onResize={() => foundation.syncSlideBar()}>
                        <div className={`${prefixCls}-link-wrapper`} role="list">
                            {children}
                        </div>
                    </ReactResizeObserver>
                </div>
            </div>
        </AnchorContext>
    );
}

export default Object.assign(Anchor, { Link });

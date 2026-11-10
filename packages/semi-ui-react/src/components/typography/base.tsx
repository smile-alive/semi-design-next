import type React from 'react';
import { Children, cloneElement, createElement, isValidElement, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/typography/constants';
import { getCopyConfig } from '@fibrae/semi-foundation/components/typography/copy';
import { EllipsisRuntime, canUseCSSEllipsis, getEllipsisOpt, getExpandButton, getRenderText, isExpandFocusTarget, isInsideWidgetItem, isOverflowed, isOverflowing, isPopoverTooltip, isTooltipTriggerFocusable } from '@fibrae/semi-foundation/components/typography/ellipsis';
import warning from '@fibrae/semi-foundation/utils/warning';
import type { BaseProps } from '../../base/base-props';
import useFocusHandover from '../../hooks/use-focus-handover';
import useMergedRef from '../../hooks/use-merged-ref';
import ReactResizeObserver, { ObserverProperty } from '../../internal/resize-observer';
import { isSemiIcon } from '../../utils';
import type { IconSize as Size } from '../icons/index';
import useLocale from '../locale/use-locale';
import Popover from '../popover/index';
import { useTooltipDescription } from '../tooltip/context';
import Tooltip from '../tooltip/index';
import { SizeContext, useSizeContext } from './context';
import Copyable from './copyable';
import type { CopyableConfig, Ellipsis, LinkType, ShowTooltip, TypographyBaseSize, TypographyCommonProps, TypographyEllipsisProps } from './interface';
import { TypographyElement, type TypographyProps } from './typography';

interface BaseTypographyProps extends BaseProps, TypographyCommonProps, TypographyEllipsisProps {
    icon?: React.ReactNode;
    size?: TypographyBaseSize;
    code?: boolean;
    children?: React.ReactNode;
    spacing?: string;
    /** Title's tag, which also picks the heading class */
    headingTag?: `h${1 | 2 | 3 | 4 | 5 | 6}`;
    weight?: string | number;
    tabIndex?: number;
    /** Attached to the root element */
    ref?: React.Ref<HTMLElement>;
}

// The Tooltip's description lands here when the root opts out of it, so a focused link announces the full text
function DescribedAnchor({ children, ...props }: React.ComponentProps<'a'>) {
    const description = useTooltipDescription();

    return (
        <a {...props} aria-describedby={props['aria-describedby'] ?? description}>
            {children}
        </a>
    );
}

// Tooltip forces tabIndex 0 on its trigger; the text keeps it only when `focusable`
function TooltipTrigger({ focusable, tabIndex, ...props }: TypographyProps & { focusable: boolean }) {
    return <TypographyElement {...props} tabIndex={focusable ? tabIndex : undefined} />;
}

interface EllipsisView {
    children: React.ReactNode;
    isOverflowed: boolean;
    ellipsisContent: React.ReactNode;
    expanded: boolean;
    isTruncated: boolean;
}

const prefixCls = cssClasses.PREFIX;

const initialView: EllipsisView = {
    children: null,
    isOverflowed: false,
    ellipsisContent: null,
    expanded: false,
    isTruncated: false,
};

// JSX like `{a} text {b}` builds a new array every render, so arrays compare by items
function isSameChildren(a: React.ReactNode, b: React.ReactNode) {
    return Object.is(a, b) || (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, i) => Object.is(item, b[i])));
}

// isTruncated starts true so the expand button renders and the measurement includes its width
function syncChildren(view: EllipsisView, children: React.ReactNode, ellipsis: Ellipsis | boolean) {
    if (isSameChildren(view.children, children)) {
        return view;
    }
    if (!ellipsis) {
        return { ...view, children };
    }
    return { children, isOverflowed: false, ellipsisContent: children, expanded: false, isTruncated: true };
}

function getTooltipConfig({ showTooltip, expandable, expandText }: Pick<Ellipsis, 'showTooltip' | 'expandable' | 'expandText'>): ShowTooltip | false {
    const noExpandText = !expandable && expandText === undefined;
    if (!(noExpandText && showTooltip)) {
        return false;
    }
    if (typeof showTooltip !== 'object') {
        return { type: 'tooltip' };
    }
    if (isPopoverTooltip(showTooltip)) {
        return {
            ...showTooltip,
            opts: {
                showArrow: true,
                ...showTooltip.opts,
                className: clsx(`${prefixCls}-ellipsis-popover`, showTooltip.opts?.className),
            },
        };
    }
    return { ...showTooltip, type: showTooltip.type ?? 'tooltip' };
}

function getCopyText(copyable: CopyableConfig | boolean, children: React.ReactNode) {
    const parts = Children.toArray((copyable as CopyableConfig)?.content ?? children);
    warning(parts.some(isValidElement), 'Content to be copied in Typography is a object, it will case a [object Object] mistake when copy to clipboard.');
    return parts.join('');
}

interface Decorations {
    mark: boolean;
    code: boolean;
    underline: boolean;
    strong: boolean;
    link: LinkType;
    disabled: boolean;
    delete: boolean;
}

function wrapperDecorations(decorations: Decorations, content: React.ReactNode, clickable: boolean) {
    const { mark, code, underline, strong, link, disabled } = decorations;
    let wrapped = content;
    const wrap = (isNeeded: LinkType, tag: string) => {
        if (!isNeeded) {
            return;
        }
        let props: Record<string, unknown> = {};
        if (typeof isNeeded === 'object') {
            // a disabled link keeps its look only; handlers, href and target must not reach the span
            const { className, style } = isNeeded;
            props = disabled && tag === 'span' ? { className, style } : { ...isNeeded };
        }
        // an anchor without href is neither focusable nor a link, so a clickable one is made so by hand
        if (tag === 'a' && !props.href && (clickable || props.onClick)) {
            const onKeyDown = props.onKeyDown as React.KeyboardEventHandler<HTMLElement> | undefined;
            props = {
                role: 'link',
                tabIndex: 0,
                ...props,
                onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
                    onKeyDown?.(e);
                    if (!e.defaultPrevented && e.key === 'Enter' && e.target === e.currentTarget) {
                        e.currentTarget.click();
                    }
                },
            };
        }
        wrapped = createElement(tag === 'a' ? DescribedAnchor : tag, props, wrapped);
    };
    wrap(mark, 'mark');
    wrap(code, 'code');
    wrap(underline && !link, 'u');
    wrap(strong, 'strong');
    wrap(decorations.delete, 'del');
    wrap(link, disabled ? 'span' : 'a');
    return wrapped;
}

export default function Base({
    ref,
    component,
    children = null,
    className = '',
    type = 'primary',
    spacing = 'normal',
    disabled = false,
    style,
    ellipsis = false,
    icon = '',
    size = 'normal',
    link = false,
    headingTag,
    weight,
    tabIndex,
    copyable = false,
    strong = false,
    mark = false,
    underline = false,
    code,
    delete: isDelete = false,
    ...rest
}: BaseTypographyProps): React.ReactNode {
    const contextSize = useSizeContext();
    const { locale } = useLocale('Typography');

    const wrapperRef = useRef<HTMLElement>(null);
    const expandRef = useRef<HTMLButtonElement>(null);
    const copyRef = useRef<HTMLSpanElement>(null);
    const [runtime] = useState(() => new EllipsisRuntime());
    const [storedView, setView] = useState(() => syncChildren(initialView, children, ellipsis));
    const [insideWidgetItem, setInsideWidgetItem] = useState(false);
    let view = storedView;

    const handoverFocus = useFocusHandover<HTMLButtonElement>(() => wrapperRef.current);

    const mergedRef = useMergedRef(ref, wrapperRef);
    const mergedExpandRef = useMergedRef(expandRef, handoverFocus);
    const synced = syncChildren(storedView, children, ellipsis);

    if (synced !== storedView) {
        view = synced;
        setView(synced);
    }

    let expandNode: React.ReactNode = null;

    const realSize = size === 'inherit' ? contextSize : size;
    const hasEllipsis = Boolean(ellipsis);
    const opt = getEllipsisOpt(ellipsis, locale.expand, locale.collapse);
    const { rows, pos, suffix, expandable, expandText, collapsible } = opt;
    const onExpand = typeof ellipsis === 'object' ? ellipsis.onExpand : undefined;
    const cssEllipsis = hasEllipsis && canUseCSSEllipsis(opt, copyable);
    const hasTooltip = Boolean(opt.showTooltip);
    const hasCopyable = Boolean(copyable);
    const expandButton = getExpandButton(view, opt);
    const focusTarget = isExpandFocusTarget(view, opt);

    const update = (patch: Partial<EllipsisView>) => setView((prev) => ((Object.keys(patch) as Array<keyof EllipsisView>).every((key) => Object.is(prev[key], patch[key])) ? prev : { ...prev, ...patch }));

    const measure = useEffectEvent(() => {
        const node = wrapperRef.current;
        if (!node) {
            return;
        }
        setInsideWidgetItem(isInsideWidgetItem(node, copyRef.current));
        if (cssEllipsis) {
            // a text that switched here from an expandable ellipsis must not stay expanded. Measuring only on hover
            // would leave the first hover without a Tooltip
            update({ isTruncated: false, expanded: false, ...(hasTooltip && { isOverflowed: isOverflowing(node, rows) }) });
            return;
        }
        if (children === null) {
            update({ isTruncated: false, isOverflowed: false });
            return;
        }
        const childList = Children.toArray(children);
        warning(childList.some(isValidElement), '[Semi Typography] Only children with pure text could be used with ellipsis at this moment.');
        if (!rows || rows < 0 || view.expanded) {
            return;
        }
        // joined so a stray number or array cannot crash the measurement (#2167)
        const realChildren = childList.join('');
        const content = getRenderText(node, rows, realChildren, { expand: expandRef.current, copy: copyRef.current }, suffix, pos, strong);
        update({ isOverflowed: false, ellipsisContent: content, isTruncated: realChildren !== content });
    });

    const onHover = () => {
        if (cssEllipsis) {
            update({ isOverflowed: isOverflowing(wrapperRef.current, rows), isTruncated: false });
        }
    };

    const toggleOverflow = (e: React.MouseEvent<HTMLButtonElement>) => {
        onExpand?.(!view.expanded, e);
        if ((expandable && !view.expanded) || (collapsible && view.expanded)) {
            update({ expanded: !view.expanded });
        }
    };

    useLayoutEffect(() => {
        if (!hasEllipsis) {
            return undefined;
        }
        runtime.connect(() => measure());
        return () => runtime.disconnect();
    }, [runtime, hasEllipsis]);

    // depends on config fields, not the object, since inline objects change identity; isTruncated re-measures with the
    // expand button's width
    useLayoutEffect(() => {
        if (hasEllipsis) {
            runtime.schedule();
        }
    }, [runtime, hasEllipsis, view.children, view.isTruncated, view.expanded, rows, pos, suffix, expandText, hasTooltip, hasCopyable, strong]);

    if (expandButton) {
        expandNode = (
            <button key="expand" ref={mergedExpandRef} type="button" className={`${prefixCls}-ellipsis-expand`} aria-expanded={expandButton.expanded} onClick={toggleOverflow}>
                {expandButton.text}
            </button>
        );
    }

    let iconNode: React.ReactNode = null;

    if (icon) {
        const iconSize: Size = realSize === 'small' ? 'small' : 'default';
        iconNode = (
            <span className={`${prefixCls}-icon`} x-semi-prop="icon">
                {isSemiIcon(icon) ? cloneElement(icon as React.ReactElement<any>, { size: iconSize }) : icon}
            </span>
        );
    }

    const cssActive = !view.expanded && cssEllipsis;

    const ellipsisCls = hasEllipsis
        ? clsx({
              [`${prefixCls}-ellipsis`]: true,
              [`${prefixCls}-ellipsis-single-line`]: rows === 1,
              [`${prefixCls}-ellipsis-multiple-line`]: rows > 1,
              [`${prefixCls}-ellipsis-multiple-line-text`]: rows > 1 && component === 'span',
              [`${prefixCls}-ellipsis-overflow-ellipsis`]: rows === 1 && cssActive,
              [`${prefixCls}-ellipsis-overflow-ellipsis-text`]: rows === 1 && cssActive && component === 'span',
          })
        : '';

    const ellipsisStyle = cssActive && rows > 1 ? { WebkitLineClamp: rows } : {};
    const showFull = view.expanded || !view.isTruncated;

    let textNode = hasEllipsis ? (
        <span onMouseEnter={onHover}>
            {showFull ? children : view.ellipsisContent}
            {suffix}
        </span>
    ) : (
        children
    );

    const linkCls = clsx({
        [`${prefixCls}-link-text`]: link,
        [`${prefixCls}-link-underline`]: underline && link,
    });

    textNode = wrapperDecorations(
        { mark, code, underline, strong, link, disabled, delete: isDelete },
        <>
            {iconNode}
            {link ? <span className={linkCls}>{textNode}</span> : textNode}
        </>,
        Boolean((rest as { onClick?: unknown }).onClick)
    );

    const wrapperCls = clsx(className, ellipsisCls, {
        [`${prefixCls}-${type}`]: type && !link,
        [`${prefixCls}-${realSize}`]: realSize,
        [`${prefixCls}-link`]: link,
        [`${prefixCls}-disabled`]: disabled,
        [`${prefixCls}-${spacing}`]: spacing,
        [`${prefixCls}-${headingTag}`]: headingTag,
        [`${prefixCls}-${headingTag}-weight-${weight}`]: headingTag && weight && isNaN(Number(weight)),
    });

    const textStyle: React.CSSProperties = {
        ...(isNaN(Number(weight)) ? {} : { fontWeight: weight }),
        ...style,
    };

    const contentProps = {
        ...rest,
        ref: mergedRef,
        component,
        className: wrapperCls,
        style: { ...textStyle, ...ellipsisStyle },
        tabIndex: tabIndex ?? (focusTarget ? -1 : undefined),
        children: (
            <>
                {textNode}
                {expandNode}
                {copyable && <Copyable {...getCopyConfig(copyable, getCopyText(copyable, children))} ref={copyRef} onCopiedChange={() => hasEllipsis && runtime.schedule()} />}
            </>
        ),
    };

    const content = <TypographyElement {...contentProps} />;

    let node: React.ReactNode = content;

    const tooltip = getTooltipConfig(opt);
    const overflowed = isOverflowed(view, cssEllipsis);

    if (tooltip) {
        const { opts, renderTooltip } = tooltip;
        const focusable = isTooltipTriggerFocusable({ tabIndex, overflowed, condition: opts?.condition, insideWidgetItem });
        if (typeof renderTooltip === 'function') {
            node = overflowed ? renderTooltip(children, content) : content;
        } else if (isPopoverTooltip(tooltip)) {
            node = overflowed ? (
                <Popover content={children} position="top" {...opts}>
                    <TooltipTrigger {...contentProps} focusable={focusable} />
                </Popover>
            ) : (
                content
            );
        } else {
            // switched by `condition` so the root is not remounted when the overflow changes
            // the description goes to the focusable link inside (see DescribedAnchor), unless the caller set their own
            const linkProps = typeof link === 'object' ? link : {};
            const describedByLink = Boolean(link) && !disabled && Boolean(linkProps.href || linkProps.onClick || (rest as { onClick?: unknown }).onClick) && !rest['aria-describedby'];
            node = (
                <Tooltip content={children} position="top" {...opts} condition={overflowed && opts?.condition !== false}>
                    <TooltipTrigger {...contentProps} focusable={focusable} {...(describedByLink && { 'aria-describedby': undefined })} />
                </Tooltip>
            );
        }
    }

    const tree = <SizeContext value={realSize}>{node}</SizeContext>;

    if (!hasEllipsis) {
        return tree;
    }

    return (
        <ReactResizeObserver observeParent observerProperty={ObserverProperty.Width} onResize={() => runtime.handleResize()}>
            {tree}
        </ReactResizeObserver>
    );
}

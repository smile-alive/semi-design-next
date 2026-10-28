import type React from 'react';
import { useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/avatar/constants';
import AvatarFoundation, { type AvatarAdapter } from '@fibrae/semi-foundation/avatar/foundation';
import '@fibrae/semi-foundation/avatar/avatar.scss';
import { usePopupLayer } from '../_base/popup-layer';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import useReplayImageEvents from '../_base/use-replay-image-events';
import { hasContent } from '../_utils';
import { useAvatarGroupContext } from './context';
import type { AvatarProps } from './interface';
import { getAvatarText } from './text';
import TopSlotSvg from './top-slot-svg';

const prefixCls = cssClasses.PREFIX;
const slotSizes = ['extra-small', 'small', 'default', 'medium', 'large', 'extra-large'];

export * from './interface';

export interface AvatarState {
    isImgExist: boolean;
    hovered: boolean;
    scale: number;
}

const defaultProps = {
    size: 'medium',
    color: 'grey',
    shape: 'circle',
    gap: 3,
} satisfies Partial<AvatarProps>;

function Avatar(rawProps: AvatarProps) {
    let own = rawProps;

    const { inGroup, layer, item, moreItem } = useAvatarGroupContext();
    const currentLayer = usePopupLayer();

    const isListItem = inGroup && layer === currentLayer;

    if (moreItem) {
        own = {
            ...rawProps,
            size: rawProps.size ?? moreItem.size,
            shape: rawProps.shape ?? moreItem.shape,
            className: clsx(rawProps.className, moreItem.className),
        };
    } else if (isListItem && item) {
        // A wrapper component around Avatar already received the class through the group's cloneElement and forwards it
        const forwarded = rawProps.className?.split(' ').includes(item.className ?? '');
        own = { ...rawProps, size: item.size, shape: item.shape, className: forwarded ? rawProps.className : clsx(rawProps.className, item.className) };
    }

    const props = useDefaultProps('Avatar', own, defaultProps);
    const { ref, shape, children, size, color, className, hoverMask, onClick, onError, onMouseEnter, onMouseLeave, imgAttr, src, srcSet, style, alt, gap, bottomSlot, topSlot, border, contentMotion, ...rest } = props;

    const contentRef = useRef<HTMLSpanElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const [foundation, state] = useFoundation<AvatarFoundation<AvatarProps, AvatarState, React.MouseEvent>, AvatarAdapter<AvatarProps, AvatarState, React.MouseEvent>, AvatarProps, AvatarState>(
        AvatarFoundation,
        props,
        () => ({ isImgExist: true, hovered: false, scale: 1 }),
        (base) => ({
            setImgExist: (isImgExist) => base.setState({ isImgExist }),
            notifyEnter: (e) => {
                base.setState({ hovered: true });
                base.getProp('onMouseEnter')?.(e);
            },
            // called without an event, as upstream did; its mouse-handler typing is kept
            notifyError: () => (base.getProps().onError as (() => boolean | void) | undefined)?.(),
            notifyLeave: (e) => {
                base.setState({ hovered: false });
                base.getProp('onMouseLeave')?.(e);
            },
            setScale: (scale) => base.setState({ scale }),
            getTextWidths: () => {
                const text = contentRef.current;
                return text ? { container: text.parentElement?.offsetWidth ?? 0, text: text.offsetWidth } : null;
            },
        })
    );

    const clickable = onClick !== undefined;

    // A clickable avatar has its own Tab stop; tabIndex and aria-* injected by Tooltip belong there, not on the root
    // span, which would add a second Tab stop.
    const hasFocusTarget = clickable;
    const rootProps: Record<string, unknown> = {};
    const controlProps: Record<string, unknown> = {};
    const { isImgExist, hovered, scale } = state;
    const hoverContent = hovered ? hoverMask : null;
    const isImg = Boolean(src) && isImgExist;
    const text = isImg ? undefined : getAvatarText(children);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        switch (event.key) {
            case 'Enter':
            case ' ':
                // Space would otherwise scroll; a real click also reaches a Dropdown or Tooltip around the avatar
                event.preventDefault();
                event.currentTarget.click();
                break;
            default:
                break;
        }
    };

    useReplayImageEvents(imgRef);
    useDidUpdate(src, () => foundation.handleSrcChange());

    // mount is measured by foundation.init; the text also appears when the image fails
    useDidUpdate(text, (value) => {
        if (value !== undefined) {
            foundation.changeScale();
        }
    });

    for (const [key, value] of Object.entries(rest)) {
        (hasFocusTarget && (key === 'tabIndex' || key.startsWith('aria-')) ? controlProps : rootProps)[key] = value;
    }

    let content = children;

    const a11yFocusProps = clickable
        ? {
              role: 'button',
              tabIndex: 0,
              ...controlProps,
              onKeyDown: handleKeyDown,
          }
        : {};

    const focusCls = clsx({ [`${prefixCls}-no-focus-visible`]: clickable });

    if (clickable && !isImg && text === undefined) {
        // alt names an image; for other content it is the only name the caller gave, so it becomes the aria-label
        content = (
            <span className={focusCls} aria-label={alt} {...a11yFocusProps}>
                {children}
            </span>
        );
    } else if (isImg) {
        content = (
            <img
                ref={imgRef}
                alt={alt}
                src={src}
                srcSet={srcSet}
                {...imgAttr}
                className={clsx(imgAttr?.className, focusCls)}
                onError={(e) => {
                    imgAttr?.onError?.(e);
                    foundation.handleImgLoadError();
                }}
                {...a11yFocusProps}
            />
        );
    } else if (text !== undefined) {
        const label = alt ?? text;
        content = (
            <span ref={contentRef} className={`${prefixCls}-content`} style={{ transform: `scale(${scale})` }}>
                <span className={clsx(`${prefixCls}-label`, focusCls)} aria-label={label} role="img" {...a11yFocusProps} x-semi-prop="children">
                    {text}
                </span>
            </span>
        );
    }

    const sizeStyle: React.CSSProperties = strings.SIZE.some((preset) => preset === size) ? {} : { width: size, height: size };
    const customStyle: React.CSSProperties = { ...sizeStyle, ...style };
    const shouldWrap = bottomSlot || topSlot || border;

    const mouseEvent = {
        onClick,
        onMouseEnter: (e: React.MouseEvent) => foundation.handleEnter(e),
        onMouseLeave: (e: React.MouseEvent) => foundation.handleLeave(e),
    };

    const avatarCls = clsx(
        prefixCls,
        {
            [`${prefixCls}-${shape}`]: shape,
            [`${prefixCls}-${size}`]: size,
            [`${prefixCls}-${color}`]: color && !isImg,
            [`${prefixCls}-img`]: isImg,
            [`${prefixCls}-animated`]: contentMotion,
        },
        className
    );

    let avatar = (
        <span role={isListItem ? 'listitem' : undefined} {...rootProps} ref={ref} className={avatarCls} style={shouldWrap ? {} : customStyle} {...(shouldWrap ? {} : mouseEvent)}>
            {content}
            {hasContent(hoverContent) && (
                <div className={`${prefixCls}-hover`} x-semi-prop="hoverContent">
                    {hoverContent}
                </div>
            )}
        </span>
    );

    if (border) {
        const borderStyle: React.CSSProperties = typeof border === 'object' ? { borderColor: border.color } : {};
        const borderCls = clsx(`${prefixCls}-additionalBorder`, `${prefixCls}-additionalBorder-${size}`, {
            [`${prefixCls}-${shape}`]: shape,
        });
        avatar = (
            // the caller's style stays on the wrapper; applying it here would double margins and padding
            <div style={{ position: 'relative', ...sizeStyle }}>
                {avatar}
                <span className={borderCls} style={borderStyle} />
                {typeof border === 'object' && border.motion && <span className={clsx(borderCls, `${prefixCls}-additionalBorder-animated`)} style={borderStyle} />}
            </div>
        );
    }

    if (!shouldWrap) {
        return avatar;
    }

    let topSlotNode: React.ReactNode = null;

    const hasSlotSize = slotSizes.includes(size);

    if (topSlot && hasSlotSize && shape === 'circle') {
        topSlotNode = topSlot.render ? (
            topSlot.render()
        ) : (
            <div
                className={clsx(`${prefixCls}-top_slot-wrapper`, topSlot.className, {
                    [`${prefixCls}-animated`]: contentMotion,
                })}
                style={topSlot.style}
            >
                <div className={clsx(`${prefixCls}-top_slot-bg`, `${prefixCls}-top_slot-bg-${size}`)}>
                    <div className={clsx(`${prefixCls}-top_slot-bg-svg`, `${prefixCls}-top_slot-bg-svg-${size}`)}>
                        <TopSlotSvg gradientEnd={topSlot.gradientEnd ?? 'var(--semi-color-primary)'} gradientStart={topSlot.gradientStart ?? 'var(--semi-color-primary)'} />
                    </div>
                </div>
                <div className={`${prefixCls}-top_slot`}>
                    <div className={clsx(`${prefixCls}-top_slot-content`, `${prefixCls}-top_slot-content-${size}`)} style={{ color: topSlot.textColor }}>
                        {topSlot.text}
                    </div>
                </div>
            </div>
        );
    }

    let bottomSlotNode: React.ReactNode = null;

    if (bottomSlot && hasSlotSize) {
        bottomSlotNode = bottomSlot.render ? (
            bottomSlot.render()
        ) : (
            <div className={`${prefixCls}-bottom_slot`} style={bottomSlot.style}>
                <span className={clsx(`${prefixCls}-bottom_slot-shape_${bottomSlot.shape}`, `${prefixCls}-bottom_slot-shape_${bottomSlot.shape}-${size}`, bottomSlot.className)} style={{ backgroundColor: bottomSlot.bgColor, color: bottomSlot.textColor }}>
                    {bottomSlot.text}
                </span>
            </div>
        );
    }

    return (
        <span className={`${prefixCls}-wrapper`} style={customStyle} {...mouseEvent}>
            {avatar}
            {topSlotNode}
            {bottomSlotNode}
        </span>
    );
}

export default Avatar;

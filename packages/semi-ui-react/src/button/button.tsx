import type React from 'react';
import { type ReactNode, cloneElement, isValidElement } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/button/constants';
import { buttonClassList, colorfulFill, isAILoading, paddingSides, resolveButtonLooks } from '@fibrae/semi-foundation/button/utils';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/button/button.scss';
import '@fibrae/semi-foundation/button/icon-button.scss';
import { IconAILoading } from '@fibrae/semi-icons-react';
import { hasContent } from '../_utils';
import SpinIcon from '../spin/icon';

export type HtmlType = 'button' | 'reset' | 'submit';
export type { Size };
export type Theme = 'solid' | 'borderless' | 'light' | 'outline';
export type Type = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';
export type HorizontalPaddingType = 'left' | 'right';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
    id?: string;
    block?: boolean;
    children?: ReactNode;
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    htmlType?: HtmlType;
    /** Removes the horizontal padding of a button that shows an icon or the loading spinner */
    noHorizontalPadding?: boolean | HorizontalPaddingType | HorizontalPaddingType[];
    size?: Size;
    style?: React.CSSProperties;
    theme?: Theme;
    type?: Type;
    prefixCls?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
    onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
    'aria-label'?: React.AriaAttributes['aria-label'];
    contentClassName?: string;
    colorful?: boolean;
    /** Attached to the native button */
    ref?: React.Ref<HTMLButtonElement>;
}

/**
 * The one renderer behind Button and IconButton, which differ only in the global key they read. Rendering a single
 * element type keeps the native button mounted, and focused, while loading or the icon toggles.
 */
export default function Button({
    children,
    block = false,
    htmlType = 'button',
    loading = false,
    className,
    style,
    disabled: rawDisabled,
    size: rawSize,
    theme: rawTheme,
    type: rawType,
    colorful: rawColorful,
    prefixCls = cssClasses.PREFIX,
    icon,
    iconPosition = strings.DEFAULT_ICON_POSITION,
    noHorizontalPadding = false,
    contentClassName,
    ref,
    onClick,
    'x-semi-children-alias': childrenAlias,
    ...attr
}: ButtonProps & { 'x-semi-children-alias'?: string }) {
    let iconElem: React.ReactNode = null;

    const { disabled, size, type, theme, colorful } = resolveButtonLooks({ disabled: rawDisabled, size: rawSize, type: rawType, theme: rawTheme, colorful: rawColorful }, undefined, {});
    const slot = childrenAlias || 'children';
    const showLoading = loading && !disabled;
    const iconLayout = Boolean(icon) || showLoading;
    const hasText = hasContent(children);

    if (showLoading) {
        iconElem = isAILoading(theme, type, colorful) ? <IconAILoading className={`${prefixCls}-content-loading-icon`} /> : <SpinIcon />;
    } else if (isValidElement<{ fill?: string[] }>(icon)) {
        const fill = colorful ? colorfulFill(theme, type, disabled) : undefined;
        iconElem = fill ? cloneElement(icon, { fill }) : icon;
    }

    let content: React.ReactNode = children;

    if (iconLayout) {
        const text = hasText ? (
            <span
                className={clsx({
                    [`${prefixCls}-content-left`]: iconPosition === 'right',
                    [`${prefixCls}-content-right`]: iconPosition === 'left',
                })}
                x-semi-prop={slot}
            >
                {children}
            </span>
        ) : null;
        content =
            iconPosition === 'left' ? (
                <>
                    {iconElem}
                    {text}
                </>
            ) : (
                <>
                    {text}
                    {iconElem}
                </>
            );
    }

    const paddingStyle = iconLayout ? Object.fromEntries(paddingSides(noHorizontalPadding).map((side) => [side === 'left' ? 'paddingLeft' : 'paddingRight', 0])) : undefined;

    return (
        <button
            {...attr}
            ref={ref}
            type={htmlType}
            className={clsx(buttonClassList(prefixCls, { disabled, size, type, theme, colorful }, { block, withIcon: iconLayout, iconOnly: iconLayout && !hasText, loading: showLoading }), className)}
            style={paddingStyle ? { ...style, ...paddingStyle } : style}
            aria-disabled={disabled || loading}
            disabled={disabled}
            // A loading button stays focusable (no native disabled), so the click is dropped here; preventDefault
            // also stops a submit button from submitting its form, and the bubble stops so a keyboard activation
            // does not reach an ancestor handler
            onClick={(e) => {
                if (loading) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                onClick?.(e);
            }}
        >
            {/* React skips a disabled button's own onClick but not its ancestors'; stop the bubble here */}
            <span className={clsx(`${prefixCls}-content`, contentClassName)} x-semi-prop={iconLayout ? undefined : slot} onClick={(e) => disabled && e.stopPropagation()}>
                {content}
            </span>
        </button>
    );
}

import type React from 'react';
import { Children, useState } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/tag/constants';
import { moveFocusToAdjacentTag } from '@fibrae/semi-foundation/tag/focus';
import { handlePrevent } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-foundation/tag/tag.scss';
import { IconClose } from '@fibrae/semi-icons-react';
import useDefaultProps from '../_base/use-default-props';
import Avatar from '../avatar/index';
import useLocale from '../locale/use-locale';
import type { TagProps, TagSize, TagColor, TagType } from './interface';

export * from './interface';

const prefixCls = cssClasses.PREFIX;

export interface TagState {
    visible: boolean;
}

const defaultProps = {
    size: strings.TAG_SIZE[0] as TagSize,
    color: strings.TAG_COLOR[0] as TagColor,
    closable: false,
    type: strings.TAG_TYPE[0] as TagType,
    style: {},
    className: '',
    shape: 'square',
    avatarShape: 'square',
    prefixIcon: null,
    suffixIcon: null,
    colorful: false,
    gradient: false,
} satisfies Partial<TagProps>;

export default function Tag(rawProps: TagProps) {
    const props = useDefaultProps('Tag', rawProps, defaultProps);
    const { ref, tagKey, children, size, color, closable, visible, onClose, onClick, className, type, shape, avatarSrc, avatarShape, tabIndex, prefixIcon, suffixIcon, colorful, gradient, ...attr } = props;

    const { locale } = useLocale('Tag');

    const [visibleState, setVisibleState] = useState(true);

    const isVisible = visible === undefined ? visibleState : visible;

    // a tag with a click handler (own or global default) or a close action is a focusable button; tabIndex lets
    // TagInput take it out of the tab order
    const clickable = onClick !== undefined || closable;

    // toArray drops null, undefined and booleans; `{count} items` and numbers are text like a plain string
    const nodes = Children.toArray(children);
    const text = nodes.length > 0 && nodes.every((node) => typeof node === 'string' || typeof node === 'number') ? nodes.join('') : undefined;

    // only the button role takes a name; a static tag is text and speaks for itself. The replacer is a function so the
    // text's `$&` and `$$` stay literal instead of acting as replacement patterns
    const ariaLabel = props['aria-label'] || (text === undefined ? undefined : (closable ? locale.closableTag : locale.tag).replace('${tag}', () => text));

    const tagCls = clsx(
        prefixCls,
        {
            [`${prefixCls}-default`]: size === 'default',
            [`${prefixCls}-small`]: size === 'small',
            [`${prefixCls}-large`]: size === 'large',
            [`${prefixCls}-square`]: shape === 'square',
            [`${prefixCls}-circle`]: shape === 'circle',
            [`${prefixCls}-${type}`]: type,
            [`${prefixCls}-${color}-${type}`]: color && type,
            [`${prefixCls}-closable`]: closable,
            [`${prefixCls}-invisible`]: !isVisible,
            [`${prefixCls}-avatar-${avatarShape}`]: avatarSrc,
            [`${prefixCls}-colorful`]: colorful,
            [`${prefixCls}-gradient`]: gradient,
        },
        className
    );

    const close = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        onClose?.(children, e, tagKey);
        if (e.defaultPrevented) {
            return;
        }
        moveFocusToAdjacentTag(e.currentTarget);
        if (visible === undefined) {
            setVisibleState(false);
        }
    };

    const content = (
        <>
            {Boolean(prefixIcon) && <div className={`${prefixCls}-prefix-icon`}>{prefixIcon}</div>}
            {Boolean(avatarSrc) && <Avatar alt="" shape={avatarShape} src={avatarSrc} />}
            <div className={clsx(`${prefixCls}-content`, `${prefixCls}-content-${text === undefined ? 'center' : 'ellipsis'}`)}>{children}</div>
            {Boolean(suffixIcon) && <div className={`${prefixCls}-suffix-icon`}>{suffixIcon}</div>}
            {closable && (
                // a pointer shortcut only: keyboard users close with Backspace / Delete and the label says Closable
                <div className={`${prefixCls}-close`} aria-hidden onClick={close}>
                    <IconClose size="small" />
                </div>
            )}
        </>
    );

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
            case 'Backspace':
            case 'Delete':
                if (closable) {
                    close(event);
                }
                handlePrevent(event);
                break;
            case 'Enter':
            case ' ':
                // Space would otherwise scroll; the real click also reaches a Dropdown or Tooltip around the tag once
                event.preventDefault();
                event.currentTarget.click();
                break;
            default:
                break;
        }
        props.onKeyDown?.(event);
    };

    // the user's own aria-label and element props in attr win over the generated label
    if (clickable) {
        return (
            <div ref={ref} aria-label={ariaLabel} {...attr} className={tagCls} role="button" tabIndex={tabIndex || 0} onClick={onClick} onKeyDown={handleKeyDown}>
                {content}
            </div>
        );
    }

    return (
        <div ref={ref} {...attr} className={tagCls} tabIndex={tabIndex}>
            {content}
        </div>
    );
}

import { batch, children, createMemo, createSignal, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/tag/constants';
import { moveFocusToAdjacentTag } from '@fibrae/semi-foundation/tag/focus';
import { handlePrevent } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-foundation/tag/tag.scss';
import { IconClose } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import hasContent from '../_base/has-content';
import useDefaultProps from '../_base/use-default-props';
import Avatar from '../avatar';
import useLocale from '../locale/use-locale';
import type { TagCloseEvent, TagColor, TagProps, TagSize, TagType } from './interface';

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    size: strings.TAG_SIZE[0] as TagSize,
    color: strings.TAG_COLOR[0] as TagColor,
    closable: false,
    type: strings.TAG_TYPE[0] as TagType,
    shape: 'square',
    avatarShape: 'square',
    colorful: false,
    gradient: false,
} satisfies Partial<TagProps>;

export default function Tag(rawProps: TagProps) {
    const props = useDefaultProps('Tag', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['tagKey', 'children', 'size', 'color', 'closable', 'visible', 'onClose', 'onClick', 'onKeyDown', 'class', 'type', 'shape', 'avatarSrc', 'avatarShape', 'tabIndex', 'prefixIcon', 'suffixIcon', 'colorful', 'gradient']);

    const locale = useLocale('Tag');

    const [visibleState, setVisibleState] = createSignal(true);

    const resolved = children(() => local.children);
    const prefixIcon = children(() => local.prefixIcon);
    const suffixIcon = children(() => local.suffixIcon);

    // null, undefined and booleans render nothing; `{count} items` and numbers are text like a plain string
    const text = createMemo(() => {
        const nodes = resolved.toArray().filter((node) => node != null && typeof node !== 'boolean');
        return nodes.length > 0 && nodes.every((node) => typeof node === 'string' || typeof node === 'number') ? nodes.join('') : undefined;
    });

    const isVisible = () => (local.visible === undefined ? visibleState() : local.visible);

    // a tag with a click handler (own or global default) or a close action is a focusable button; tabIndex lets
    // TagInput take it out of the tab order
    const clickable = () => local.onClick !== undefined || local.closable;

    // only the button role takes a name; a static tag is text and speaks for itself. The replacer is a function so the
    // text's `$&` and `$$` stay literal instead of acting as replacement patterns
    const ariaLabel = () => {
        const label = text();
        return props['aria-label'] || (label === undefined ? undefined : (local.closable ? locale().locale.closableTag : locale().locale.tag).replace('${tag}', () => label));
    };

    // batched so that a handler which removes this tag does not detach it before the focus has moved to a neighbour
    const close = (event: TagCloseEvent) => {
        batch(() => {
            event.stopPropagation();
            event.stopImmediatePropagation();
            local.onClose?.(resolved(), event, local.tagKey);
            if (event.defaultPrevented) {
                return;
            }
            moveFocusToAdjacentTag(event.currentTarget);
            if (local.visible === undefined) {
                setVisibleState(false);
            }
        });
    };

    const handleKeyDown = (event: KeyboardEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        if (clickable()) {
            switch (event.key) {
                case 'Backspace':
                case 'Delete':
                    if (local.closable) {
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
        }
        callHandler(local.onKeyDown, event);
    };

    // an explicit attribute that is undefined falls back to rest, so a static tag keeps the user's role and aria-label
    return (
        <div
            {...rest}
            aria-label={clickable() ? ariaLabel() : undefined}
            class={clsx(
                prefixCls,
                {
                    [`${prefixCls}-default`]: local.size === 'default',
                    [`${prefixCls}-small`]: local.size === 'small',
                    [`${prefixCls}-large`]: local.size === 'large',
                    [`${prefixCls}-square`]: local.shape === 'square',
                    [`${prefixCls}-circle`]: local.shape === 'circle',
                    [`${prefixCls}-${local.type}`]: local.type,
                    [`${prefixCls}-${local.color}-${local.type}`]: local.color && local.type,
                    [`${prefixCls}-closable`]: local.closable,
                    [`${prefixCls}-invisible`]: !isVisible(),
                    [`${prefixCls}-avatar-${local.avatarShape}`]: local.avatarSrc,
                    [`${prefixCls}-colorful`]: local.colorful,
                    [`${prefixCls}-gradient`]: local.gradient,
                },
                local.class
            )}
            role={clickable() ? 'button' : undefined}
            tabIndex={clickable() ? local.tabIndex || 0 : local.tabIndex}
            onClick={(event) => callHandler(local.onClick, event)}
            onKeyDown={handleKeyDown}
        >
            <Show when={hasContent(prefixIcon())}>
                <div class={`${prefixCls}-prefix-icon`}>{prefixIcon()}</div>
            </Show>
            <Show when={local.avatarSrc}>
                <Avatar alt="" shape={local.avatarShape} src={local.avatarSrc} />
            </Show>
            <div class={clsx(`${prefixCls}-content`, `${prefixCls}-content-${text() === undefined ? 'center' : 'ellipsis'}`)}>{resolved()}</div>
            <Show when={hasContent(suffixIcon())}>
                <div class={`${prefixCls}-suffix-icon`}>{suffixIcon()}</div>
            </Show>
            <Show when={local.closable}>
                {/* a pointer shortcut only: keyboard users close with Backspace / Delete and the label says Closable. A native listener so stopPropagation also keeps the click from the tag's own and its trigger's handlers */}
                <div class={`${prefixCls}-close`} aria-hidden="true" on:click={close}>
                    <IconClose size="small" />
                </div>
            </Show>
        </div>
    );
}

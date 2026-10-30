import { children, createEffect, createMemo, createSignal, Match, on, onCleanup, Show, splitProps, Switch, untrack, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/avatar/constants';
import AvatarFoundation, { type AvatarAdapter } from '@fibrae/semi-foundation/avatar/foundation';
import '@fibrae/semi-foundation/avatar/avatar.scss';
import callHandler from '../_base/call-handler';
import { splitControlAttrs } from '../_base/control-attrs';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import mergeStyles from '../_base/merge-styles';
import { usePopupLayer } from '../_base/popup-layer';
import { createToken } from '../_base/token';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import { AvatarGroupContext, type AvatarGroupHiddenItem, hiddenAvatar, useAvatarGroupContext } from './context';
import type { AvatarProps, AvatarSlotText } from './interface';
import { getAvatarText } from './text';
import TopSlotSvg from './top-slot-svg';

const prefixCls = cssClasses.PREFIX;
const slotSizes = ['extra-small', 'small', 'default', 'medium', 'large', 'extra-large'];

export interface AvatarState {
    isImgExist: boolean;
    hovered: boolean;
    scale: number;
}

type AvatarMouseEvent = MouseEvent & { currentTarget: HTMLElement; target: Element };
type Foundation = AvatarFoundation<AvatarProps, AvatarState, AvatarMouseEvent>;
type Adapter = AvatarAdapter<AvatarProps, AvatarState, AvatarMouseEvent>;

const defaultProps = {
    size: 'medium',
    color: 'grey',
    shape: 'circle',
    gap: 3,
} satisfies Partial<AvatarProps>;

// A preset size is a class; any other size is a pixel length that the inline style carries
const sizeStyle = (size: string): JSX.CSSProperties => (strings.SIZE.some((preset) => preset === size) ? {} : { width: size, height: size });

const slotText = (text: AvatarSlotText) => (typeof text === 'function' ? text() : text);

// The avatar itself; `Avatar` decides first whether a group hides it, before any of this creates JSX
function AvatarView(rawProps: AvatarProps) {
    const props = useDefaultProps('Avatar', rawProps, defaultProps);
    const [local, attrs] = splitProps(props, ['children', 'color', 'shape', 'size', 'hoverMask', 'src', 'srcSet', 'alt', 'gap', 'onError', 'onClick', 'onMouseEnter', 'onMouseLeave', 'imgAttr', 'bottomSlot', 'topSlot', 'border', 'contentMotion', 'class', 'style', 'ref']);

    // A clickable avatar has its own focus target, so what Tooltip injects (tabindex, aria-*) belongs there; on the
    // root it would add a second Tab stop
    const [control, rest] = splitControlAttrs(attrs, (key): key is `aria-${string}` | 'tabIndex' | 'tabindex' => key.startsWith('aria-') || key === 'tabIndex' || key === 'tabindex');

    const group = useAvatarGroupContext();
    const currentLayer = usePopupLayer();

    const [root, setRoot] = createSignal<HTMLElement>();
    const [focusWrapper, setFocusWrapper] = createSignal<HTMLSpanElement>();
    let contentElement: HTMLSpanElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, AvatarProps, AvatarState>(
        AvatarFoundation,
        props,
        () => ({ isImgExist: true, hovered: false, scale: 1 }),
        (base) => ({
            setImgExist: (isImgExist) => base.setState({ isImgExist }),
            notifyEnter: (event) => {
                base.setState({ hovered: true });
                callHandler(base.getProps().onMouseEnter, event);
            },
            notifyError: () => base.getProps().onError?.(),
            notifyLeave: (event) => {
                base.setState({ hovered: false });
                callHandler(base.getProps().onMouseLeave, event);
            },
            setScale: (scale) => base.setState({ scale }),
            getTextWidths: () => (contentElement ? { container: contentElement.parentElement?.offsetWidth ?? 0, text: contentElement.offsetWidth } : null),
        })
    );

    const inLayer = group.inGroup && group.layer === currentLayer;
    const resolved = children(() => local.children);

    // Each read of a slot builds its object again, and a new `render` would make the keyed Show below render the badge
    // again; one read per change keeps it
    const topSlot = createMemo(() => local.topSlot);
    const bottomSlot = createMemo(() => local.bottomSlot);

    const clickable = () => local.onClick !== undefined;

    // Position in the group's list; undefined until the group has resolved its children, -1 when a text child ahead of
    // this avatar pushed its node past maxCount, into renderMore
    const index = () => {
        const order = group.item?.order();
        const element = root();
        return order && element ? order.findIndex((node) => node instanceof Node && node.contains(element)) : undefined;
    };

    const item = () => (inLayer && index() !== -1 ? group.item : undefined);

    const isListItem = () => inLayer && (group.item === undefined || index() !== -1);

    const size = () => {
        const entry = item();
        return (entry ? entry.size() : (rawProps.size ?? group.moreItem?.().size)) ?? props.size;
    };

    const shape = () => {
        const entry = item();
        return (entry ? entry.shape() : (rawProps.shape ?? group.moreItem?.().shape)) ?? props.shape;
    };

    const overlapClass = () => {
        const position = index();
        return position !== undefined && position >= 0 ? item()?.overlapClass(position) : undefined;
    };

    const isImg = () => Boolean(local.src) && state().isImgExist;

    const text = () => (isImg() ? undefined : getAvatarText(resolved()));

    const shouldWrap = () => Boolean(bottomSlot() || topSlot() || local.border);

    const hasSlotSize = () => slotSizes.includes(size());

    const focusClass = () => clsx({ [`${prefixCls}-no-focus-visible`]: clickable() });

    const customStyle = () => mergeStyles(sizeStyle(size()), local.style);

    const handleKeyDown = (event: KeyboardEvent & { currentTarget: HTMLElement }) => {
        if (event.key === 'Enter' || event.key === ' ') {
            // Space would otherwise scroll; a real click also reaches a Dropdown or Tooltip around the avatar
            event.preventDefault();
            event.currentTarget.click();
        }
    };

    const focusProps = () => (clickable() ? { role: 'button', tabIndex: 0, ...control, onKeyDown: handleKeyDown } : {});

    const mouseProps = () => ({
        onClick: local.onClick,
        onMouseEnter: (event: AvatarMouseEvent) => foundation.handleEnter(event),
        onMouseLeave: (event: AvatarMouseEvent) => foundation.handleLeave(event),
    });

    const trackFocusWrapper = (element: HTMLSpanElement) => {
        setFocusWrapper(element);
        onCleanup(() => setFocusWrapper(undefined));
    };

    const content = () => (
        <Switch fallback={resolved()}>
            <Match when={clickable() && !isImg() && text() === undefined}>
                {/* alt names an image; for other content it is the only name the caller gave, so it becomes the aria-label */}
                <span ref={trackFocusWrapper} class={focusClass()} aria-label={local.alt} {...focusProps()} />
            </Match>
            <Match when={isImg()}>
                <img
                    alt={local.alt}
                    src={local.src}
                    srcset={local.srcSet}
                    {...local.imgAttr}
                    class={clsx(local.imgAttr?.class, focusClass())}
                    onError={(event) => {
                        callHandler(local.imgAttr?.onError, event);
                        foundation.handleImgLoadError();
                    }}
                    {...focusProps()}
                />
            </Match>
            <Match when={text() !== undefined}>
                <span
                    ref={(node) => {
                        contentElement = node;
                        onCleanup(() => (contentElement = undefined));
                    }}
                    class={`${prefixCls}-content`}
                    style={{ transform: `scale(${state().scale})` }}
                >
                    <span class={clsx(`${prefixCls}-label`, focusClass())} aria-label={local.alt ?? text()} role="img" {...focusProps()} x-semi-prop="children">
                        {text()}
                    </span>
                </span>
            </Match>
        </Switch>
    );

    const avatar = () => (
        <span
            role={isListItem() ? 'listitem' : undefined}
            {...rest}
            {...(clickable() ? {} : control)}
            // avatar() runs inside Show and insert memos that would track the ref read; a spread props signal would recreate the avatar
            ref={untrack(() => mergeRefs(local.ref, setRoot))}
            class={clsx(
                prefixCls,
                {
                    [`${prefixCls}-${shape()}`]: shape(),
                    [`${prefixCls}-${size()}`]: size(),
                    [`${prefixCls}-${local.color}`]: local.color && !isImg(),
                    [`${prefixCls}-img`]: isImg(),
                    [`${prefixCls}-animated`]: local.contentMotion,
                },
                local.class,
                group.moreItem?.().class,
                overlapClass()
            )}
            style={shouldWrap() ? undefined : customStyle()}
            {...(shouldWrap() ? {} : mouseProps())}
        >
            {content()}
            {/* the mask is created on hover only: the server never hovers, so a mask created at mount has no markup to hydrate */}
            <Show when={state().hovered}>
                {(_hovered) => {
                    const hoverMask = children(() => local.hoverMask);
                    return (
                        <Show when={hasContent(hoverMask())}>
                            <div class={`${prefixCls}-hover`} x-semi-prop="hoverContent">
                                {hoverMask()}
                            </div>
                        </Show>
                    );
                }}
            </Show>
        </span>
    );

    const bordered = () => (
        <Show when={local.border} fallback={avatar()}>
            {(border) => {
                const borderClass = () => clsx(`${prefixCls}-additionalBorder`, `${prefixCls}-additionalBorder-${size()}`, { [`${prefixCls}-${shape()}`]: shape() });
                const borderStyle = (): JSX.CSSProperties => {
                    const value = border();
                    return typeof value === 'object' ? { 'border-color': value.color } : {};
                };
                return (
                    // the caller's style stays on the wrapper; applying it here would double margins and padding
                    <div style={{ position: 'relative', ...sizeStyle(size()) }}>
                        {avatar()}
                        <span class={borderClass()} style={borderStyle()} />
                        <Show when={typeof border() === 'object' && (border() as { motion?: boolean }).motion}>
                            <span class={clsx(borderClass(), `${prefixCls}-additionalBorder-animated`)} style={borderStyle()} />
                        </Show>
                    </div>
                );
            }}
        </Show>
    );

    useWatch(() => local.src, foundation.handleSrcChange);

    // Watches the text, which also appears when the image fails. A parent's onMount write queues the text insert
    // behind this watch and behind foundation.init's measurement; an effect created here runs after the insert
    useWatch(text, (value) => {
        if (value !== undefined) {
            createEffect(() => untrack(foundation.changeScale));
        }
    });

    // Element children move into the focus wrapper only after the avatar has reconciled its own children: inserting
    // them in the wrapper's JSX lets that reconcile remove them again, since they are still in its old list
    createEffect(on([focusWrapper, resolved.toArray], ([wrapper, nodes]) => wrapper?.replaceChildren(...nodes.flatMap((node): (Node | string)[] => (node instanceof Node ? [node] : typeof node === 'string' || typeof node === 'number' ? [String(node)] : [])))));

    return (
        <Show when={shouldWrap()} fallback={avatar()}>
            <span class={`${prefixCls}-wrapper`} style={customStyle()} {...mouseProps()}>
                {bordered()}
                <Show when={topSlot() && hasSlotSize() && shape() === 'circle' ? topSlot() : undefined}>
                    {(slot) => (
                        <Show
                            keyed
                            when={slot().render}
                            fallback={
                                <div class={clsx(`${prefixCls}-top_slot-wrapper`, slot().class, { [`${prefixCls}-animated`]: local.contentMotion })} style={slot().style}>
                                    <div class={clsx(`${prefixCls}-top_slot-bg`, `${prefixCls}-top_slot-bg-${size()}`)}>
                                        <div class={clsx(`${prefixCls}-top_slot-bg-svg`, `${prefixCls}-top_slot-bg-svg-${size()}`)}>
                                            <TopSlotSvg gradientEnd={slot().gradientEnd ?? 'var(--semi-color-primary)'} gradientStart={slot().gradientStart ?? 'var(--semi-color-primary)'} />
                                        </div>
                                    </div>
                                    <div class={`${prefixCls}-top_slot`}>
                                        <div class={clsx(`${prefixCls}-top_slot-content`, `${prefixCls}-top_slot-content-${size()}`)} style={{ color: slot().textColor }}>
                                            {slotText(slot().text)}
                                        </div>
                                    </div>
                                </div>
                            }
                        >
                            {(render) => render()}
                        </Show>
                    )}
                </Show>
                <Show when={bottomSlot() && hasSlotSize() ? bottomSlot() : undefined}>
                    {(slot) => (
                        <Show
                            keyed
                            when={slot().render}
                            fallback={
                                <div class={`${prefixCls}-bottom_slot`} style={slot().style}>
                                    <span class={clsx(`${prefixCls}-bottom_slot-shape_${slot().shape}`, `${prefixCls}-bottom_slot-shape_${slot().shape}-${size()}`, slot().class)} style={{ 'background-color': slot().bgColor, color: slot().textColor }}>
                                        {slotText(slot().text)}
                                    </span>
                                </div>
                            }
                        >
                            {(render) => render()}
                        </Show>
                    )}
                </Show>
            </span>
        </Show>
    );
}

export default function Avatar(rawProps: AvatarProps) {
    const group = useAvatarGroupContext();
    const currentLayer = usePopupLayer();

    // An avatar past maxCount creates nothing in the group: the branch that shows it calls `render`, which creates it
    // there as a standalone avatar
    const token = createToken<AvatarGroupHiddenItem>(hiddenAvatar, {
        name: () => rawProps.alt ?? '',
        render: (overrides) => (
            <AvatarGroupContext.Provider value={{}}>
                <Avatar {...rawProps} {...overrides} />
            </AvatarGroupContext.Provider>
        ),
    });

    // The group finds the avatar among its children by the node it returns
    const hidden = group.inGroup && group.layer === currentLayer ? group.item?.register(() => output()) : undefined;

    const output = children(() => (
        <Show when={!hidden?.()} fallback={token}>
            <AvatarView {...rawProps} />
        </Show>
    ));

    return <>{output()}</>;
}

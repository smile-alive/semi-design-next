import { type Accessor, children, createEffect, createMemo, createSignal, type JSX, onCleanup, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/avatar/constants';
import '@fibrae/semi-foundation/avatar/avatar.scss';
import { usePopupLayer } from '../_base/popup-layer';
import { isToken } from '../_base/token';
import useDefaultProps from '../_base/use-default-props';
import useLocale from '../locale/use-locale';
import Avatar from './avatar';
import { AvatarGroupContext, type AvatarGroupHiddenItem, type AvatarGroupItem, hiddenAvatar, useAvatarGroupContext } from './context';
import type { AvatarGroupProps } from './interface';

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    size: 'medium',
    shape: 'circle',
    overlapFrom: 'start',
} satisfies Partial<AvatarGroupProps>;

interface GroupItemsProps {
    children: JSX.Element;
    maxCount?: number;
    renderMore: AvatarGroupProps['renderMore'];
    item: AvatarGroupItem;
    setOrder: (order: readonly unknown[]) => void;
    locate: (nodes: readonly unknown[]) => void;
    size: Accessor<string>;
    shape: AvatarGroupItem['shape'];
}

// Rendered inside the provider: Solid context follows the owner a child is created under, so the avatars must be
// created here rather than in the group's own body
function GroupItems(props: GroupItemsProps) {
    const outer = useAvatarGroupContext();
    const locale = useLocale('Avatar');

    const resolved = children(() => props.children);

    // Hidden avatars come as tokens; other nodes past maxCount (text) are hidden too and handed over as they are
    const split = createMemo(() => {
        const nodes = resolved.toArray().filter((node) => node != null && typeof node !== 'boolean' && node !== '');
        const shown = nodes.filter((node) => !isToken(node, hiddenAvatar));
        const tokens = nodes.flatMap((node) => (isToken<AvatarGroupHiddenItem>(node, hiddenAvatar) ? [node.props] : []));
        const max = props.maxCount ?? Infinity;
        const passed = shown.slice(max).map((node): AvatarGroupHiddenItem => ({ name: () => '', render: () => node }));
        return { nodes, visible: shown.slice(0, max), rest: [...passed, ...tokens] };
    });

    const [hidden, setHidden] = createSignal(split().rest);

    // Names the avatars hidden by maxCount, which renderMore may show elsewhere
    const moreLabel = () => {
        const label = locale().locale.more.replace('${count}', String(hidden().length));
        const names = hidden()
            .map((entry) => entry.name())
            .filter((name) => name.length > 0)
            .join(',');
        return names.length > 0 ? `${label}: ${names}` : label;
    };

    const moreItem = () => ({ size: props.size(), shape: props.shape(), class: props.item.overlapClass(split().visible.length) });

    const more = () => {
        const rest = hidden();
        return props.renderMore ? (
            props.renderMore(
                rest.length,
                rest.map((entry) => entry.render)
            )
        ) : (
            <Avatar class={`${prefixCls}-item-more`} alt={moreLabel()}>
                {`+${rest.length}`}
            </Avatar>
        );
    };

    // Avatars are created while the children resolve, before these lists exist, so they look their position up in them.
    // renderMore gets the newly hidden nodes only after the list has reconciled: that reconcile removes each node it no
    // longer holds wherever the node sits, so one moved into renderMore's output earlier would disappear.
    createEffect(() => {
        const { nodes, visible, rest } = split();
        props.locate(nodes);
        props.setOrder(visible);
        setHidden(rest);
    });

    return (
        <>
            {split().visible}
            <Show when={hidden().length > 0}>
                <AvatarGroupContext.Provider value={{ inGroup: true, layer: outer.layer, moreItem }}>{more()}</AvatarGroupContext.Provider>
            </Show>
        </>
    );
}

export default function AvatarGroup(rawProps: AvatarGroupProps) {
    const props = useDefaultProps('AvatarGroup', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['children', 'maxCount', 'overlapFrom', 'size', 'shape', 'renderMore', 'class']);

    const layer = usePopupLayer();

    const [order, setOrder] = createSignal<readonly unknown[]>();

    // Each registered avatar -> its position among the resolved children (-1 if not there); undefined until they resolved
    const [slots, setSlots] = createSignal<Map<Accessor<unknown>, number>>();

    // Not a signal: only avatars among the resolved children rank, and adding or removing one changes them
    const entries: Accessor<unknown>[] = [];

    const size = () => local.size;

    const shape = () => local.shape;

    const groupItem: AvatarGroupItem = {
        size,
        shape,
        register: (node) => {
            const created = entries.length;
            entries.push(node);
            onCleanup(() => entries.splice(entries.indexOf(node), 1));
            return () => {
                const located = slots();
                return (located ? (located.get(node) ?? -1) : created) >= (local.maxCount ?? Infinity);
            };
        },
        overlapClass: (index) =>
            clsx({
                [`${prefixCls}-item-start-${index}`]: local.overlapFrom === 'start',
                [`${prefixCls}-item-end-${index}`]: local.overlapFrom === 'end',
            }),
        order,
    };

    // Runs after the children resolved, in an effect: reading the avatars' nodes while they render would make each
    // avatar depend on itself
    const locate = (nodes: readonly unknown[]) => {
        const at = new Map(nodes.map((node, index) => [node, index]));
        setSlots(new Map(entries.map((node) => [node, at.get(node()) ?? -1])));
    };

    return (
        <div role="list" {...rest} class={clsx(`${prefixCls}-group`, local.class)}>
            <AvatarGroupContext.Provider value={{ inGroup: true, layer, item: groupItem }}>
                <GroupItems item={groupItem} maxCount={local.maxCount} renderMore={local.renderMore} locate={locate} setOrder={setOrder} shape={shape} size={size}>
                    {local.children}
                </GroupItems>
            </AvatarGroupContext.Provider>
        </div>
    );
}

import { createMemo, For, mergeProps, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/tag/constants';
import { getTagListKeys } from '@fibrae/semi-foundation/tag/tag-key';
import useDefaultProps from '../_base/use-default-props';
import Popover from '../popover';
import type { TagCloseEvent, TagGroupItem, TagGroupProps, TagSize } from './interface';
import Tag from './tag';

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    size: strings.TAG_SIZE[0] as TagSize,
    avatarShape: 'square',
} satisfies Partial<TagGroupProps>;

interface Entry {
    tag: TagGroupItem;
    index: number;
}

export default function TagGroup(rawProps: TagGroupProps) {
    const props = useDefaultProps('TagGroup', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['class', 'maxTagCount', 'restCount', 'size', 'avatarShape', 'showPopover', 'popoverProps', 'onTagClose', 'onPlusNMouseEnter', 'renderTag', 'tagList']);

    // Rows are keyed so that a tag's own hidden state follows its key, not its position
    const keys = createMemo(() => getTagListKeys(local.tagList));
    const entries = createMemo(() => new Map<string | number, Entry>(local.tagList.map((tag, index) => [keys()[index], { tag, index }])));

    const restTotal = () => local.restCount || local.tagList.length - (local.maxTagCount as number);

    const limited = () => local.maxTagCount !== undefined && restTotal() > 0;

    const renderItem = (key: string | number) => {
        // the last entry stays readable while the row is being disposed after its key left the list
        const entry = createMemo((previous?: Entry) => entries().get(key) ?? (previous as Entry));
        const tagProps = mergeProps(() => entry().tag, {
            get size() {
                return entry().tag.size || local.size;
            },
            get avatarShape() {
                return entry().tag.avatarShape || local.avatarShape;
            },
            get tagKey() {
                const { tagKey, children } = entry().tag;
                // the index keeps keys stable across renders, so tags are not remounted
                return tagKey || (children ?? entry().index);
            },
            onClose(tagChildren: JSX.Element, event: TagCloseEvent, tagKey?: string | number) {
                entry().tag.onClose?.(tagChildren, event, tagKey);
                local.onTagClose?.(tagChildren, event, tagKey);
            },
        });
        // Show runs its child untracked; the fragment is what calls renderTag again when the item or its index changes
        return (
            <Show keyed when={local.renderTag} fallback={<Tag {...tagProps} />}>
                {(render) => <>{render(entry().tag, entry().index)}</>}
            </Show>
        );
    };

    // the items past maxTagCount are created only by the popover content, which is read once the popover opens
    const Items = (itemProps: { from: number; to?: number }) => <For each={keys().slice(itemProps.from, itemProps.to)}>{(key) => renderItem(key)}</For>;

    const plusN = (triggerProps?: object) => (
        <Tag {...triggerProps} style={{ 'background-color': 'transparent' }} closable={false} color="grey" size={local.size} onMouseEnter={() => local.onPlusNMouseEnter?.()}>
            +{restTotal()}
        </Tag>
    );

    return (
        <div
            {...rest}
            class={clsx(
                {
                    [`${prefixCls}-group`]: true,
                    [`${prefixCls}-group-max`]: local.maxTagCount,
                    [`${prefixCls}-group-small`]: local.size === 'small',
                    [`${prefixCls}-group-large`]: local.size === 'large',
                },
                local.class
            )}
        >
            <Items from={0} to={limited() ? local.maxTagCount : undefined} />
            <Show when={limited()}>
                <Show when={local.showPopover} fallback={plusN()}>
                    <Popover class={`${prefixCls}-rest-group-popover`} autoAdjustOverflow content={<Items from={local.maxTagCount as number} />} position="top" showArrow trigger="hover" {...local.popoverProps}>
                        {(getTriggerProps) => plusN(getTriggerProps())}
                    </Popover>
                </Show>
            </Show>
        </div>
    );
}

import { type Ref, For, Show, createMemo, createUniqueId, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/scroll-list/constants';
import ItemFoundation, { type Item, type ScrollItemAdapter, type ScrollItemBaseState, type ScrollItemRow, wheelMode } from '@fibrae/semi-foundation/components/scroll-list/item-foundation';
import '@fibrae/semi-foundation/components/scroll-list/scroll-list.scss';
import type { ElementProps } from '../../base/element-props';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import mergeRefs from '../../utils/merge-refs';

const prefix = cssClasses.PREFIX;

export interface ScrollItemProps<T extends Item = Item> extends ElementProps<'div', 'onSelect' | 'children' | 'ref'> {
    mode?: string;
    cycled?: boolean;
    list?: T[];
    selectedIndex?: number;
    onSelect?: (data: T & { type?: string | number; index: number }) => void;
    transform?: (value: any, text?: string) => string;
    motion?: boolean;
    /** Identifies the item to the Semi components that use it; not for end users */
    type?: string | number;
    ref?: Ref<ScrollItemElement>;
}

export interface ScrollItemHandle {
    /** Scrolls to the selected item; `selectedIndex` is not used, the target is the item last selected */
    scrollToIndex: (selectedIndex?: number, duration?: number) => void;
}

export type ScrollItemElement = HTMLDivElement & ScrollItemHandle;

type Foundation<T extends Item> = ItemFoundation<T, ScrollItemProps<T>>;
type Adapter<T extends Item> = ScrollItemAdapter<T, ScrollItemProps<T>>;

const defaultProps = {
    selectedIndex: 0,
    motion: true,
    list: [],
    cycled: false,
    mode: wheelMode,
} satisfies Partial<ScrollItemProps<Item>>;

export default function ScrollItem<T extends Item = Item>(rawProps: ScrollItemProps<T>) {
    const props = useDefaultProps('ScrollItem', rawProps, defaultProps) as ScrollItemProps<T> & Required<Pick<ScrollItemProps<T>, keyof typeof defaultProps>>;
    const [local, rest] = splitProps(props, ['mode', 'cycled', 'list', 'selectedIndex', 'onSelect', 'transform', 'class', 'motion', 'type', 'ref', 'aria-label', 'aria-labelledby', 'aria-describedby']);

    let root!: HTMLDivElement;
    let listbox!: HTMLUListElement;
    const listId = createUniqueId();
    let outer!: HTMLDivElement;
    let selector!: HTMLDivElement;

    // <For> keeps a node while its row object is the same one, so rows are reused by key: the foundation caches the
    // selected node and scrolls to it after the copies render around it.
    let rowsByKey = new Map<string, ScrollItemRow>();

    const isWheel = () => local.mode === wheelMode;

    const { foundation, state } = useFoundation<Foundation<T>, Adapter<T>, ScrollItemProps<T>, ScrollItemBaseState>(
        ItemFoundation,
        props,
        () => ItemFoundation.getInitialState(),
        (base) => ({
            getListNode: () => listbox,
            getScrollNode: () => (isWheel() ? outer : root),
            getSelectorNode: () => selector,
            notifySelectItem: (data) => base.getProps().onSelect?.(data),
        })
    );

    const rows = createMemo(() => {
        const next = ItemFoundation.getRows({ list: local.list, mode: local.mode }, state()).map((row) => {
            const kept = rowsByKey.get(row.key);
            return kept?.index === row.index && kept.copy === row.copy ? kept : row;
        });
        rowsByKey = new Map(next.map((row) => [row.key, row]));
        return next;
    });

    const handle: ScrollItemHandle = { scrollToIndex: (_index, duration) => foundation.scrollToSelected(duration) };

    // Only the real list carries ids: cycled copies would make the active descendant ambiguous
    const optionId = (index: number) => `${listId}-option-${index}`;

    const renderOption = ({ copy, index }: ScrollItemRow) => {
        const item = () => local.list[index];
        const selected = () => local.selectedIndex === index;
        const text = () => ItemFoundation.getItemText(item(), selected(), local.transform);
        return (
            <li
                id={copy ? undefined : optionId(index)}
                // classList, not class: the foundation adds the highlight class itself, which a rewritten class would drop
                classList={{
                    [`${prefix}-item-sel`]: selected() && !isWheel(),
                    [`${prefix}-item-disabled`]: Boolean(item().disabled),
                }}
                aria-disabled={item().disabled}
                aria-hidden={copy ? true : undefined}
                aria-selected={selected()}
                role="option"
                // Solid binds a handler once, so `disabled` is read at click time
                onClick={() => {
                    if (!isWheel() && !item().disabled) {
                        foundation.selectIndex(index);
                    }
                }}
            >
                {text()}
            </li>
        );
    };

    const renderListbox = () => (
        <ul
            ref={(node) => (listbox = node)}
            aria-activedescendant={local.list[local.selectedIndex] ? optionId(local.selectedIndex) : undefined}
            aria-describedby={local['aria-describedby']}
            aria-label={local['aria-label']}
            aria-labelledby={local['aria-labelledby']}
            aria-multiselectable={false}
            role="listbox"
            tabIndex={0}
            onClick={(event) => {
                if (isWheel()) {
                    foundation.handleWheelClick(event);
                }
            }}
            onKeyDown={foundation.handleKeyDown}
        >
            <For each={rows()}>{renderOption}</For>
        </ul>
    );

    return (
        <div {...rest} ref={(node) => mergeRefs(local.ref)((root = Object.assign(node, handle)))} class={clsx(isWheel() ? `${prefix}-item-wheel` : `${prefix}-item`, local.class)}>
            <Show when={isWheel()} fallback={renderListbox()}>
                <div class={`${prefix}-shade ${prefix}-shade-pre`} />
                <div ref={(node) => (selector = node)} class={`${prefix}-selector`} />
                <div class={`${prefix}-shade ${prefix}-shade-post`} />
                <div ref={(node) => (outer = node)} class={clsx(`${prefix}-list-outer`, { [`${prefix}-list-outer-nocycle`]: !local.cycled })} onScroll={foundation.handleScroll}>
                    {renderListbox()}
                </div>
            </Show>
        </div>
    );
}

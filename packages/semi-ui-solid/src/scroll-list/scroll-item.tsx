import { type Ref, For, Show, createMemo, createUniqueId, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/scroll-list/constants';
import ItemFoundation, { type Item, type ScrollItemAdapter } from '@fibrae/semi-foundation/scroll-list/item-foundation';
import '@fibrae/semi-foundation/scroll-list/scroll-list.scss';
import type { ElementProps } from '../_base/element-props';
import mergeRefs from '../_base/merge-refs';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';

const wheelMode = 'wheel';
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
    /** The root element with the ScrollItemHandle method, which TimePicker and DatePicker call to re-centre a column */
    ref?: Ref<ScrollItemElement>;
}

export interface ScrollItemState {
    prependCount: number;
    appendCount: number;
}

export interface ScrollItemHandle {
    /** Scrolls to the selected item; `selectedIndex` is not used, the target is the item last selected */
    scrollToIndex: (selectedIndex?: number, duration?: number) => void;
}

export type ScrollItemElement = HTMLDivElement & ScrollItemHandle;

type Foundation<T extends Item> = ItemFoundation<T, ScrollItemProps<T>, ScrollItemState>;
type Adapter<T extends Item> = ScrollItemAdapter<T, ScrollItemProps<T>, ScrollItemState>;

const defaultProps = {
    selectedIndex: 0,
    motion: true,
    list: [],
    cycled: false,
    mode: wheelMode,
} satisfies Partial<ScrollItemProps<Item>>;

// An option is identified by `<copy name>_<n>_<index>` or, for the real list, by `<index>`
const parseKey = (key: string) => ({ copy: key.includes('_'), index: Number(key.slice(key.lastIndexOf('_') + 1)) });

export default function ScrollItem<T extends Item = Item>(rawProps: ScrollItemProps<T>) {
    const props = useDefaultProps('ScrollItem', rawProps, defaultProps) as ScrollItemProps<T> & Required<Pick<ScrollItemProps<T>, keyof typeof defaultProps>>;
    const [local, rest] = splitProps(props, ['mode', 'cycled', 'list', 'selectedIndex', 'onSelect', 'transform', 'class', 'motion', 'type', 'ref', 'aria-label', 'aria-labelledby', 'aria-describedby']);

    let root!: HTMLDivElement;
    let listbox!: HTMLUListElement;
    const listId = createUniqueId();

    // only wheel mode renders these; the foundation reads them in wheel mode only
    let outer!: HTMLDivElement;
    let selector!: HTMLDivElement;

    const isWheel = () => local.mode === wheelMode;

    const { foundation, state } = useFoundation<Foundation<T>, Adapter<T>, ScrollItemProps<T>, ScrollItemState>(
        ItemFoundation,
        props,
        () => ({ prependCount: 0, appendCount: 0 }),
        (base) => ({
            getListNode: () => listbox,
            getScrollNode: () => (isWheel() ? outer : root),
            getSelectorNode: () => selector,
            notifySelectItem: (data) => base.getProps().onSelect?.(data),
        })
    );

    // Options are keyed by string so each node survives the copies being added around it: the foundation caches
    // the selected node and scrolls to it after the copies render.
    const keys = createMemo(() => {
        const indexes = local.list.map((_, index) => index);
        const items = (name: string) => indexes.map((index) => `${name}${index}`);
        if (!isWheel()) {
            return items('');
        }
        const copies = (count: number, name: string) => Array.from({ length: count }, (_, i) => items(`${name}_${i}_`));
        return [...copies(state().prependCount, 'pre').toReversed().flat(), ...items(''), ...copies(state().appendCount, 'app').flat()];
    });

    const handle: ScrollItemHandle = { scrollToIndex: (_index, duration) => foundation.scrollToSelected(duration) };

    // Only the real list carries ids: cycled copies would make the active descendant ambiguous
    const optionId = (index: number) => `${listId}-option-${index}`;

    const renderOption = (key: string) => {
        const { copy, index } = parseKey(key);
        const item = () => local.list[index];
        const selected = () => local.selectedIndex === index;
        const text = () => {
            const itemTransform = typeof item().transform === 'function' ? item().transform : local.transform;
            return selected() && typeof itemTransform === 'function' ? itemTransform(item().value, item().text) : (item().text ?? item().value);
        };
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
                    event.stopImmediatePropagation();
                    foundation.handleWheelClick(event);
                }
            }}
            onKeyDown={(event) => foundation.handleKeyDown(event)}
        >
            <For each={keys()}>{(key) => renderOption(key)}</For>
        </ul>
    );

    useWatch(
        () => local.selectedIndex,
        (selectedIndex, previous) => foundation.syncSelectedIndex(selectedIndex, previous)
    );

    useWatch(
        () => local.list.length,
        () => foundation.syncList()
    );

    return (
        <div {...rest} ref={(node) => mergeRefs(local.ref)((root = Object.assign(node, handle)))} class={clsx(isWheel() ? `${prefix}-item-wheel` : `${prefix}-item`, local.class)}>
            <Show when={isWheel()} fallback={renderListbox()}>
                <div class={`${prefix}-shade ${prefix}-shade-pre`} />
                <div ref={(node) => (selector = node)} class={`${prefix}-selector`} />
                <div class={`${prefix}-shade ${prefix}-shade-post`} />
                <div ref={(node) => (outer = node)} class={clsx(`${prefix}-list-outer`, { [`${prefix}-list-outer-nocycle`]: !local.cycled })} onScroll={() => foundation.handleScroll()}>
                    {renderListbox()}
                </div>
            </Show>
        </div>
    );
}

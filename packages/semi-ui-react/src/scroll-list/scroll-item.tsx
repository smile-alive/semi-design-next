import type React from 'react';
import { useId, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/scroll-list/constants';
import ItemFoundation, { type Item, type ScrollItemAdapter } from '@fibrae/semi-foundation/scroll-list/item-foundation';
import { noop } from '@fibrae/semi-foundation/utils/function';
import type { ElementProps, Motion } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';

const wheelMode = 'wheel';
const prefix = cssClasses.PREFIX;

export interface ScrollItemProps<T extends Item> extends ElementProps<'div', 'onSelect' | 'children'> {
    mode?: string;
    cycled?: boolean;
    list?: T[];
    selectedIndex?: number;
    onSelect?: (data: T & { type?: string | number; index: number }) => void;
    transform?: (value: any, text?: string) => string;
    className?: string;
    motion?: Motion;
    style?: React.CSSProperties;
    type?: string | number; // identifies the item to the Semi components that use it; not for end users
}

export interface ScrollItemState {
    prependCount: number;
    appendCount: number;
}

/** Called by TimePicker and DatePicker to re-centre a column, e.g. after the panel resizes */
export interface ScrollItemHandle {
    /** Scrolls to the selected item; `selectedIndex` is not used, the target is the item last selected */
    scrollToIndex: (selectedIndex?: number, duration?: number) => void;
}

type ScrollItemFoundation<T extends Item> = ItemFoundation<T, ScrollItemProps<T>, ScrollItemState>;

const defaultProps = {
    selectedIndex: 0,
    motion: true,
    list: [],
    onSelect: noop,
    cycled: false,
    mode: wheelMode,
} satisfies Partial<ScrollItemProps<Item>>;

export default function ScrollItem<T extends Item>(rawProps: ScrollItemProps<T> & { ref?: React.Ref<ScrollItemHandle> }) {
    const props = useDefaultProps('ScrollItem', rawProps, defaultProps);
    const { ref, mode, cycled, list, selectedIndex, onSelect, transform, className, motion, style, type, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, 'aria-describedby': ariaDescribedby, ...rest } = props;

    const listRef = useRef<HTMLUListElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const selectorRef = useRef<HTMLDivElement>(null);
    const listId = useId();

    const [foundation, state] = useFoundation<ScrollItemFoundation<T>, ScrollItemAdapter<T, ScrollItemProps<T>, ScrollItemState>, ScrollItemProps<T>, ScrollItemState>(
        ItemFoundation,
        props,
        () => ({ prependCount: 0, appendCount: 0 }),
        (base) => ({
            getListNode: () => listRef.current,
            getScrollNode: () => wrapperRef.current,
            getSelectorNode: () => selectorRef.current,
            notifySelectItem: (data) => base.getProps().onSelect(data),
        })
    );

    const isWheel = mode === wheelMode;

    // Only the real list carries ids: cycled copies would make the active descendant ambiguous
    const optionId = (index: number) => `${listId}-option-${index}`;

    const renderListbox = (options: React.ReactNode, onClick?: (e: React.MouseEvent) => void) => (
        <ul
            ref={listRef}
            aria-activedescendant={list[selectedIndex] ? optionId(selectedIndex) : undefined}
            aria-describedby={ariaDescribedby}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            aria-multiselectable={false}
            role="listbox"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => foundation.handleKeyDown(e.nativeEvent)}
        >
            {options}
        </ul>
    );

    const renderItems = (keyPrefix: string) =>
        list.map((item, index) => {
            const selected = selectedIndex === index;
            const itemTransform = typeof item.transform === 'function' ? item.transform : transform;
            const text = selected && typeof itemTransform === 'function' ? itemTransform(item.value, item.text) : (item.text ?? item.value);
            return (
                <li
                    key={`${keyPrefix}${index}`}
                    id={keyPrefix ? undefined : optionId(index)}
                    className={clsx({
                        [`${prefix}-item-sel`]: selected && !isWheel,
                        [`${prefix}-item-disabled`]: Boolean(item.disabled),
                    })}
                    aria-disabled={item.disabled}
                    aria-hidden={keyPrefix ? true : undefined}
                    aria-selected={selected}
                    role="option"
                    onClick={isWheel || item.disabled ? undefined : () => foundation.selectIndex(index)}
                >
                    {text}
                </li>
            );
        });

    useDidUpdate(props.selectedIndex, foundation.syncSelectedIndex);
    useDidUpdate(props.list.length, foundation.syncList);

    useImperativeHandle(ref, () => ({ scrollToIndex: (_index, duration) => foundation.scrollToSelected(duration) }), [foundation]);

    if (!isWheel) {
        return (
            <div {...rest} ref={wrapperRef} className={clsx(`${prefix}-item`, className)} style={style}>
                {renderListbox(renderItems(''))}
            </div>
        );
    }

    const copies = (count: number, name: string) => Array.from({ length: count }, (_, i) => renderItems(`${name}_${i}_`));

    return (
        <div {...rest} className={clsx(`${prefix}-item-wheel`, className)} style={style}>
            <div className={`${prefix}-shade ${prefix}-shade-pre`} />
            <div ref={selectorRef} className={`${prefix}-selector`} />
            <div className={`${prefix}-shade ${prefix}-shade-post`} />
            <div ref={wrapperRef} className={clsx(`${prefix}-list-outer`, { [`${prefix}-list-outer-nocycle`]: !cycled })} onScroll={foundation.handleScroll}>
                {renderListbox(
                    <>
                        {copies(state.prependCount, 'pre').toReversed().flat()}
                        {renderItems('')}
                        {copies(state.appendCount, 'app').flat()}
                    </>,
                    (e) => {
                        e.nativeEvent.stopImmediatePropagation();
                        foundation.handleWheelClick(e.nativeEvent);
                    }
                )}
            </div>
        </div>
    );
}

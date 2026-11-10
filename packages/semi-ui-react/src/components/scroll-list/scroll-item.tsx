import type React from 'react';
import { useId, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/scroll-list/constants';
import ItemFoundation, { type Item, type ScrollItemAdapter, type ScrollItemBaseState, wheelMode } from '@fibrae/semi-foundation/components/scroll-list/item-foundation';
import { type ElementProps, type Motion, useDefaultProps, useFoundation } from '../../base/index';

const prefix = cssClasses.PREFIX;

export interface ScrollItemProps<T extends Item> extends ElementProps<'div', 'onSelect' | 'children'> {
    mode?: string;
    cycled?: boolean;
    list?: T[];
    selectedIndex?: number;
    onSelect?: (data: T & { index: number }) => void;
    transform?: (value: T['value'], text?: string) => string;
    className?: string;
    motion?: Motion;
    style?: React.CSSProperties;
}

/** Called by TimePicker and DatePicker to re-centre a column, e.g. after the panel resizes */
export interface ScrollItemHandle {
    /** Scrolls to the selected item; `selectedIndex` is not used, the target is the item last selected */
    scrollToIndex: (selectedIndex?: number, duration?: number) => void;
}

type ScrollItemFoundation<T extends Item> = ItemFoundation<T, ScrollItemProps<T>>;

const defaultProps = {
    selectedIndex: 0,
    motion: true,
    list: [],
    cycled: false,
    mode: wheelMode,
} satisfies Partial<ScrollItemProps<Item>>;

export default function ScrollItem<T extends Item>(rawProps: ScrollItemProps<T> & { ref?: React.Ref<ScrollItemHandle> }) {
    const props = useDefaultProps('ScrollItem', rawProps, defaultProps);
    const { ref, mode, cycled, list, selectedIndex, onSelect, transform, className, motion, style, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, 'aria-describedby': ariaDescribedby, ...rest } = props;

    const listRef = useRef<HTMLUListElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const selectorRef = useRef<HTMLDivElement>(null);
    const listId = useId();

    const [foundation, state] = useFoundation<ScrollItemFoundation<T>, ScrollItemAdapter<T, ScrollItemProps<T>>, ScrollItemProps<T>, ScrollItemBaseState>(
        ItemFoundation,
        props,
        () => ItemFoundation.getInitialState(),
        (base) => ({
            getListNode: () => listRef.current,
            getScrollNode: () => wrapperRef.current,
            getSelectorNode: () => selectorRef.current,
            notifySelectItem: (data) => base.getProps().onSelect?.(data),
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

    const renderItems = () =>
        ItemFoundation.getRows({ list, mode }, state).map(({ key, index, copy }) => {
            const item = list[index];
            const selected = selectedIndex === index;
            const text = ItemFoundation.getItemText(item, selected, transform);
            return (
                <li
                    key={key}
                    id={copy ? undefined : optionId(index)}
                    className={clsx({
                        [`${prefix}-item-sel`]: selected && !isWheel,
                        [cssClasses.SELECTED]: isWheel && key === state.highlightedKey,
                        [`${prefix}-item-disabled`]: Boolean(item.disabled),
                    })}
                    aria-disabled={item.disabled}
                    aria-hidden={copy ? true : undefined}
                    aria-selected={selected}
                    role="option"
                    onClick={isWheel || item.disabled ? undefined : () => foundation.selectIndex(index)}
                >
                    {text}
                </li>
            );
        });

    useImperativeHandle(ref, () => ({ scrollToIndex: (_index, duration) => foundation.scrollToSelected(duration) }), [foundation]);

    if (!isWheel) {
        return (
            <div {...rest} ref={wrapperRef} className={clsx(`${prefix}-item`, className)} style={style}>
                {renderListbox(renderItems())}
            </div>
        );
    }

    return (
        <div {...rest} className={clsx(`${prefix}-item-wheel`, className)} style={style}>
            <div className={`${prefix}-shade ${prefix}-shade-pre`} />
            <div ref={selectorRef} className={`${prefix}-selector`} />
            <div className={`${prefix}-shade ${prefix}-shade-post`} />
            <div ref={wrapperRef} className={clsx(`${prefix}-list-outer`, { [`${prefix}-list-outer-nocycle`]: !cycled })} onScroll={foundation.handleScroll}>
                {renderListbox(renderItems(), (e) => foundation.handleWheelClick(e.nativeEvent))}
            </div>
        </div>
    );
}

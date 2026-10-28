import React, { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DragDropProvider, DragOverlay, type DragEndEvent } from '@dnd-kit/react';
import { isSortable, useSortable, type UseSortableInput } from '@dnd-kit/react/sortable';
import clsx from 'clsx';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { SortableAnnouncer } from '@fibrae/semi-foundation/sortable/accessibility';
import { createContext } from '../_base/create-context';
import useLocale from '../locale/use-locale';
import type { SortableHandle } from './types';

export type { SortableHandle } from './types';

type UniqueIdentifier = string | number;

const defaultPrefix = `${BASE_CLASS_PREFIX}-sortable`;

interface OnSortEndProps {
    oldIndex: number;
    newIndex: number;
}
export type OnSortEnd = (props: OnSortEndProps) => void;

export interface RenderItemProps {
    id: UniqueIdentifier;
    sortableHandle: SortableHandle;
}
export interface SortableProps {
    onSortEnd: OnSortEnd;
    items: UniqueIdentifier[];
    renderItem: (props: RenderItemProps) => React.ReactNode;
    useDragOverlay?: boolean;
    container?: React.ComponentType<{ children?: ReactNode }>;
    transition?: UseSortableInput['transition'];
    prefix?: string;
    dragOverlayCls?: string;
    dragHandleLabel: string;
    // Lets the caller ignore the focus loss dnd-kit causes during a drag
    onDraggingChange?: (dragging: boolean) => void;
}

interface SortableItemProps {
    id: UniqueIdentifier;
    index: number;
    renderItem: (props: RenderItemProps) => ReactNode;
    prefix?: string;
    transition?: UseSortableInput['transition'];
    dragHandleLabel: string;
    roleDescription: string;
}

function DefaultContainer(props: { children?: ReactNode }) {
    return <div style={{ overflow: 'auto' }} {...props} />;
}

// the overlay copy renders its handle content without a second focusable handle
const overlayHandle: SortableHandle = (WrapperComponent) => WrapperComponent;

export function Sortable({ items, onSortEnd, renderItem, transition, useDragOverlay = true, dragOverlayCls, container: Container = DefaultContainer, prefix = defaultPrefix, dragHandleLabel, onDraggingChange }: SortableProps) {
    const { locale } = useLocale('Sortable');

    const [announcer] = useState(() => new SortableAnnouncer(locale, items.length));
    const [plugins] = useState(() => <T,>(defaults: T[]) => [...defaults, announcer.plugin]);

    // dnd-kit already moved the dropped element; if the parent keeps the old order React sees nothing to reconcile,
    // so the list is remounted to restore it
    const [listKey, setListKey] = useState(0);
    const [drops, setDrops] = useState(0);
    const itemsBeforeSort = useRef<UniqueIdentifier[] | null>(null);

    const onDragEnd = useCallback(
        (event: DragEndEvent) => {
            onDraggingChange?.(false);
            const { source } = event.operation;
            if (event.canceled || !isSortable(source) || source.initialIndex === source.index) {
                return;
            }
            itemsBeforeSort.current = [...items];
            onSortEnd({ oldIndex: source.initialIndex, newIndex: source.index });
            // Known limit: a parent accepting the sort a render later is remounted too, dropping handle focus;
            // upgrade to a dnd-kit API that restores the order if one is exposed
            setDrops((count) => count + 1);
        },
        [items, onSortEnd, onDraggingChange]
    );

    useLayoutEffect(() => announcer.update(locale, items.length), [announcer, locale, items.length]);

    useEffect(() => {
        const before = itemsBeforeSort.current;
        itemsBeforeSort.current = null;
        if (before && items.every((id, index) => id === before[index])) {
            setListKey((key) => key + 1);
        }
    }, [items, drops]);

    return (
        <DragDropProvider plugins={plugins} onDragEnd={onDragEnd} onDragStart={() => onDraggingChange?.(true)}>
            <Container key={listKey}>
                {items.map((value, index) => (
                    <SortableItem key={value} id={value} dragHandleLabel={dragHandleLabel} index={index} roleDescription={locale.roleDescription} transition={transition} prefix={prefix} renderItem={renderItem} />
                ))}
            </Container>
            {useDragOverlay && <DragOverlay className={dragOverlayCls}>{(source) => renderItem({ id: source.id, sortableHandle: overlayHandle })}</DragOverlay>}
        </DragDropProvider>
    );
}

class HandleBox {
    #content: React.ComponentType | null = null;

    get content() {
        return this.#content;
    }

    set(content: React.ComponentType) {
        this.#content = content;
    }
}

interface HandleContextValue {
    handleRef: (element: Element | null) => void;
    box: HandleBox;
    prefix: string;
    label: string;
    roleDescription: string;
}

const [HandleContext, useHandleContext] = createContext<HandleContextValue>('Sortable');

// dnd-kit drags by pointer and keyboard from the handle, so it is a native button; its a11y plugin adds
// aria-describedby and aria-pressed and keeps the role description set here
function SortableHandle() {
    const { handleRef, box, prefix, label, roleDescription } = useHandleContext('SortableHandle');

    const Content = box.content;

    return (
        <button
            ref={handleRef}
            type="button"
            className={`${prefix}-sortable-handle`}
            aria-label={label}
            aria-roledescription={roleDescription}
            onMouseDown={(e) => {
                // the element may unmount after the click, which would close a tooltip/popover layer
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <Content />
        </button>
    );
}

export function SortableItem({ id, index, renderItem, prefix, transition, dragHandleLabel, roleDescription }: SortableItemProps) {
    // SortableHandle is module-level so the handle keeps identity (and focus) across re-renders during a drag;
    // the caller's content travels in this box.
    // Known limit: one box per item, so calling sortableHandle twice renders the last content in every handle;
    // to support several, cache one stable component per WrapperComponent.
    const [handleBox] = useState(() => new HandleBox());

    const { ref, handleRef, isDragSource, isDropTarget } = useSortable({ id, index, transition });

    const handleContext = useMemo(() => ({ handleRef, box: handleBox, prefix, label: dragHandleLabel, roleDescription }), [handleRef, handleBox, prefix, dragHandleLabel, roleDescription]);

    const itemCls = clsx(`${prefix}-sortable-item`, {
        [`${prefix}-sortable-item-over`]: isDropTarget,
        [`${prefix}-sortable-item-active`]: isDragSource,
    });

    const sortableHandle = useCallback(
        (WrapperComponent: React.ComponentType) => {
            handleBox.set(WrapperComponent);
            return SortableHandle;
        },
        [handleBox]
    );

    return (
        <div ref={ref} className={itemCls}>
            <HandleContext value={handleContext}>{renderItem({ id, sortableHandle }) as React.JSX.Element}</HandleContext>
        </div>
    );
}

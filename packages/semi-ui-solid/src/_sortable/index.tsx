import { createRenderEffect, For, type JSX, mergeProps, Show, untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { DragDropProvider, type DragDropProviderProps, DragOverlay, useDragDropMonitor } from '@dnd-kit/solid';
import { isSortable, useSortable } from '@dnd-kit/solid/sortable';
import clsx from 'clsx';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { SortableAnnouncer } from '@fibrae/semi-foundation/sortable/accessibility';
import useLocale from '../locale/use-locale';
import type { SortableHandle, SortableProps } from './types';

export type * from './types';

function DefaultContainer(props: { children?: JSX.Element }) {
    return <div style={{ overflow: 'auto' }}>{props.children}</div>;
}

const defaultProps = {
    useDragOverlay: true,
    container: DefaultContainer,
    prefix: `${BASE_CLASS_PREFIX}-sortable`,
} satisfies Partial<SortableProps>;

// the overlay copy renders its handle content without a second focusable handle
const overlayHandle: SortableHandle = (WrapperComponent) => WrapperComponent;

export function Sortable(rawProps: SortableProps) {
    const props = mergeProps(defaultProps, rawProps);

    const locale = useLocale('Sortable');

    // the announcements run at drag time and read the latest locale and item count, kept current below
    const announcer = untrack(() => new SortableAnnouncer(locale().locale, props.items.length));

    const plugins: DragDropProviderProps['plugins'] = (defaults) => [...defaults, announcer.plugin];

    const onDragEnd: DragDropProviderProps['onDragEnd'] = (event) => {
        props.onDraggingChange?.(false);
        const { source } = event.operation;
        if (event.canceled || !isSortable(source) || source.initialIndex === source.index) {
            return;
        }
        props.onSortEnd({ oldIndex: source.initialIndex, newIndex: source.index });
    };

    createRenderEffect(() => announcer.update(locale().locale, props.items.length));

    return (
        // No onDragOver: with it the provider re-saves the dragged element's position on every move, and the drop would
        // no longer put the element back where it started, which is what keeps the DOM right when the parent declines
        <DragDropProvider plugins={plugins} onDragEnd={onDragEnd} onDragStart={() => props.onDraggingChange?.(true)}>
            <Dynamic component={props.container}>
                <For each={props.items}>{(id, index) => <SortableItem id={id} index={index()} label={props.dragHandleLabel} prefix={props.prefix} renderItem={props.renderItem} roleDescription={locale().locale.roleDescription} transition={props.transition} />}</For>
            </Dynamic>
            <Show when={props.useDragOverlay}>
                <DragOverlay class={props.dragOverlayCls}>
                    {(source) => (
                        <Show keyed when={props.renderItem}>
                            {(render) => render({ id: source.id, sortableHandle: overlayHandle })}
                        </Show>
                    )}
                </DragOverlay>
            </Show>
        </DragDropProvider>
    );
}

interface SortableItemProps extends Pick<SortableProps, 'renderItem' | 'transition'> {
    id: string | number;
    index: number;
    prefix: string;
    label: string;
    roleDescription: string;
}

function SortableItem(props: SortableItemProps) {
    const { sortable, ref, handleRef, isDragSource, isDropTarget } = useSortable({
        get id() {
            return props.id;
        },
        get index() {
            return props.index;
        },
        get transition() {
            return props.transition;
        },
    });

    // dnd-kit drags by pointer and keyboard from the handle, so it is a native button; its a11y plugin adds
    // aria-describedby and aria-pressed and keeps the role description set here.
    // Known limit: an item registers one handle, so a second handle in the same item takes over from the first;
    // TagInput and Transfer use one per item
    const sortableHandle: SortableHandle = (WrapperComponent) => () => (
        <button
            ref={(node) => handleRef(node)}
            type="button"
            class={`${props.prefix}-sortable-handle`}
            aria-label={props.label}
            aria-roledescription={props.roleDescription}
            onMouseDown={(e) => {
                // the element may unmount after the press, which would close a tooltip/popover layer
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <WrapperComponent />
        </button>
    );

    // dnd-kit renumbers the items while they move; when the parent keeps the old order no index prop changes, so
    // nothing would renumber them back for the next drag
    useDragDropMonitor({
        onDragEnd: () =>
            queueMicrotask(() => {
                sortable.index = props.index;
            }),
    });

    return (
        <div
            ref={(node) => ref(node)}
            class={clsx(`${props.prefix}-sortable-item`, {
                [`${props.prefix}-sortable-item-over`]: isDropTarget(),
                [`${props.prefix}-sortable-item-active`]: isDragSource(),
            })}
        >
            <Show keyed when={props.renderItem}>
                {(render) => render({ id: props.id, sortableHandle })}
            </Show>
        </div>
    );
}

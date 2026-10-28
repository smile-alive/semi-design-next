import { createSignal } from 'solid-js';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { Accessibility } from '@dnd-kit/dom';
import { arrayMove } from '@dnd-kit/helpers';
import { DragDropProvider } from '@dnd-kit/solid';
import { isSortable, useSortable } from '@dnd-kit/solid/sortable';
import { List, Avatar, type AvatarColor } from '@fibrae/semi-ui-solid';

interface Item {
    id: number;
    title: string;
    color: AvatarColor;
}

const data: Item[] = [
    {
        id: 1,
        title: 'Semi Design Title 1',
        color: 'red',
    },
    {
        id: 2,
        title: 'Semi Design Title 2',
        color: 'grey',
    },
    {
        id: 3,
        title: 'Semi Design Title 3',
        color: 'light-green',
    },
    {
        id: 4,
        title: 'Semi Design Title 4',
        color: 'light-blue',
    },
    {
        id: 5,
        title: 'Semi Design Title 5',
        color: 'pink',
    },
];

interface SortableListItemProps {
    item: Item;
    index: number;
}

function SortableListItem(props: SortableListItemProps) {
    const { ref, isDragging } = useSortable({
        get id() {
            return props.item.id;
        },
        get index() {
            return props.index;
        },
    });

    return (
        <List.Item
            ref={(node) => ref(node)}
            class={isDragging() ? 'isDragging' : undefined}
            style={{
                border: '1px solid var(--semi-color-border)',
                'margin-bottom': '12px',
                cursor: 'grabbing',
                ...(isDragging() ? { 'z-index': 999, position: 'relative', 'background-color': 'var(--semi-color-bg-0)' } : {}),
            }}
            header={<Avatar color={props.item.color}>SE</Avatar>}
            main={
                <div>
                    <span style={{ color: 'var(--semi-color-text-0)', 'font-weight': '500' }}>{props.item.title}</span>
                    <p style={{ color: 'var(--semi-color-text-2)', margin: '4px 0' }}>Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                </div>
            }
        />
    );
}

export default function ListDemo() {
    const [listItems, setListItems] = createSignal(data);

    return (
        <div style={{ padding: '12px', border: '1px solid var(--semi-color-border)', margin: '12px' }}>
            <DragDropProvider
                plugins={(defaults) => defaults.filter((plugin) => plugin !== Accessibility)}
                modifiers={[RestrictToVerticalAxis]}
                onDragEnd={(event) => {
                    const { source } = event.operation;
                    if (!event.canceled && isSortable(source)) {
                        setListItems((items) => arrayMove(items, source.initialIndex, source.index));
                    }
                }}
            >
                <List dataSource={listItems()} renderItem={(item, index) => <SortableListItem item={item} index={index} />} />
            </DragDropProvider>
        </div>
    );
}

import { useState, type ComponentProps, type CSSProperties } from 'react';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { Accessibility } from '@dnd-kit/dom';
import { move } from '@dnd-kit/helpers';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { List, Avatar, type AvatarColor, type ListItemProps } from '@fibrae/semi-ui-react';

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

interface SortableListItemProps extends Omit<ListItemProps, 'id' | 'title' | 'color'> {
    id: number;
    index: number;
    title: string;
    color: AvatarColor;
}

function ListItem({ id, index, title, color, ...props }: SortableListItemProps) {
    const { ref, isDragging } = useSortable({ id, index });

    const styles: CSSProperties = {
        ...props.style,
        border: '1px solid var(--semi-color-border)',
        marginBottom: 12,
        cursor: 'grabbing',
        ...(isDragging ? { zIndex: 999, position: 'relative', backgroundColor: 'var(--semi-color-bg-0)' } : {}),
    };

    // The li itself is dragged, so items stay direct children; no Accessibility plugin, so no button role or Tab stop
    // (pointer dragging only)
    return <List.Item {...props} ref={ref} style={styles} className={isDragging ? 'isDragging' : undefined} />;
}

function renderDraggable(item: Item, index: number) {
    return (
        <ListItem
            {...item}
            // dnd-kit reorders li nodes mid-drag; an index key would give a moved node another item's data
            key={item.id}
            index={index}
            header={<Avatar color={item.color}>SE</Avatar>}
            main={
                <div>
                    <span style={{ color: 'var(--semi-color-text-0)', fontWeight: 500 }}>{item.title}</span>
                    <p style={{ color: 'var(--semi-color-text-2)', margin: '4px 0' }}>Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                </div>
            }
        />
    );
}

export default function ListDemo() {
    const [listItems, setListItems] = useState(data);

    const handleDragEnd: ComponentProps<typeof DragDropProvider>['onDragEnd'] = (event) => {
        if (!event.canceled) {
            setListItems((items) => move(items, event));
        }
    };

    return (
        <div style={{ padding: 12, border: '1px solid var(--semi-color-border)', margin: 12 }}>
            <DragDropProvider plugins={(defaults) => defaults.filter((plugin) => plugin !== Accessibility)} modifiers={[RestrictToVerticalAxis]} onDragEnd={handleDragEnd}>
                <List dataSource={listItems} renderItem={renderDraggable} />
            </DragDropProvider>
        </div>
    );
}

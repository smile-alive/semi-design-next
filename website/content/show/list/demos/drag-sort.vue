<script setup lang="ts">
    import { defineComponent, h, shallowRef, type ComponentPublicInstance, type SlotsType, type VNode } from 'vue';
    import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
    import { Accessibility } from '@dnd-kit/dom';
    import { move } from '@dnd-kit/helpers';
    import { DragDropProvider, type DragDropProviderProps, type DragEndEvent } from '@dnd-kit/vue';
    import { useSortable } from '@dnd-kit/vue/sortable';
    import { Avatar, List, ListItem, type AvatarColor } from '@fibrae/semi-ui-vue';

    interface Item {
        id: number;
        title: string;
        color: AvatarColor;
    }

    const listItems = shallowRef<Item[]>([
        { id: 1, title: 'Semi Design Title 1', color: 'red' },
        { id: 2, title: 'Semi Design Title 2', color: 'grey' },
        { id: 3, title: 'Semi Design Title 3', color: 'light-green' },
        { id: 4, title: 'Semi Design Title 4', color: 'light-blue' },
        { id: 5, title: 'Semi Design Title 5', color: 'pink' },
    ]);

    // useSortable must run inside the item's own component; the li itself is dragged, so items stay direct children.
    // A demo is a single SFC, hence the component is defined here.
    const SortableListItem = defineComponent({
        props: {
            id: { type: Number, required: true },
            index: { type: Number, required: true },
        },
        slots: Object as SlotsType<{ header: () => VNode[]; main: () => VNode[] }>,
        setup(props, { slots }) {
            const element = shallowRef<ComponentPublicInstance | null>(null);
            const { isDragging } = useSortable({ id: () => props.id, index: () => props.index, element });
            return () =>
                h(
                    ListItem,
                    {
                        ref: (instance) => {
                            element.value = instance as ComponentPublicInstance | null;
                        },
                        class: { isDragging: isDragging.value },
                        style: {
                            border: '1px solid var(--semi-color-border)',
                            marginBottom: '12px',
                            cursor: 'grabbing',
                            ...(isDragging.value ? { zIndex: 999, position: 'relative', backgroundColor: 'var(--semi-color-bg-0)' } : {}),
                        },
                    },
                    { header: slots.header, main: slots.main }
                );
        },
    });

    // Accessibility would add role="button" and a Tab stop to each li; pointer dragging only
    const plugins: DragDropProviderProps['plugins'] = (defaults) => defaults.filter((plugin) => plugin !== Accessibility);
    const modifiers = [RestrictToVerticalAxis];

    const handleDragEnd = (event: DragEndEvent) => {
        if (!event.canceled) {
            listItems.value = move(listItems.value, event);
        }
    };
</script>

<template>
    <div :style="{ padding: '12px', border: '1px solid var(--semi-color-border)', margin: '12px' }">
        <DragDropProvider :modifiers="modifiers" :plugins="plugins" @dragEnd="handleDragEnd">
            <List :dataSource="listItems">
                <template #item="{ item, index }">
                    <!-- dnd-kit reorders li nodes mid-drag; an index key would hand a node another item's data -->
                    <SortableListItem :id="item.id" :key="item.id" :index="index">
                        <template #header>
                            <Avatar :color="item.color">SE</Avatar>
                        </template>
                        <template #main>
                            <div>
                                <span :style="{ color: 'var(--semi-color-text-0)', fontWeight: 500 }">
                                    {{ item.title }}
                                </span>
                                <p :style="{ color: 'var(--semi-color-text-2)', margin: '4px 0' }">Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                            </div>
                        </template>
                    </SortableListItem>
                </template>
            </List>
        </DragDropProvider>
    </div>
</template>

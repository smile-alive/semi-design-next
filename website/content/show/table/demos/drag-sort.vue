<script setup lang="ts">
    import { computed, defineComponent, h, shallowRef } from 'vue';
    import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
    import { Accessibility } from '@dnd-kit/dom';
    import { arrayMove } from '@dnd-kit/helpers';
    import { DragDropProvider, type DragDropProviderProps, type DragEndEvent } from '@dnd-kit/vue';
    import { isSortable, useSortable } from '@dnd-kit/vue/sortable';
    import * as dateFns from 'date-fns';
    import { Avatar, Table, type ColumnProps, type TableChangeInfo } from '@fibrae/semi-ui-vue';

    const figmaIconUrl = '/assets/placeholder/app.svg';

    interface Row {
        key: string;
        name: string;
        owner: string;
        size: number;
        updateTime: number;
        avatarBg: 'grey' | 'red';
    }

    const getData = () => {
        const data: Row[] = [];
        for (let i = 0; i < 46; i++) {
            const isSemiDesign = i % 2 === 0;
            const randomNumber = (i * 1000) % 199;
            data.push({
                key: '' + i,
                name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
                owner: isSemiDesign ? '姜鹏志' : '郝宣',
                size: randomNumber,
                updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber,
                avatarBg: isSemiDesign ? 'grey' : 'red',
            });
        }
        return data;
    };

    const pageSize = 10;
    const dataSource = shallowRef(getData());
    const pageNum = shallowRef(1);
    const pageData = computed(() => dataSource.value.slice((pageNum.value - 1) * pageSize, pageNum.value * pageSize));

    const columns: ColumnProps<Row>[] = [
        {
            title: '标题',
            dataIndex: 'name',
            width: 400,
            filters: [
                {
                    text: 'Semi Design 设计稿',
                    value: 'Semi Design 设计稿',
                },
                {
                    text: 'Semi D2C 设计稿',
                    value: 'Semi D2C 设计稿',
                },
            ],
            onFilter: (value, record) => record.name.includes(value),
        },
        {
            title: '大小',
            dataIndex: 'size',
            sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        },
        {
            title: '所有者',
            dataIndex: 'owner',
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        },
    ];

    // Table creates a body row component per row and passes it the row's attributes, so the sortable must be set up
    // inside it. A demo is a single SFC, hence the component is defined here.
    const SortableRow = defineComponent((_props, { attrs, slots }) => {
        const element = shallowRef<HTMLElement | null>(null);
        // The sortable index is relative to the current page
        const { isDragging } = useSortable({
            id: () => String(attrs['data-row-key']),
            index: () => pageData.value.findIndex((row) => row.key === attrs['data-row-key']),
            element,
        });
        return () =>
            h(
                'tr',
                {
                    ref: element,
                    class: { isDragging: isDragging.value },
                    style: {
                        cursor: 'grabbing',
                        ...(isDragging.value ? { zIndex: 999, position: 'relative' as const } : {}),
                    },
                },
                slots.default?.()
            );
    });
    const components = { body: { row: SortableRow } };

    // Accessibility would add role="button" and a Tab stop to each row; keep table row semantics
    const plugins: DragDropProviderProps['plugins'] = (defaults) => defaults.filter((plugin) => plugin !== Accessibility);
    const modifiers = [RestrictToVerticalAxis];

    const handleDragEnd = (event: DragEndEvent) => {
        const { source } = event.operation;
        if (event.canceled || !isSortable(source) || source.initialIndex === source.index) {
            return;
        }
        const offset = (pageNum.value - 1) * pageSize;
        dataSource.value = arrayMove(dataSource.value, offset + source.initialIndex, offset + source.index);
    };

    const handleChange = ({ pagination }: TableChangeInfo<Row>) => {
        if (pagination?.currentPage) {
            pageNum.value = pagination.currentPage;
        }
    };
</script>

<template>
    <DragDropProvider :modifiers="modifiers" :plugins="plugins" @dragEnd="handleDragEnd">
        <Table :columns="columns" :components="components" :dataSource="pageData" :pagination="{ currentPage: pageNum, pageSize, total: dataSource.length }" rowKey="key" @change="handleChange">
            <template #cell="{ column, record, text }">
                <div v-if="column.dataIndex === 'name'">
                    <Avatar alt="" shape="square" size="small" :src="figmaIconUrl" :style="{ marginRight: '12px' }" />
                    {{ text }}
                </div>
                <template v-else-if="column.dataIndex === 'size'">{{ text }} KB</template>
                <div v-else-if="column.dataIndex === 'owner'">
                    <Avatar :color="record.avatarBg" size="small" :style="{ marginRight: '4px' }">
                        {{ typeof text === 'string' && text.slice(0, 1) }}
                    </Avatar>
                    {{ text }}
                </div>
                <template v-else-if="column.dataIndex === 'updateTime'">
                    {{ dateFns.format(new Date(text), 'yyyy-MM-dd') }}
                </template>
            </template>
        </Table>
    </DragDropProvider>
</template>

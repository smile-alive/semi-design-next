<script setup lang="ts">
    import { ref, watch } from 'vue';
    import * as dateFns from 'date-fns';
    import { IconClear, IconComment, IconTickCircle } from '@fibrae/semi-icons-vue';
    import { Avatar, Table, Tag, type ColumnProps } from '@fibrae/semi-ui-vue';

    const DAY = 24 * 60 * 60 * 1000;
    const figmaIconUrl = '/assets/placeholder/app.svg';
    const pageSize = 5;

    interface Row {
        key: string;
        name: string;
        owner: string;
        size: number;
        status: 'success' | 'wait';
        updateTime: number;
        avatarBg: 'grey' | 'red';
    }

    const tagConfig = {
        success: { color: 'green', icon: IconTickCircle, text: '已交付' },
        pending: { color: 'pink', icon: IconClear, text: '已延期' },
        wait: { color: 'cyan', icon: IconComment, text: '待评审' },
    } as const;

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
            title: '交付状态',
            dataIndex: 'status',
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
                status: isSemiDesign ? 'success' : 'wait',
                updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber * DAY,
                avatarBg: isSemiDesign ? 'grey' : 'red',
            });
        }
        return data;
    };

    const data = getData();

    const fetchData = (currentPage: number) => {
        return new Promise<Row[]>((res) => {
            setTimeout(() => {
                res(data.slice((currentPage - 1) * pageSize, currentPage * pageSize));
            }, 300);
        });
    };

    const dataSource = ref<Row[]>([]);
    const loading = ref(true);
    const currentPage = ref(1);

    const handlePageChange = (page: number) => {
        loading.value = true;
        currentPage.value = page;
    };

    watch(
        currentPage,
        (page, _prev, onCleanup) => {
            // Drop responses for pages the user has left
            let ignore = false;
            onCleanup(() => {
                ignore = true;
            });
            void fetchData(page).then((rows) => {
                if (!ignore) {
                    loading.value = false;
                    dataSource.value = rows;
                }
            });
        },
        { immediate: true }
    );
</script>

<template>
    <Table :columns="columns" :dataSource="dataSource" :loading="loading" :pagination="{ currentPage, pageSize, total: data.length, onPageChange: handlePageChange }">
        <template #cell="{ column, record, text }">
            <div v-if="column.dataIndex === 'name'">
                <Avatar alt="" shape="square" size="small" :src="figmaIconUrl" :style="{ marginRight: '12px' }" />
                {{ text }}
            </div>
            <template v-else-if="column.dataIndex === 'size'">{{ text }} KB</template>
            <Tag v-else-if="column.dataIndex === 'status'" :color="tagConfig[text as Row['status']].color" shape="circle" :style="{ userSelect: 'text' }">
                <template #prefixIcon>
                    <component :is="tagConfig[text as Row['status']].icon" />
                </template>
                {{ tagConfig[text as Row['status']].text }}
            </Tag>
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
</template>

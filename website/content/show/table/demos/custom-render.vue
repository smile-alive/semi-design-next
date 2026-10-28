<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { IconClear, IconComment, IconDelete, IconTickCircle } from '@fibrae/semi-icons-vue';
    import { IllustrationNoResult, IllustrationNoResultDark } from '@fibrae/semi-illustrations-vue';
    import { Avatar, Button, Empty, Table, Tag, Typography, type ColumnProps } from '@fibrae/semi-ui-vue';

    const { Text } = Typography;

    interface Row {
        key: string;
        name: string;
        nameIconSrc: string;
        size: string;
        owner: string;
        status: 'success' | 'pending' | 'wait';
        updateTime: string;
        avatarBg: 'grey' | 'red' | 'light-blue' | 'green';
    }

    const tagConfig = {
        success: { color: 'green', icon: IconTickCircle, text: '已交付' },
        pending: { color: 'pink', icon: IconClear, text: '已延期' },
        wait: { color: 'cyan', icon: IconComment, text: '待评审' },
    } as const;

    const raw: Row[] = [
        {
            key: '1',
            name: 'Semi Design 设计稿标题可能有点长这时候应该显示 Tooltip.fig',
            nameIconSrc: '/assets/placeholder/app.svg',
            size: '2M',
            owner: '姜鹏志',
            status: 'success',
            updateTime: '2020-02-02 05:13',
            avatarBg: 'grey',
        },
        {
            key: '2',
            name: 'Semi Design 分享演示文稿',
            nameIconSrc: '/assets/docs-icon.png',
            size: '2M',
            owner: '郝宣',
            status: 'pending',
            updateTime: '2020-01-17 05:31',
            avatarBg: 'red',
        },
        {
            key: '3',
            name: '设计文档',
            nameIconSrc: '/assets/docs-icon.png',
            size: '34KB',
            status: 'wait',
            owner: 'Zoey Edwards',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'light-blue',
        },
        {
            key: '4',
            name: 'Semi D2C 设计文档可能也有点长所以也会显示 Tooltip',
            nameIconSrc: '/assets/docs-icon.png',
            size: '34KB',
            status: 'success',
            owner: '姜琪',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'green',
        },
    ];

    const dataSource = shallowRef(raw);

    const removeRecord = (key: string) => {
        dataSource.value = dataSource.value.filter((data) => data.key !== key);
    };
    const resetData = () => {
        dataSource.value = [...raw];
    };

    const columns: ColumnProps<Row>[] = [
        {
            title: '标题',
            dataIndex: 'name',
            width: 400,
        },
        {
            title: '大小',
            dataIndex: 'size',
            width: 150,
        },
        {
            title: '交付状态',
            dataIndex: 'status',
        },
        {
            title: '所有者',
            dataIndex: 'owner',
            width: 300,
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            width: 200,
        },
        {
            title: '',
            dataIndex: 'operate',
        },
    ];
</script>

<template>
    <div>
        <Button :style="{ marginBottom: '10px' }" @click="resetData">重置</Button>
        <Table :columns="columns" :dataSource="dataSource" :pagination="false" :style="{ minHeight: '350px' }">
            <template #cell="{ column, record, text }">
                <span v-if="column.dataIndex === 'name'" :style="{ display: 'flex', alignItems: 'center' }">
                    <Avatar alt="" shape="square" size="small" :src="record.nameIconSrc" :style="{ marginRight: '12px' }" />
                    <!-- Width = the cell's 400px minus the non-text content -->
                    <Text :ellipsis="{ showTooltip: true }" :style="{ width: 'calc(400px - 76px)' }">{{ text }}</Text>
                </span>
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
                <Button v-else-if="column.dataIndex === 'operate'" aria-label="删除" theme="borderless" @click="removeRecord(record.key)">
                    <template #icon>
                        <IconDelete />
                    </template>
                </Button>
            </template>
            <template #empty>
                <Empty>
                    <template #image>
                        <IllustrationNoResult />
                    </template>
                    <template #darkModeImage>
                        <IllustrationNoResultDark />
                    </template>
                    <template #description>搜索无结果</template>
                </Empty>
            </template>
        </Table>
    </div>
</template>

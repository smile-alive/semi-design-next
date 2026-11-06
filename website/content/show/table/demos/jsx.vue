<script setup lang="ts">
    import { IconMore } from '@fibrae/semi-icons-vue';
    import { Avatar, Table, type AvatarProps } from '@fibrae/semi-ui-vue';

    interface Row {
        key: string;
        name: string;
        nameIconSrc: string;
        size: string;
        owner: string;
        status: string;
        updateTime: string;
        avatarBg: AvatarProps['color'];
    }

    const data: Row[] = [
        {
            key: '1',
            name: 'Semi Design 设计稿.fig',
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
    ];
</script>

<template>
    <Table :dataSource="data" :pagination="false">
        <Table.Column key="name" dataIndex="name" title="标题">
            <template #cell="cellProps">
                <div>
                    <Avatar alt="" shape="square" size="small" :src="cellProps.record.nameIconSrc" :style="{ marginInlineEnd: '12px' }" />
                    {{ cellProps.text }}
                </div>
            </template>
        </Table.Column>
        <Table.Column key="size" dataIndex="size" title="大小" />
        <Table.Column key="owner" dataIndex="owner" title="所有者">
            <template #cell="cellProps">
                <div>
                    <Avatar :color="cellProps.record.avatarBg" size="small" :style="{ marginInlineEnd: '4px' }">
                        {{ typeof cellProps.text === 'string' && cellProps.text.slice(0, 1) }}
                    </Avatar>
                    {{ cellProps.text }}
                </div>
            </template>
        </Table.Column>
        <Table.Column key="updateTime" dataIndex="updateTime" title="更新时间" />
        <Table.Column key="operate" dataIndex="operate" title="">
            <template #cell>
                <IconMore />
            </template>
        </Table.Column>
    </Table>
</template>

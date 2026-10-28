<script setup lang="ts">
    import { Avatar, Select, Tag } from '@fibrae/semi-ui-vue';

    interface ListItem {
        name: string;
        email: string;
        avatar: string;
    }

    const list: ListItem[] = [
        {
            name: '夏可漫',
            email: 'xiakeman@example.com',
            avatar: '/assets/placeholder/avatar-a.svg',
        },
        {
            name: '申悦',
            email: 'shenyue@example.com',
            avatar: '/assets/root-web-sites/bag.jpeg',
        },
        {
            name: '曲晨一',
            email: 'quchenyi@example.com',
            avatar: '/assets/placeholder/avatar-c.svg',
        },
        {
            name: '文嘉茂',
            email: 'wenjiamao@example.com',
            avatar: '/assets/root-web-sites/6fbafc2d-e3e6-4cff-a1e2-17709c680624.png',
        },
    ];

    const onChange = (value: unknown) => console.log(value);

    const optionStyle = {
        display: 'flex',
        paddingLeft: '24px',
        paddingTop: '10px',
        paddingBottom: '10px',
    };
</script>

<template>
    <Select aria-label="单选" defaultValue="申悦" placeholder="请选择" style="width: 280px; height: 40px" @change="onChange">
        <template #selectedItem="{ option }">
            <div style="display: flex; align-items: center">
                <Avatar alt="" size="small" :src="option.avatar" />
                <span style="margin-left: 8px">{{ option.email }}</span>
            </div>
        </template>
        <Select.Option v-for="item in list" :key="item.email" v-bind="item" showTick :style="optionStyle" :value="item.name">
            <Avatar alt="" size="small" :src="item.avatar" />
            <div style="margin-left: 8px">
                <div style="font-size: 14px">{{ item.name }}</div>
                <div style="color: var(--color-text-2); font-size: 12px; line-height: 16px; font-weight: normal">
                    {{ item.email }}
                </div>
            </div>
        </Select.Option>
    </Select>
    <Select aria-label="多选圆形头像" :defaultValue="['申悦', '曲晨一']" :maxTagCount="2" multiple placeholder="请选择" style="width: 280px; margin-top: 20px" @change="onChange">
        <template #tag="{ option, onClose }">
            <Tag :avatarSrc="option.avatar" avatarShape="circle" closable size="large" @close="onClose">
                {{ option.name }}
            </Tag>
        </template>
        <Select.Option v-for="item in list" :key="item.email" v-bind="item" showTick :style="optionStyle" :value="item.name">
            <Avatar alt="" size="small" :src="item.avatar" />
            <div style="margin-left: 8px">
                <div style="font-size: 14px">{{ item.name }}</div>
                <div style="color: var(--color-text-2); font-size: 12px; line-height: 16px; font-weight: normal">
                    {{ item.email }}
                </div>
            </div>
        </Select.Option>
    </Select>
    <Select aria-label="多选方形头像" :defaultValue="['申悦', '曲晨一']" :maxTagCount="2" multiple placeholder="请选择" style="width: 280px; margin-top: 20px" @change="onChange">
        <template #tag="{ option, onClose }">
            <Tag :avatarSrc="option.avatar" avatarShape="square" closable size="large" @close="onClose">
                {{ option.name }}
            </Tag>
        </template>
        <Select.Option v-for="item in list" :key="item.email" v-bind="item" showTick :style="optionStyle" :value="item.name">
            <Avatar alt="" size="small" :src="item.avatar" />
            <div style="margin-left: 8px">
                <div style="font-size: 14px">{{ item.name }}</div>
                <div style="color: var(--color-text-2); font-size: 12px; line-height: 16px; font-weight: normal">
                    {{ item.email }}
                </div>
            </div>
        </Select.Option>
    </Select>
</template>

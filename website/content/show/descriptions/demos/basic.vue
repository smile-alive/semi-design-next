<script setup lang="ts">
    import { IconArrowUp } from '@fibrae/semi-icons-vue';
    import { Descriptions, Tag } from '@fibrae/semi-ui-vue';

    const data = [
        { key: '实际用户数量', value: '1,480,000' },
        { key: '7天留存', value: '98%' },
        { key: '安全等级', value: '3级' },
        { key: '垂类标签', value: '电商' },
        { key: '认证状态', value: '未认证' },
    ];
</script>

<template>
    <Descriptions :data="data">
        <template #value="{ item, index }">
            <div v-if="index === 1">
                98%
                <IconArrowUp size="small" :style="{ color: 'var(--semi-color-success)', marginLeft: '2px' }" />
            </div>
            <Tag v-else-if="index === 3" :style="{ margin: 0 }">电商</Tag>
            <template v-else>{{ item.value }}</template>
        </template>
    </Descriptions>
</template>

<script setup lang="ts">
    import { Card, Descriptions, Tag } from '@fibrae/semi-ui-vue';

    const data = [
        { key: '实际用户数量', value: '1,480,000' },
        { key: '7天留存', value: '98%' },
        { key: '安全等级', value: '3级' },
        { key: '垂类标签', value: '电商' },
        { key: '认证状态', value: '未认证' },
    ];
    const aligns = ['center', 'justify', 'left', 'plain'] as const;
</script>

<template>
    <div :style="{ display: 'flex', flexWrap: 'wrap' }">
        <Card v-for="align in aligns" :key="align" shadows="always" :style="{ margin: '10px' }">
            <Descriptions :align="align" :data="data">
                <template #value="{ item, index }">
                    <Tag v-if="index === 3" :style="{ margin: 0 }">电商</Tag>
                    <template v-else>{{ item.value }}</template>
                </template>
            </Descriptions>
        </Card>
    </div>
</template>

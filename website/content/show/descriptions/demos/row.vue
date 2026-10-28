<script setup lang="ts">
    import { IconArrowUp } from '@fibrae/semi-icons-vue';
    import { Descriptions } from '@fibrae/semi-ui-vue';

    const data = [
        { key: '实际用户数量', value: '1,480,000' },
        { key: '7天留存', value: '98%' },
        { key: '安全等级', value: '3级' },
    ];
    const style = {
        boxShadow: 'var(--semi-shadow-elevated)',
        backgroundColor: 'var(--semi-color-bg-2)',
        borderRadius: '4px',
        padding: '10px',
        marginRight: '20px',
        width: '600px',
    };
</script>

<template>
    <div>
        <template v-for="size in ['small', 'medium', 'large'] as const" :key="size">
            <Descriptions :data="data" row :size="size" :style="style">
                <template #value="{ item, index }">
                    <span v-if="index === 1">
                        98%
                        <IconArrowUp size="small" :style="{ color: 'red', marginLeft: '4px' }" />
                    </span>
                    <template v-else>{{ item.value }}</template>
                </template>
            </Descriptions>
            <br v-if="size !== 'large'" />
        </template>
    </div>
</template>

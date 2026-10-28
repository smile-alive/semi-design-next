<script setup lang="ts">
    import { Descriptions } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Descriptions>
        <Descriptions.Item>
            <template #itemKey>实际用户数量</template>
            1,480,000
        </Descriptions.Item>
        <Descriptions.Item>
            <template #itemKey>7天留存</template>
            98%
        </Descriptions.Item>
        <Descriptions.Item>
            <template #itemKey>安全等级</template>
            3级
        </Descriptions.Item>
        <Descriptions.Item>
            <template #itemKey>垂类标签</template>
            电商
        </Descriptions.Item>
        <Descriptions.Item>
            <template #itemKey>认证状态</template>
            未认证
        </Descriptions.Item>
    </Descriptions>
</template>

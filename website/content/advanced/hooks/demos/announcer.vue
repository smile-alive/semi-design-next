<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Space, Typography } from '@fibrae/semi-ui-vue';
    import { useAnnouncer } from '@fibrae/semi-ui-vue/composables';

    const count = ref(0);
    const announce = useAnnouncer();

    const add = () => {
        count.value += 1;
        announce(`已加入购物车，共 ${count.value} 件`);
    };
</script>

<template>
    <Space spacing="loose">
        <Button @click="add">加入购物车</Button>
        <Typography.Text>购物车：{{ count }} 件</Typography.Text>
    </Space>
</template>

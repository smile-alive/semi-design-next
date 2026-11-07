<script setup lang="ts">
    import Button from '../../../button';
    import Popconfirm from '../../popconfirm.vue';

    defineProps<{ withTitle: boolean }>();
</script>

<template>
    <Popconfirm defaultVisible :motion="false" @confirm="async () => {}">
        <Button>Save</Button>
        <template v-if="withTitle" #title>确定是否要保存此修改？</template>
        <template #content>此修改将不可逆</template>
    </Popconfirm>
</template>

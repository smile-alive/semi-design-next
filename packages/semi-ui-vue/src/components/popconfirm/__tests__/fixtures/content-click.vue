<script setup lang="ts">
    import Button from '../../../button';
    import Popconfirm from '../../popconfirm.vue';

    defineProps<{ onContentClick: () => void }>();
</script>

<template>
    <Popconfirm :okButtonProps="{ autoFocus: true, class: 'test-ok' }">
        <Button>trigger</Button>
        <template #title>确定是否要保存此修改？</template>
        <template #content>
            <div class="test-text" @click="onContentClick">此修改将不可逆</div>
        </template>
    </Popconfirm>
</template>

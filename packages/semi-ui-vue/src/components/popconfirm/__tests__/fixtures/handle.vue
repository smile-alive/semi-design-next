<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import Button from '../../../button';
    import type { PopconfirmHandle } from '../../interface';
    import Popconfirm from '../../popconfirm.vue';

    defineProps<{ disabled?: boolean }>();
    const popconfirm = useTemplateRef<PopconfirmHandle>('popconfirm');
</script>

<template>
    <Popconfirm ref="popconfirm" :disabled="disabled" :motion="false">
        <Button>Save</Button>
        <template #title>Delete?</template>
    </Popconfirm>
    <button type="button" @click="popconfirm?.focusTrigger()">focus</button>
</template>

<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import type { PopconfirmHandle } from '../../interface';
    import Popconfirm from '../../popconfirm.vue';

    const props = defineProps<{ disabled?: boolean }>();
    const popconfirm = useTemplateRef<PopconfirmHandle>('popconfirm');
</script>

<template>
    <Popconfirm ref="popconfirm" :disabled="props.disabled" :motion="false">
        <Button>Save</Button>
        <template #title>Delete?</template>
    </Popconfirm>
    <button type="button" @click="popconfirm?.focusTrigger()">focus</button>
</template>

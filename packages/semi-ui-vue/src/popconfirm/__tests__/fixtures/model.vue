<script setup lang="ts">
    import { ref } from 'vue';
    import Button from '../../../button';
    import Popconfirm from '../../popconfirm.vue';

    const props = withDefaults(defineProps<{ trigger?: 'click' | 'custom' }>(), { trigger: 'click' });
    const visible = ref(false);
    const toggle = () => {
        if (props.trigger === 'custom') visible.value = !visible.value;
    };
</script>

<template>
    <Popconfirm v-model:visible="visible" :motion="false" :trigger="trigger">
        <Button @click="toggle">trigger</Button>
        <template #title>Delete?</template>
    </Popconfirm>
    <output aria-label="visible">{{ visible }}</output>
</template>

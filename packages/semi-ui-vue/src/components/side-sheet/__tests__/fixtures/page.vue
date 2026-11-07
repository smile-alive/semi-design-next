<script setup lang="ts">
    import { ref } from 'vue';
    import Button from '../../../button';
    import SideSheet from '../../side-sheet.vue';

    withDefaults(defineProps<{ mask?: boolean }>(), { mask: true });
    const visible = ref(false);
</script>

<template>
    <Button @click="visible = true">Open</Button>
    <Button>Page</Button>
    <SideSheet v-model:visible="visible" closeOnEsc :mask="mask" :motion="false" title="Sheet">
        <Button>Inside</Button>
    </SideSheet>
    <output aria-label="visible">{{ visible }}</output>
</template>

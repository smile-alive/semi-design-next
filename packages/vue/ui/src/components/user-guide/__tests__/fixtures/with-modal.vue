<script setup lang="ts">
    import Modal from '@fibrae/semi-ui-vue/modal/index';
    import type { UserGuideStepItem } from '../../interface';
    import UserGuide from '../../user-guide.vue';

    defineProps<{ steps: UserGuideStepItem[]; guide: boolean; modal: boolean }>();
</script>

<template>
    <UserGuide :steps="steps" :visible="guide" />
    <Modal :motion="false" title="Dialog" :visible="modal" />
</template>

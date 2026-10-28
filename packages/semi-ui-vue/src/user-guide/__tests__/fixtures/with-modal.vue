<script setup lang="ts">
    import Modal from '../../../modal';
    import type { UserGuideStepItem } from '../../interface';
    import UserGuide from '../../user-guide.vue';

    defineProps<{ steps: UserGuideStepItem[]; guide: boolean; modal: boolean }>();
</script>

<template>
    <UserGuide :steps="steps" :visible="guide" />
    <Modal :motion="false" title="Dialog" :visible="modal" />
</template>

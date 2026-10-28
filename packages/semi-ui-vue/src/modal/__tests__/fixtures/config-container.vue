<script setup lang="ts">
    import ConfigProvider from '../../../config-provider';
    import Modal from '../../modal.vue';

    const container = () => document.querySelector<HTMLElement>('.config-container') as HTMLElement;
</script>

<template>
    <ConfigProvider :getPopupContainer="container">
        <div class="config-container" />
        <Modal :motion="false" title="Configured" visible>body</Modal>
    </ConfigProvider>
</template>

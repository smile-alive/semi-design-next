<script setup lang="ts">
    import ConfigProvider from '@fibrae/semi-ui-vue/config-provider/index';
    import Modal from '../../modal.vue';

    const container = () => document.querySelector<HTMLElement>('.config-container')!;
</script>

<template>
    <ConfigProvider :getPopupContainer="container">
        <div class="config-container" />
        <Modal :motion="false" title="Configured" visible>body</Modal>
    </ConfigProvider>
</template>

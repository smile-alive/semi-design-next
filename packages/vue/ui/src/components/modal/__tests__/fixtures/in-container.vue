<script setup lang="ts">
    import Modal from '../../modal.vue';

    // The container is in the same template, so it exists only once this tree has mounted.
    const container = () => document.querySelector<HTMLElement>('.modal-container') as HTMLElement;
</script>

<template>
    <div class="modal-container" :style="{ height: '320px', overflow: 'hidden', position: 'relative' }">
        <Modal :getPopupContainer="container" :motion="false" title="Contained" visible />
    </div>
</template>

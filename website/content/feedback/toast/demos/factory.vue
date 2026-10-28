<script setup lang="ts">
    import { onBeforeUnmount } from 'vue';
    import { Button, Toast, ToastFactory } from '@fibrae/semi-ui-vue';

    const ToastInCustomContainer = ToastFactory.create({
        getPopupContainer: () => document.getElementById('custom-toast-container') as HTMLElement,
    });
    onBeforeUnmount(() => ToastInCustomContainer.destroyAll());
</script>

<template>
    <div>
        <Button @click="Toast.info('Toast')">Default Toast</Button>
        <br />
        <br />
        <Button @click="ToastInCustomContainer.info('Toast in some container')">Toast in custom container</Button>
        <div id="custom-toast-container">custom container</div>
    </div>
</template>

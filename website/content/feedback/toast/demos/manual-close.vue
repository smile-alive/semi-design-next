<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Toast } from '@fibrae/semi-ui-vue';

    const toastId = ref<string | null>(null);

    function destroy() {
        toastId.value = null;
    }

    const opts = {
        content: 'Not auto close',
        duration: 0,
        onClose: destroy,
    };

    function show() {
        if (toastId.value) {
            return;
        }
        toastId.value = Toast.info(opts);
    }

    function hide() {
        if (toastId.value) {
            Toast.close(toastId.value);
        }
        destroy();
    }
</script>

<template>
    <Button type="primary" @click="show">Show Toast</Button>
    <br />
    <br />
    <Button type="primary" @click="hide">Hide Toast</Button>
</template>

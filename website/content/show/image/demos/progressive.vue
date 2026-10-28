<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Image } from '@fibrae/semi-ui-vue';

    const timestamp = ref('');
</script>

<template>
    <Image alt="Abstract colorful artwork" :height="200" :src="`/assets/root-web-sites/abstract-big.png?${timestamp}`" :width="300">
        <template #placeholder>
            <Image alt="" :height="200" :preview="false" src="/assets/root-web-sites/abstract-small.jpeg" :width="300" />
        </template>
    </Image>
    <br />
    <Button :style="{ marginTop: '10px' }" theme="solid" @click="timestamp = String(Date.now())">Reload</Button>
</template>

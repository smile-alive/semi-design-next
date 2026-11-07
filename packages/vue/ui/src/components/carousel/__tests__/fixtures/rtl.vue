<script setup lang="ts">
    import ConfigProvider from '@fibrae/semi-ui-vue/config-provider/index';
    import Carousel from '../..';
</script>

<template>
    <ConfigProvider direction="rtl">
        <Carousel :autoPlay="false">
            <div v-for="n in 3" :key="n">
                <h3>index{{ n - 1 }}</h3>
            </div>
        </Carousel>
    </ConfigProvider>
</template>

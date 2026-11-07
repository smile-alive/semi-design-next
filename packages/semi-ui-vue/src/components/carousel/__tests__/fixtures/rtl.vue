<script setup lang="ts">
    import Carousel from '../..';
    import ConfigProvider from '../../../config-provider';
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

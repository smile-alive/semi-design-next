<script setup lang="ts">
    import Banner from '../../banner.vue';

    defineProps<{ icon?: boolean; closeIcon?: boolean }>();
</script>

<template>
    <Banner type="danger">
        <template v-if="icon" #icon>
            <span data-testid="my-icon" />
        </template>
        <template v-if="closeIcon" #closeIcon>
            <span data-testid="my-close" />
        </template>
    </Banner>
</template>

<script setup lang="ts">
    import Banner from '../../banner.vue';

    const props = defineProps<{ icon?: boolean; closeIcon?: boolean }>();
</script>

<template>
    <Banner type="danger">
        <template v-if="props.icon" #icon>
            <span data-testid="my-icon" />
        </template>
        <template v-if="props.closeIcon" #closeIcon>
            <span data-testid="my-close" />
        </template>
    </Banner>
</template>

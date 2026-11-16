<script setup lang="ts">
    import Empty from '../../empty.vue';

    const props = defineProps<{ withDark?: boolean }>();
</script>

<template>
    <Empty>
        <template #image>
            <i data-testid="light" />
        </template>
        <template v-if="props.withDark" #darkModeImage>
            <i data-testid="dark" />
        </template>
    </Empty>
</template>

<script setup lang="ts">
    import Empty from '../../empty.vue';

    defineProps<{ withDark?: boolean }>();
</script>

<template>
    <Empty>
        <template #image>
            <i data-testid="light" />
        </template>
        <template v-if="withDark" #darkModeImage>
            <i data-testid="dark" />
        </template>
    </Empty>
</template>

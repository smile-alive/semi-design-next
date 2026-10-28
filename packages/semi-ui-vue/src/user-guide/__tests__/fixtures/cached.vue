<script setup lang="ts">
    import type { UserGuideProps } from '../../interface';
    import UserGuide from '../../user-guide.vue';

    defineProps<{ shown: boolean; guide: UserGuideProps }>();
    const emit = defineEmits<{ change: [current: number]; skip: []; 'update:visible': [visible: false] }>();
</script>

<template>
    <KeepAlive>
        <UserGuide v-if="shown" v-bind="guide" @change="emit('change', $event)" @skip="emit('skip')" @update:visible="emit('update:visible', $event)" />
        <p v-else>other</p>
    </KeepAlive>
</template>

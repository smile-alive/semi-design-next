<script setup lang="ts">
    import SideSheet from '../../side-sheet.vue';

    const props = defineProps<{ shown: boolean }>();
</script>

<template>
    <SideSheet :motion="false" visible>
        <template v-if="props.shown" #title>T</template>
        <template v-if="props.shown" #footer>F</template>
    </SideSheet>
</template>

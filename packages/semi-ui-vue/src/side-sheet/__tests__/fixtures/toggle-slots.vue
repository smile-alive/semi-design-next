<script setup lang="ts">
    import SideSheet from '../../side-sheet.vue';

    defineProps<{ shown: boolean }>();
</script>

<template>
    <SideSheet :motion="false" visible>
        <template v-if="shown" #title>T</template>
        <template v-if="shown" #footer>F</template>
    </SideSheet>
</template>

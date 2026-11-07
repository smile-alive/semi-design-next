<script setup lang="ts">
    import Tooltip from '../../tooltip.vue';
</script>

<template>
    <Tooltip closeOnEsc :motion="false" trigger="click">
        <button type="button">outer</button>
        <template #content>
            <Tooltip closeOnEsc :motion="false" trigger="click">
                <button type="button">inner</button>
                <template #content>
                    <button type="button">action</button>
                </template>
            </Tooltip>
        </template>
    </Tooltip>
</template>

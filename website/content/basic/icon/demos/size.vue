<script setup lang="ts">
    import { IconAlertCircle, IconHelpCircle, IconMinusCircle, IconPlus, IconPlusCircle, IconRefresh, IconSearch, type IconSize } from '@fibrae/semi-icons-vue';

    const icons = [IconSearch, IconHelpCircle, IconAlertCircle, IconMinusCircle, IconPlusCircle, IconPlus, IconRefresh];
    const sizes: IconSize[] = ['extra-small', 'small', 'default', 'large', 'extra-large'];
</script>

<template>
    <div v-for="(icon, index) in icons" :key="index" style="margin-block-end: 4px">
        <component :is="icon" v-for="size in sizes" :key="size" :size="size" />
    </div>
</template>

<script setup lang="ts">
    import { Avatar } from '@fibrae/semi-ui-vue';

    const src = '/assets/placeholder/avatar-a.svg';
</script>

<template>
    <div>
        <Avatar alt="漂亮的猫咪" :src="src" :style="{ margin: '4px' }" />
        <Avatar alt="可爱的猫咪" size="small" :src="src" :style="{ margin: '4px' }" />
    </div>
</template>

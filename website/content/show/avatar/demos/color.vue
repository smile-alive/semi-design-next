<script setup lang="ts">
    import { Avatar } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Avatar alt="Alice Swift" :style="{ margin: '4px' }">AS</Avatar>
        <Avatar alt="Bob Matteo" color="red" :style="{ margin: '4px' }">BM</Avatar>
        <Avatar alt="Taylor Joy" color="light-blue" :style="{ margin: '4px' }">TJ</Avatar>
        <Avatar alt="Zank Lance" :style="{ color: '#f56a00', backgroundColor: '#fde3cf', margin: '4px' }">ZL</Avatar>
        <Avatar alt="Youself Zhang" :style="{ backgroundColor: '#87d068', margin: '4px' }">YZ</Avatar>
    </div>
</template>

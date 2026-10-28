<script setup lang="ts">
    import { Avatar, AvatarGroup } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <AvatarGroup>
            <Avatar alt="Lisa LeBlanc" color="red">LL</Avatar>
            <Avatar alt="Caroline Xiao">CX</Avatar>
            <Avatar alt="Rafal Matin" color="amber">RM</Avatar>
            <Avatar alt="Zank Lance" :style="{ color: '#f56a00', backgroundColor: '#fde3cf' }">ZL</Avatar>
            <Avatar alt="Youself Zhang" :style="{ backgroundColor: '#87d068' }">YZ</Avatar>
        </AvatarGroup>
    </div>
</template>

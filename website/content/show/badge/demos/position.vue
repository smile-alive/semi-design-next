<script setup lang="ts">
    import { Avatar, Badge } from '@fibrae/semi-ui-vue';

    const style = {
        width: '42px',
        height: '42px',
        borderRadius: '4px',
    };
</script>

<template>
    <div>
        <Badge count="VIP" position="rightTop" type="danger">
            <Avatar color="amber" shape="square" :style="style">ZH</Avatar>
        </Badge>
        <br />
        <br />
        <Badge count="VIP" position="rightBottom" type="danger">
            <Avatar color="amber" shape="square" :style="style">HS</Avatar>
        </Badge>
        <br />
        <br />
        <Badge count="VIP" position="leftTop" type="danger">
            <Avatar color="orange" shape="square" :style="style">DY</Avatar>
        </Badge>
        <br />
        <br />
        <Badge count="VIP" position="leftBottom" type="danger">
            <Avatar color="orange" shape="square" :style="style">TT</Avatar>
        </Badge>
    </div>
</template>

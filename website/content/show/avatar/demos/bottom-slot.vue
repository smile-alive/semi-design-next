<script setup lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-vue';
    import { Avatar } from '@fibrae/semi-ui-vue';

    const sizes = ['medium', 'large', 'extra-large'];
</script>

<template>
    <div>
        <Avatar v-for="size in sizes" :key="size" :bottomSlot="{ shape: 'square', bgColor: '#FE2C55' }" color="amber" :size="size">
            T
            <template #bottomSlotText>直播中</template>
        </Avatar>
        <br /><br /><br />
        <Avatar v-for="size in sizes" :key="`plus-${size}`" :bottomSlot="{ shape: 'circle', bgColor: '#FE2C55' }" color="amber" :size="size">
            T
            <template #bottomSlotText>
                <IconPlus />
            </template>
        </Avatar>
    </div>
</template>

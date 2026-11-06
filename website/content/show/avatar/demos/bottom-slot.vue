<script setup lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-vue';
    import { Avatar } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Avatar :bottomSlot="{ shape: 'square', bgColor: '#FE2C55' }" color="amber">
            T
            <template #bottomSlotText>直播中</template>
        </Avatar>

        <Avatar :bottomSlot="{ shape: 'square', bgColor: '#FE2C55' }" color="amber" size="large">
            T
            <template #bottomSlotText>直播中</template>
        </Avatar>

        <Avatar :bottomSlot="{ shape: 'square', bgColor: '#FE2C55' }" color="amber" size="extra-large">
            T
            <template #bottomSlotText>直播中</template>
        </Avatar>
        <br />
        <br />
        <br />
        <Avatar :bottomSlot="{ shape: 'circle', bgColor: '#FE2C55' }" color="amber">
            T
            <template #bottomSlotText>
                <IconPlus />
            </template>
        </Avatar>

        <Avatar :bottomSlot="{ shape: 'circle', bgColor: '#FE2C55' }" color="amber" size="large">
            T
            <template #bottomSlotText>
                <IconPlus />
            </template>
        </Avatar>

        <Avatar :bottomSlot="{ shape: 'circle', bgColor: '#FE2C55' }" color="amber" size="extra-large">
            T
            <template #bottomSlotText>
                <IconPlus />
            </template>
        </Avatar>
    </div>
</template>

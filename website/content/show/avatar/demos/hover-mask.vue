<script setup lang="ts">
    import { IconCamera } from '@fibrae/semi-icons-vue';
    import { Avatar } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Avatar alt="Bob Downton" color="red">
        BD
        <template #hoverMask>
            <div
                :style="{
                    backgroundColor: 'var(--semi-color-overlay-bg)',
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }"
            >
                <IconCamera />
            </div>
        </template>
    </Avatar>
</template>

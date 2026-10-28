<script setup lang="ts">
    import { IconFlag, IconLikeHeart, IconLock, IconUnlock } from '@fibrae/semi-icons-vue';
</script>

<template>
    <div>
        <div style="color: #e91e63">
            <IconLikeHeart size="extra-large" />
            <IconFlag size="extra-large" />
        </div>
        <br />
        <div>
            <IconLock size="extra-large" style="color: #6a3ac7" />
            <IconUnlock size="extra-large" style="color: #9c27b0" />
        </div>
    </div>
</template>

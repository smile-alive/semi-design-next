<script setup lang="ts">
    import { IconLikeHeart } from '@fibrae/semi-icons-vue';
    import { Rating } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Rating :defaultValue="3" :style="{ color: 'red' }">
            <template #character>
                <IconLikeHeart size="extra-large" />
            </template>
        </Rating>
        <br />
        <br />
        <Rating allowHalf :defaultValue="3" :size="48" :style="{ color: 'red' }">
            <template #character>
                <IconLikeHeart :style="{ fontSize: '48px' }" />
            </template>
        </Rating>
        <br />
        <br />
        <Rating :defaultValue="3" :size="18">
            <template #character>赞</template>
        </Rating>
        <br />
        <br />
        <Rating :count="10" :defaultValue="6" />
    </div>
</template>

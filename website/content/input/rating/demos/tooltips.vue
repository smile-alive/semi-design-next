<script setup lang="ts">
    import { ref } from 'vue';
    import { Rating } from '@fibrae/semi-ui-vue';

    const value = ref(0);
    const desc = ['极差', '较差', '一般', '满意', '非常满意'];
</script>

<template>
    <div>
        <span>
            你对获得的帮助是否满意：
            <span v-if="value">{{ desc[value - 1] }}</span>
        </span>
        <br />
        <Rating v-model="value" :tooltips="desc" />
    </div>
</template>

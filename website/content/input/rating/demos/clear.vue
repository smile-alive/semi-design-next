<script setup lang="ts">
    import { Rating } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <span>允许再次点击清除</span>
        <br />
        <Rating allowClear :defaultValue="3" />
        <br />
        <br />
        <span>禁止再次点击清除</span>
        <br />
        <Rating :allowClear="false" :defaultValue="3" />
    </div>
</template>

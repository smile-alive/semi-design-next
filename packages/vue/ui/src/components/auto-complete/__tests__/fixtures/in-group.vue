<script setup lang="ts">
    import { InputGroup } from '@fibrae/semi-ui-vue/input/index';
    import AutoComplete from '../..';
</script>

<template>
    <InputGroup disabled size="large">
        <AutoComplete aria-label="city" :data="['semi']" :motion="false" />
    </InputGroup>
</template>

<script setup lang="ts">
    import AutoComplete from '../..';
    import { InputGroup } from '../../../input';
</script>

<template>
    <InputGroup disabled size="large">
        <AutoComplete aria-label="city" :data="['semi']" :motion="false" />
    </InputGroup>
</template>

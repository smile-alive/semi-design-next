<script setup lang="ts">
    import Select from '../..';

    const list = [
        { value: 'a', label: 'Apple' },
        { value: 'b', label: 'Banana' },
    ];
</script>

<template>
    <Select aria-label="水果" changeWithObject :defaultValue="list[0]" :motion="false" :optionList="list" />
</template>

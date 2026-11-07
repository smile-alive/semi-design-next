<script setup lang="ts">
    import Checkbox from '../..';
</script>

<template>
    <Checkbox>
        accept <a href="#terms" @click.prevent>terms</a> <button type="button">more</button>
        <template #extra>
            <a href="#extra" @click.prevent>extra link</a>
        </template>
    </Checkbox>
</template>

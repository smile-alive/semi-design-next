<script setup lang="ts">
    const types = [
        ['primary', '主要'],
        ['secondary', '次要'],
        ['tertiary', '第三'],
        ['warning', '警告'],
        ['danger', '危险'],
    ];
</script>

<template>
    <article>
        <strong v-for="[type, label] in types" :key="type" :style="{ color: `var(--semi-color-${type})`, marginRight: '10px' }">
            {{ label }}
        </strong>
    </article>
</template>

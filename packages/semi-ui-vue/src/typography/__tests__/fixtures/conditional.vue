<script setup lang="ts">
    import Paragraph from '../../paragraph.vue';
    import Text from '../../text.vue';

    const done = false;
    const rest = 'cdefghijklmnopqrstuvwxyz';
</script>

<template>
    <Text copyable>Bob<template v-if="done">!</template></Text>
    <Paragraph :ellipsis="{ expandable: true, expandText: 'EX' }" :style="{ lineHeight: '20px' }"> ab<template v-if="done">!</template>{{ rest }} </Paragraph>
</template>

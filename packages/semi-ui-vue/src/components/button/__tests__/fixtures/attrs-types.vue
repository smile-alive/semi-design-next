<script setup lang="ts">
    import Button from '../../index';

    const emit = defineEmits<{ click: [event: MouseEvent] }>();
</script>

<template>
    <Button id="x" aria-label="a" data-foo="1" @click="emit('click', $event)">typed</Button>
    <!-- Type-only check; never rendered, so the test's single-button queries stay valid. -->
    <template v-if="false">
        <!-- @vue-expect-error disabled is boolean -->
        <Button :disabled="123">bad</Button>
    </template>
</template>

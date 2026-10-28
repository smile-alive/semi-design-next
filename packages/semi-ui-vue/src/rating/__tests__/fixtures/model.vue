<script setup lang="ts">
    import { ref } from 'vue';
    import Rating from '../..';

    const props = withDefaults(defineProps<{ initial?: number; tooltips?: string[] }>(), {
        initial: 0,
        tooltips: undefined,
    });
    const emit = defineEmits<{ change: [value: number] }>();
    const value = ref(props.initial);
    const desc = ['terrible', 'bad', 'normal', 'good', 'wonderful'];
</script>

<template>
    <div>
        <span>
            How was the help you received:
            <span v-if="value" id="rating-result">{{ desc[value - 1] }}</span>
        </span>
        <Rating v-model="value" :tooltips="props.tooltips" @change="emit('change', $event)" />
        <output aria-label="value">{{ value }}</output>
    </div>
</template>

<script setup lang="ts">
    import { onUpdated, watch } from 'vue';
    import useFoundation from '../../use-foundation';
    import FixtureFoundation, { type Adapter, type Props, type State } from './foundation';

    const props = withDefaults(
        defineProps<{
            modelValue?: string;
            suffix?: string;
            identity: object;
        }>(),
        { modelValue: undefined, suffix: 'default' }
    );
    const emit = defineEmits<{ notify: [value: string] }>();
    const { foundation, state } = useFoundation<FixtureFoundation, Adapter, Props, State>(
        FixtureFoundation,
        props,
        (view) => ({ value: view.value ?? 'empty', identity: props.identity }),
        () => ({ notify: (value) => emit('notify', value) }),
        { props: { value: () => props.modelValue } }
    );
    watch(state, () => emit('notify', 'watch'), { flush: 'post' });
    onUpdated(() => emit('notify', 'updated'));
</script>

<template>
    <button data-host :data-suffix="suffix" @click="foundation.update()">{{ state.value }}</button>
    <button @click="foundation.repeat()">重复</button>
    <output aria-label="对象身份">{{ state.identity === identity ? 'same' : 'different' }}</output>
</template>

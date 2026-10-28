<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { splitControlAttrs } from '../../control-attrs';
    import useClickOutside from '../../use-click-outside';
    import useDidUpdate from '../../use-did-update';
    import useEventListener from '../../use-event-listener';
    import useResizeObserver from '../../use-resize-observer';

    defineOptions({ inheritAttrs: false });
    const props = withDefaults(defineProps<{ enabled?: boolean; value?: string }>(), { enabled: true, value: 'a' });
    const emit = defineEmits<{ event: [name: string] }>();
    const target = useTemplateRef('target');
    useEventListener(target, 'click', () => emit('event', props.value), { enabled: () => props.enabled });
    useClickOutside(
        [target],
        () => emit('event', 'outside'),
        () => props.enabled
    );
    useResizeObserver(target, () => emit('event', 'resize'));
    useDidUpdate(
        () => props.value,
        (next, previous) => emit('event', `${previous}:${next}:${target.value?.textContent}`),
        (a, b) => a.toLowerCase() === b.toLowerCase()
    );
    const isControlKey = (key: string) => key.startsWith('aria-') || key === 'id';
</script>

<template>
    <div v-bind="splitControlAttrs($attrs, isControlKey).root">
        <button ref="target" v-bind="splitControlAttrs($attrs, isControlKey).control">{{ value }}</button>
    </div>
</template>

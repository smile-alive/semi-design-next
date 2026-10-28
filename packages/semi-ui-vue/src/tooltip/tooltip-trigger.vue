<script setup lang="ts">
    import { computed, type ComponentPublicInstance } from 'vue';
    import type { KeyedNode } from '../_base/slot-nodes';
    import { provideTooltipDescription } from './context';
    import type { TooltipProps } from './interface';
    import bindTrigger from './trigger';

    defineOptions({ inheritAttrs: false });

    const props = defineProps<{
        nodes: KeyedNode[];
        options: TooltipProps;
        popupId: string;
        visible: boolean;
        inserted: boolean;
        keydown?: EventListener;
    }>();

    const emit = defineEmits<{ element: [element: Element | null] }>();

    let reference: Element | ComponentPublicInstance | null = null;

    const binding = computed(() =>
        bindTrigger(
            props.nodes.map(([node]) => node),
            props.options,
            props.popupId,
            { visible: props.visible, inserted: props.inserted },
            props.keydown
        )
    );

    // Always provided, so an outer Tooltip's id does not reach this trigger's subtree.
    provideTooltipDescription(
        computed(() => {
            const node = props.nodes.length === 1 ? props.nodes[0][0] : undefined;
            return props.options.role === 'tooltip' && props.inserted && node?.props?.['aria-describedby'] === null ? props.popupId : undefined;
        })
    );

    const report = () => {
        let node: Node | null = reference instanceof Element ? reference : (reference?.$el ?? null);
        // A fragment-rooted child (e.g. a nested Tooltip) exposes its start anchor as $el; F1 anchors to its first element
        while (node && !(node instanceof Element)) node = node.nextSibling;
        emit('element', node);
    };

    const setReference = (value: Element | ComponentPublicInstance | null) => {
        reference = value;
        report();
    };
</script>

<template>
    <span v-if="binding.wrapped" :ref="setReference" v-bind="binding.wrapperAttrs">
        <component :is="node" v-for="[node, key] in props.nodes" :key="key" v-bind="binding.childAttrs" />
    </span>
    <!-- a child component can replace or restyle its root without re-rendering this trigger -->
    <component :is="props.nodes[0][0]" v-else :ref="setReference" v-bind="binding.childAttrs" @vue:updated="report" />
</template>

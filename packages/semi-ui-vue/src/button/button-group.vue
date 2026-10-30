<script setup lang="ts">
    import { type VNode, computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/button/constants';
    import { groupLineClass, inheritGroupLooks } from '@fibrae/semi-foundation/button/utils';
    import '@fibrae/semi-foundation/button/button.scss';
    import type { ElementProps } from '../_base/element-props';
    import elementType from '../_base/element-type';
    import { usePopupLayer } from '../_base/popup-layer';
    import { semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import slotNodes from '../_base/slot-nodes';
    import { useInputGroupInScope } from '../input/context';
    import { type ButtonGroupContext, provideButtonGroupContext, useButtonGroupContext } from './context';
    import type { ButtonGroupProps, ButtonGroupSlots } from './interface';
    import { resolveLooks } from './use-button';

    const props = withDefaults(defineProps<ButtonGroupProps & /* @vue-ignore */ ElementProps<'div', keyof ButtonGroupProps>>(), {
        colorful: semiGlobalDefault('ButtonGroup', 'colorful'),
        disabled: semiGlobalDefault('ButtonGroup', 'disabled'),
        size: semiGlobalDefault('ButtonGroup', 'size'),
        theme: semiGlobalDefault('ButtonGroup', 'theme'),
        type: semiGlobalDefault('ButtonGroup', 'type'),
    });

    const slots = defineSlots<ButtonGroupSlots>();

    const semi = useSemiGlobal();
    const layer = usePopupLayer();
    const outer = useButtonGroupContext();

    const inputGroup = useInputGroupInScope();

    const prefix = cssClasses.PREFIX;

    // A nested group inherits the outer one, and the InputGroup comes last of the groups.
    const context = computed<ButtonGroupContext>(() => ({
        ...inheritGroupLooks(inheritGroupLooks(props, outer && outer.value.layer === layer ? outer.value : undefined), inputGroup?.value),
        layer,
    }));

    provideButtonGroupContext(context);

    // Reads the button's effective looks so the line matches the rendered button.
    const lineClass = (node: VNode) => {
        const kind = elementType(node);
        if (kind !== 'Button' && kind !== 'IconButton') return undefined;
        return groupLineClass(prefix, resolveLooks(node.props ?? {}, context.value, semi, kind));
    };

    const items = () => {
        const nodes = slotNodes(slots.default?.() ?? []);
        return nodes.map(([node, key], index) => ({
            node,
            key,
            line: index < nodes.length - 1 ? lineClass(node) : undefined,
        }));
    };
</script>

<template>
    <div :class="`${prefix}-group`" role="group">
        <template v-for="item in items()" :key="item.key">
            <component :is="item.node" />
            <span v-if="item.line" :class="item.line" />
        </template>
    </div>
</template>

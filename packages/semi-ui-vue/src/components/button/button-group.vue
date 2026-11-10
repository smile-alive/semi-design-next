<script setup lang="ts">
    import { type VNode, computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/button/constants';
    import { groupLineClass, inheritGroupLooks } from '@fibrae/semi-foundation/components/button/utils';
    import '@fibrae/semi-foundation/components/button/button.scss';
    import type { ElementProps } from '../../base/element-props';
    import { usePopupLayer } from '../../base/popup-layer';
    import { readSemiDefault, useSemiGlobal } from '../../base/semi-default';
    import elementType from '../../utils/element-type';
    import slotNodes from '../../utils/slot-nodes';
    import { useInputGroupInScope } from '../input/context';
    import { type ButtonGroupContext, provideButtonGroupContext, useButtonGroupContext } from './context';
    import type { ButtonGroupProps, ButtonGroupSlots } from './interface';
    import { resolveLooks } from './use-button';

    // The global defaults are read in the context below, after an enclosing group
    const props = withDefaults(defineProps<ButtonGroupProps & /* @vue-ignore */ ElementProps<'div', keyof ButtonGroupProps>>(), {
        colorful: undefined,
        disabled: undefined,
        size: undefined,
        theme: undefined,
        type: undefined,
    });

    const slots = defineSlots<ButtonGroupSlots>();

    const semi = useSemiGlobal();
    const layer = usePopupLayer();
    const outer = useButtonGroupContext();

    const inputGroup = useInputGroupInScope();

    const prefix = cssClasses.PREFIX;

    // A nested group inherits the outer one, and the InputGroup comes last of the groups, followed by the global defaults.
    const context = computed<ButtonGroupContext>(() => ({
        ...inheritGroupLooks(inheritGroupLooks(inheritGroupLooks(props, outer && outer.value.layer === layer ? outer.value : undefined), inputGroup?.value), {
            colorful: readSemiDefault(semi, 'ButtonGroup', 'colorful'),
            disabled: readSemiDefault(semi, 'ButtonGroup', 'disabled'),
            size: readSemiDefault(semi, 'ButtonGroup', 'size'),
            theme: readSemiDefault(semi, 'ButtonGroup', 'theme'),
            type: readSemiDefault(semi, 'ButtonGroup', 'type'),
        }),
        layer,
    }));

    provideButtonGroupContext(context);

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

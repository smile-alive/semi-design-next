<script setup lang="ts">
    import { Text, computed, useAttrs, useId, type VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/input/constants';
    import '@fibrae/semi-foundation/input/input.scss';
    import { isNotClassOrStyle, splitControlAttrs } from '../_base/control-attrs';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import slotNodes from '../_base/slot-nodes';
    import FormLabel from '../form/label.vue';
    import useLocale from '../locale/use-locale';
    import type { InputGroupEmits, InputGroupProps, InputGroupSlots } from './interface';

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<InputGroupProps>(), {
        size: () => semiDefault('InputGroup', 'size', 'default'),
        disabled: semiGlobalDefault('InputGroup', 'disabled'),
        label: semiGlobalDefault('InputGroup', 'label'),
        labelPosition: semiGlobalDefault('InputGroup', 'labelPosition'),
    });

    const emit = defineEmits<InputGroupEmits>();
    const slots = defineSlots<InputGroupSlots>();
    const attrs = useAttrs();

    const locale = useLocale('Input');

    const id = useId();

    const prefix = cssClasses.PREFIX;
    const labelId = computed(() => props.label?.id ?? `${id}-label`);

    // the group span is not labelable, so `for` would point nowhere; aria-labelledby names it instead
    const labelProps = computed(() => ({ ...props.label, name: undefined, id: labelId.value }));
    const groupClass = computed(() => [`${prefix}-group`, { [`${prefix}-${props.size}`]: props.size !== 'default' }]);

    const hasLabel = () => Boolean(slots.label) || (props.label?.text !== undefined && props.label.text !== '');

    const childProps = (node: VNode) => {
        if (node.type === Text) return {};
        // a boolean shorthand reaches vnode props as ''
        const ownsDisabled = typeof node.props?.disabled === 'boolean' || node.props?.disabled === '';
        return {
            ...splitControlAttrs(attrs, isNotClassOrStyle).control,
            size: props.size,
            ...(!ownsDisabled && { disabled: props.disabled }),
        };
    };
</script>

<template>
    <div
        v-if="hasLabel()"
        :class="[
            `${prefix}-group-wrapper`,
            {
                [`${prefix}-group-wrapper-with-top-label`]: props.labelPosition === 'top',
                [`${prefix}-group-wrapper-with-left-label`]: props.labelPosition === 'left',
            },
        ]"
    >
        <FormLabel v-bind="labelProps">
            <template v-if="$slots.label" #default>
                <slot name="label" />
            </template>
            <template v-if="$slots.labelExtra" #extra>
                <slot name="labelExtra" />
            </template>
        </FormLabel>
        <span :id="props.label?.name || `${id}-group`" v-bind="splitControlAttrs($attrs, isNotClassOrStyle).root" :aria-labelledby="labelId" :class="groupClass" role="group" @focusin="emit('focus', $event)" @focusout="emit('blur', $event)">
            <component :is="node" v-for="[node, key] in slotNodes($slots.default?.() ?? [])" :key="key" v-bind="childProps(node)" />
        </span>
    </div>
    <span v-else v-bind="splitControlAttrs($attrs, isNotClassOrStyle).root" :aria-label="locale.locale.group" :class="groupClass" role="group" @focusin="emit('focus', $event)" @focusout="emit('blur', $event)">
        <component :is="node" v-for="[node, key] in slotNodes($slots.default?.() ?? [])" :key="key" v-bind="childProps(node)" />
    </span>
</template>

<script setup lang="ts">
    import { computed, useId } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/input/constants';
    import '@fibrae/semi-foundation/input/input.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { usePopupLayer } from '../_base/popup-layer';
    import { semiGlobalDefault } from '../_base/semi-default';
    import FormLabel from '../form/label.vue';
    import useLocale from '../locale/use-locale';
    import { type InputGroupContext, provideInputGroupContext } from './context';
    import type { InputGroupEmits, InputGroupProps, InputGroupSlots } from './interface';

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<InputGroupProps & /* @vue-ignore */ ElementProps<'span', keyof InputGroupProps | EmitHandlers<InputGroupEmits>>>(), {
        size: semiGlobalDefault('InputGroup', 'size'),
        disabled: semiGlobalDefault('InputGroup', 'disabled'),
        label: semiGlobalDefault('InputGroup', 'label'),
        labelPosition: semiGlobalDefault('InputGroup', 'labelPosition'),
    });

    const emit = defineEmits<InputGroupEmits>();
    const slots = defineSlots<InputGroupSlots>();

    const locale = useLocale('Input');
    const layer = usePopupLayer();

    const id = useId();

    const prefix = cssClasses.PREFIX;
    const labelId = computed(() => props.label?.id ?? `${id}-label`);

    // the group span is not labelable, so `for` would point nowhere; aria-labelledby names it instead
    const labelProps = computed(() => ({ ...props.label, name: undefined, id: labelId.value }));
    const groupClass = computed(() => [`${prefix}-group`, { [`${prefix}-${props.size}`]: props.size !== undefined && props.size !== 'default' }]);

    provideInputGroupContext(computed<InputGroupContext>(() => ({ size: props.size, disabled: props.disabled, layer })));

    const hasLabel = () => Boolean(slots.label) || (props.label?.text !== undefined && props.label.text !== '');
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
        <span :id="props.label?.name || `${id}-group`" :aria-labelledby="labelId" :class="groupClass" role="group" v-bind="$attrs" @focusin="emit('focus', $event)" @focusout="emit('blur', $event)">
            <slot />
        </span>
    </div>
    <span v-else :aria-label="locale.locale.group" :class="groupClass" role="group" v-bind="$attrs" @focusin="emit('focus', $event)" @focusout="emit('blur', $event)">
        <slot />
    </span>
</template>

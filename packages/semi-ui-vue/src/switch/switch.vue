<script setup lang="ts">
    import { computed, watch, type InputHTMLAttributes } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/switch/constants';
    import SwitchFoundation, { type SwitchAdapter, type SwitchState } from '@fibrae/semi-foundation/switch/foundation';
    import '@fibrae/semi-foundation/switch/switch.scss';
    import { hasAutofocus, vAutofocus } from '../_base/autofocus';
    import { isNativeInputKey, splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import Spin from '../spin';
    import type { SwitchEmits, SwitchProps, SwitchSlots } from './interface';

    interface FoundationProps extends SwitchProps {
        checked?: boolean;
    }

    type Foundation = SwitchFoundation<FoundationProps, SwitchState, Event>;
    type Adapter = SwitchAdapter<FoundationProps, SwitchState, Event>;

    defineOptions({ inheritAttrs: false });

    // name and autofocus reach the inner input, which the div's attributes do not cover
    const props = withDefaults(defineProps<SwitchProps & /* @vue-ignore */ ElementProps<'div', keyof SwitchProps | EmitHandlers<SwitchEmits>> & /* @vue-ignore */ Pick<InputHTMLAttributes, 'name' | 'autofocus'>>(), {
        modelValue: undefined,
        defaultChecked: semiGlobalDefault('Switch', 'defaultChecked'),
        disabled: () => semiDefault('Switch', 'disabled', false),
        loading: () => semiDefault('Switch', 'loading', false),
        size: () => semiDefault('Switch', 'size', 'default'),
    });

    const emit = defineEmits<SwitchEmits>();
    defineSlots<SwitchSlots>();

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, SwitchState>(
        SwitchFoundation,
        props,
        (view) => SwitchFoundation.getInitialState(view),
        (base) => ({
            setChecked: (checked) => base.setState({ checked }),
            notifyChange: (checked, event) => {
                emit('update:modelValue', checked);
                emit('change', checked, event);
            },
        }),
        { props: { checked: () => props.modelValue } }
    );

    const checked = computed(() => SwitchFoundation.deriveChecked({ checked: props.modelValue }, state.value));

    const handleChange = (event: Event) => {
        const input = event.target as HTMLInputElement;
        foundation.handleChange(input.checked, event);
        // Vue does not patch an unchanged controlled value after the browser toggles a checkbox.
        input.checked = checked.value;
    };

    watch(() => props.modelValue, foundation.setChecked);
</script>

<template>
    <div
        v-bind="splitControlAttrs($attrs, isNativeInputKey).root"
        :class="[
            cssClasses.PREFIX,
            {
                [cssClasses.CHECKED]: checked,
                [cssClasses.DISABLED]: props.disabled,
                [cssClasses.LARGE]: props.size === 'large',
                [cssClasses.SMALL]: props.size === 'small',
                [cssClasses.LOADING]: props.loading,
            },
        ]"
    >
        <Spin v-if="props.loading" :size="props.size === 'default' ? 'middle' : props.size" :wrapperClassName="cssClasses.LOADING_SPIN" />
        <div v-else aria-hidden="true" :class="cssClasses.KNOB" />
        <div v-if="$slots.checkedText && checked && props.size !== 'small'" :class="cssClasses.CHECKED_TEXT" x-semi-prop="checkedText">
            <slot name="checkedText" />
        </div>
        <div v-if="$slots.uncheckedText && !checked && props.size !== 'small'" :class="cssClasses.UNCHECKED_TEXT" x-semi-prop="uncheckedText">
            <slot name="uncheckedText" />
        </div>
        <input v-autofocus="hasAutofocus($attrs)" v-bind="splitControlAttrs($attrs, isNativeInputKey).control" :aria-disabled="props.loading || undefined" :checked="checked" :class="cssClasses.NATIVE_CONTROL" :disabled="props.disabled" role="switch" type="checkbox" @change="handleChange" />
    </div>
</template>

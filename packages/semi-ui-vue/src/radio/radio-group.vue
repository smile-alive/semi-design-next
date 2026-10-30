<script setup lang="ts">
    import { computed, nextTick, useId, watch } from 'vue';
    import { radioGroupClasses, strings } from '@fibrae/semi-foundation/radio/constants';
    import RadioGroupFoundation, { type RadioGroupAdapter } from '@fibrae/semi-foundation/radio/radio-group-foundation';
    import '@fibrae/semi-foundation/radio/radio.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import { provideRadioGroupContext, type RadioGroupContextView } from './context';
    import type { RadioChangeEvent, RadioGroupEmits, RadioGroupProps, RadioGroupSlots, RadioOptionItem, RadioValue } from './interface';
    import Radio from './radio.vue';

    interface FoundationProps extends RadioGroupProps {
        value?: RadioValue;
    }

    interface GroupState {
        value?: RadioValue;
    }

    type Foundation = RadioGroupFoundation<FoundationProps, GroupState>;
    type Adapter = RadioGroupAdapter<FoundationProps, GroupState>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<RadioGroupProps & /* @vue-ignore */ ElementProps<'div', keyof RadioGroupProps | EmitHandlers<RadioGroupEmits>>>(), {
        modelValue: undefined,
        defaultValue: semiGlobalDefault('RadioGroup', 'defaultValue'),
        disabled: () => semiDefault('RadioGroup', 'disabled', false),
        name: semiGlobalDefault('RadioGroup', 'name'),
        options: semiGlobalDefault('RadioGroup', 'options'),
        direction: () => semiDefault('RadioGroup', 'direction', 'horizontal'),
        mode: () => semiDefault('RadioGroup', 'mode', ''),
        type: () => semiDefault('RadioGroup', 'type', 'default'),
        buttonSize: () => semiDefault('RadioGroup', 'buttonSize', 'middle'),
        prefixCls: semiGlobalDefault('RadioGroup', 'prefixCls'),
    });

    const emit = defineEmits<RadioGroupEmits>();
    defineSlots<RadioGroupSlots>();

    // one name per group keeps arrow keys and form submission inside the group
    const generatedName = useId();
    const syncs = new Set<() => void>();

    // A radiogroup supports none of these; Tooltip injects them for a dialog trigger and tabindex adds a stray Tab stop.
    const DROPPED_ATTRS = new Set(['aria-expanded', 'aria-haspopup', 'aria-controls', 'tabindex', 'tabIndex']);

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, GroupState>(
        RadioGroupFoundation,
        props,
        (view) => ({ value: view.value === undefined ? view.defaultValue : view.value }),
        (base) => ({
            setValue: (value) => base.setState({ value }),
            notifyChange: (event) => {
                emit('update:modelValue', event.target.value as RadioValue | undefined);
                emit('change', event as RadioChangeEvent);
            },
        }),
        { props: { value: () => props.modelValue } }
    );

    const isButtonRadio = computed(() => props.type === strings.TYPE_BUTTON);
    const isPureCardRadio = computed(() => props.type === strings.TYPE_PURECARD);
    const isCardRadio = computed(() => props.type === strings.TYPE_CARD || isPureCardRadio.value);
    const prefix = computed(() => props.prefixCls || radioGroupClasses.PREFIX);
    const items = computed<RadioOptionItem[]>(() => (props.options ?? []).map((option) => (typeof option === 'string' ? { label: option, value: option } : option)));

    provideRadioGroupContext({
        view: computed<RadioGroupContextView>(() => ({
            value: props.modelValue === undefined ? state.value.value : props.modelValue,
            disabled: Boolean(props.disabled),
            name: props.name || generatedName,
            prefixCls: props.prefixCls,
            isButtonRadio: isButtonRadio.value,
            isCardRadio: isCardRadio.value,
            isPureCardRadio: isPureCardRadio.value,
            buttonSize: props.buttonSize,
            mode: props.mode,
        })),
        onChange: foundation.handleChange,
        register: (sync) => {
            syncs.add(sync);
            return () => void syncs.delete(sync);
        },
        sync: () => void nextTick(() => syncs.forEach((sync) => sync())),
    });

    const rootAttrs = (a: Record<string, unknown>) => Object.fromEntries(Object.entries(a).filter(([key]) => !DROPPED_ATTRS.has(key)));

    // Moving between the radios is not leaving the group: a form's blur validation waits until focus is outside.
    const handleFocusout = (event: FocusEvent) => {
        if (!(event.currentTarget as Element).contains(event.relatedTarget as Node | null)) {
            emit('blur', event);
        }
    };

    // Object.is treats NaN as unchanged, so a NaN value does not loop.
    watch(
        () => props.modelValue,
        (value) => foundation.handlePropValueChange(value as RadioValue)
    );
</script>

<template>
    <div
        v-bind="rootAttrs($attrs)"
        :class="[
            prefix,
            `${prefix}-wrapper`,
            {
                [`${prefix}-${props.direction}`]: props.direction && !isButtonRadio,
                [`${prefix}-${props.direction}-default`]: props.direction && props.type === 'default',
                [`${prefix}-${props.direction}-card`]: props.direction && isCardRadio,
                [`${prefix}-buttonRadio`]: isButtonRadio,
            },
        ]"
        role="radiogroup"
        @focusout="handleFocusout"
    >
        <template v-if="props.options">
            <Radio v-for="(option, index) in items" :key="index" :addonClassName="option.addonClass" :addonId="option.addonId" :addonStyle="option.addonStyle" :class="option.class" :disabled="option.disabled || props.disabled" :extraId="option.extraId" :style="option.style" :value="option.value">
                <template v-if="option.label !== undefined || $slots.label" #default>
                    <slot :index="index" name="label" :option="option">{{ option.label }}</slot>
                </template>
                <template v-if="option.extra !== undefined || $slots.extra" #extra>
                    <slot :index="index" name="extra" :option="option">{{ option.extra }}</slot>
                </template>
            </Radio>
        </template>
        <slot v-else />
    </div>
</template>

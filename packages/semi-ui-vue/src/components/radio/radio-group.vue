<script setup lang="ts" generic="T extends RadioValue = RadioValue">
    import { computed, nextTick, useId } from 'vue';
    import { radioGroupClasses, strings } from '@fibrae/semi-foundation/components/radio/constants';
    import RadioGroupFoundation, { type RadioGroupAdapter, type RadioGroupBaseState } from '@fibrae/semi-foundation/components/radio/radio-group-foundation';
    import '@fibrae/semi-foundation/components/radio/radio.scss';
    import { type ElementProps, type EmitHandlers, semiDefault, semiGlobalDefault, useFoundation } from '../../base/index';
    import { provideRadioGroupContext, type RadioGroupContextView } from './context';
    import type { RadioChangeEvent, RadioGroupEmits, RadioGroupProps, RadioGroupSlots, RadioOptionItem, RadioValue } from './interface';
    import Radio from './radio.vue';

    interface FoundationProps extends RadioGroupProps {
        value?: RadioValue;
    }

    type Foundation = RadioGroupFoundation<FoundationProps>;
    type Adapter = RadioGroupAdapter<FoundationProps>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<RadioGroupProps<T> & /* @vue-ignore */ ElementProps<'div', keyof RadioGroupProps | EmitHandlers<RadioGroupEmits>>>(), {
        modelValue: undefined,
        defaultValue: semiGlobalDefault('RadioGroup', 'defaultValue'),
        disabled: () => semiDefault('RadioGroup', 'disabled', false),
        name: semiGlobalDefault('RadioGroup', 'name'),
        options: semiGlobalDefault('RadioGroup', 'options'),
        direction: () => semiDefault('RadioGroup', 'direction', 'horizontal'),
        mode: () => semiDefault('RadioGroup', 'mode', ''),
        type: () => semiDefault('RadioGroup', 'type', 'default'),
        buttonSize: () => semiDefault('RadioGroup', 'buttonSize', 'middle'),
    });

    const emit = defineEmits<RadioGroupEmits<T>>();
    defineSlots<RadioGroupSlots>();

    // one name per group keeps arrow keys and form submission inside the group
    const generatedName = useId();
    const syncs = new Set<() => void>();

    // A radiogroup supports none of these; Tooltip injects them for a dialog trigger and tabindex adds a stray Tab stop.
    const DROPPED_ATTRS = new Set(['aria-expanded', 'aria-haspopup', 'aria-controls', 'tabindex', 'tabIndex']);

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, RadioGroupBaseState>(
        RadioGroupFoundation,
        props,
        (view) => RadioGroupFoundation.getInitialState(view),
        () => ({
            notifyChange: (event) => {
                emit('update:modelValue', event.target.value as T | undefined);
                emit('change', event as RadioChangeEvent);
            },
            notifyBlur: (event) => emit('blur', event),
        }),
        { props: { value: () => props.modelValue } }
    );

    const isButtonRadio = computed(() => props.type === strings.TYPE_BUTTON);
    const isPureCardRadio = computed(() => props.type === strings.TYPE_PURECARD);
    const isCardRadio = computed(() => props.type === strings.TYPE_CARD || isPureCardRadio.value);
    const prefix = radioGroupClasses.PREFIX;
    const items = computed<RadioOptionItem[]>(() => (props.options ?? []).map((option) => (typeof option === 'string' ? { label: option, value: option } : option)));

    provideRadioGroupContext({
        view: computed<RadioGroupContextView>(() => ({
            value: RadioGroupFoundation.deriveValue({ value: props.modelValue }, state.value),
            disabled: Boolean(props.disabled),
            name: props.name || generatedName,
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
        @focusout="foundation.handleBlur"
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

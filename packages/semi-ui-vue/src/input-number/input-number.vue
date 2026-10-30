<script setup lang="ts">
    import { computed, useAttrs, useTemplateRef, watch } from 'vue';
    import { cssClasses, numbers } from '@fibrae/semi-foundation/input-number/constants';
    import InputNumberFoundation, { reachesBound, type InputNumberAdapter } from '@fibrae/semi-foundation/input-number/foundation';
    import '@fibrae/semi-foundation/input-number/input-number.scss';
    import { isNotClassOrStyle, splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import Input, { type InputHandle } from '../input';
    import { provideInputGroupContext } from '../input/context';
    import useGroupLooks from '../input/use-group-looks';
    import useLocale from '../locale/use-locale';
    import type { InputNumberEmits, InputNumberHandle, InputNumberProps, InputNumberSlots, InputNumberState } from './interface';
    import StepButtons from './step-buttons.vue';

    interface FoundationProps extends InputNumberProps {
        value?: number | string;
    }

    type Foundation = InputNumberFoundation<FoundationProps, InputNumberState, FocusEvent, KeyboardEvent>;
    type Adapter = InputNumberAdapter<FoundationProps, InputNumberState, FocusEvent, KeyboardEvent>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<InputNumberProps & /* @vue-ignore */ ElementProps<'input', keyof InputNumberProps | EmitHandlers<InputNumberEmits> | 'value'>>(), {
        modelValue: undefined,
        defaultValue: semiGlobalDefault('InputNumber', 'defaultValue'),
        currency: semiGlobalDefault('InputNumber', 'currency'),
        currencyDisplay: semiGlobalDefault('InputNumber', 'currencyDisplay'),
        defaultCurrency: semiGlobalDefault('InputNumber', 'defaultCurrency'),
        localeCode: semiGlobalDefault('InputNumber', 'localeCode'),
        minimumFractionDigits: semiGlobalDefault('InputNumber', 'minimumFractionDigits'),
        maximumFractionDigits: semiGlobalDefault('InputNumber', 'maximumFractionDigits'),
        precision: semiGlobalDefault('InputNumber', 'precision'),
        scientificNotation: semiGlobalDefault('InputNumber', 'scientificNotation'),
        showCurrencySymbol: () => semiDefault('InputNumber', 'showCurrencySymbol', true),
        formatter: undefined,
        parser: undefined,
        min: () => semiDefault('InputNumber', 'min', -Infinity),
        max: () => semiDefault('InputNumber', 'max', Infinity),
        step: () => semiDefault('InputNumber', 'step', numbers.DEFAULT_STEP),
        shiftStep: () => semiDefault('InputNumber', 'shiftStep', numbers.DEFAULT_SHIFT_STEP),
        pressInterval: () => semiDefault('InputNumber', 'pressInterval', numbers.DEFAULT_PRESS_TIMEOUT),
        pressTimeout: () => semiDefault('InputNumber', 'pressTimeout', numbers.DEFAULT_PRESS_TIMEOUT),
        keepFocus: () => semiDefault('InputNumber', 'keepFocus', false),
        innerButtons: () => semiDefault('InputNumber', 'innerButtons', false),
        hideButtons: () => semiDefault('InputNumber', 'hideButtons', false),
        // size and disabled resolve own value -> InputGroup -> global default in useGroupLooks
        size: undefined,
        disabled: undefined,
        autofocus: semiGlobalDefault('InputNumber', 'autofocus'),
        preventScroll: semiGlobalDefault('InputNumber', 'preventScroll'),
        readonly: semiGlobalDefault('InputNumber', 'readonly'),
        showClear: semiGlobalDefault('InputNumber', 'showClear'),
        borderless: semiGlobalDefault('InputNumber', 'borderless'),
        hideSuffix: semiGlobalDefault('InputNumber', 'hideSuffix'),
        composition: semiGlobalDefault('InputNumber', 'composition'),
        placeholder: semiGlobalDefault('InputNumber', 'placeholder'),
        validateStatus: semiGlobalDefault('InputNumber', 'validateStatus'),
        maxlength: semiGlobalDefault('InputNumber', 'maxlength'),
        minlength: semiGlobalDefault('InputNumber', 'minlength'),
        inputStyle: semiGlobalDefault('InputNumber', 'inputStyle'),
        insetLabelId: undefined,
    });

    const emit = defineEmits<InputNumberEmits>();
    defineSlots<InputNumberSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const locale = useLocale('InputNumber');

    const root = useTemplateRef('root');
    const inputHandle = useTemplateRef<InputHandle>('input');

    const looks = useGroupLooks('InputNumber', props, { size: 'default' });

    const prefix = cssClasses.PREFIX;
    const formatter = computed(() => props.formatter ?? readSemiDefault(semi, 'InputNumber', 'formatter'));
    const parser = computed(() => props.parser ?? readSemiDefault(semi, 'InputNumber', 'parser'));

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, InputNumberState>(
        InputNumberFoundation,
        props,
        (view) => InputNumberFoundation.getInitialState(view),
        (base) => ({
            setValue: (value, cb) => base.setState({ value }, cb),
            setNumber: (number, cb) => base.setState({ number }, cb),
            setFocusing: (focusing, cb) => base.setState({ focusing }, cb),
            setHovering: (hovering) => base.setState({ hovering }),
            notifyChange: (value, event) => {
                emit('update:modelValue', value);
                emit('change', value, event);
            },
            notifyNumberChange: (value, event) => emit('numberChange', value, event),
            notifyBlur: (event) => emit('blur', event),
            notifyFocus: (event) => emit('focus', event),
            notifyUpClick: (value, event) => emit('upClick', value, event),
            notifyDownClick: (value, event) => emit('downClick', value, event),
            notifyKeyDown: (event) => emit('keydown', event),
            getInput: () => inputHandle.value?.input ?? null,
        }),
        {
            props: {
                size: () => looks.size,
                disabled: () => looks.disabled,
                value: () => props.modelValue,
                localeCode: () => props.localeCode ?? locale.value.localeCode,
                defaultCurrency: () => props.defaultCurrency ?? locale.value.currency,
                formatter: () => formatter.value,
                parser: () => parser.value,
            },
        }
    );

    const forwarded = computed(() => ({
        size: looks.size,
        disabled: looks.disabled,
        readonly: props.readonly,
        // InputNumber's own global default applies; the global Input one must not reach the inner Input
        showClear: props.showClear ?? false,
        borderless: props.borderless,
        hideSuffix: props.hideSuffix,
        composition: props.composition,
        preventScroll: props.preventScroll,
        autofocus: props.autofocus,
        placeholder: props.placeholder,
        validateStatus: props.validateStatus,
        maxlength: props.maxlength,
        minlength: props.minlength,
        inputStyle: props.inputStyle,
        insetLabelId: props.insetLabelId,
    }));

    // the Input and buttons inside are parts of this control, not members of the group
    provideInputGroupContext(undefined);

    const inputBindings = () => ({
        ...forwarded.value,
        role: 'spinbutton',
        'aria-disabled': looks.disabled,
        step: props.step,
        'aria-valuenow': InputNumberFoundation.getAriaValueNow(state.value.number),
        'aria-valuemin': props.min === -Infinity ? undefined : props.min,
        'aria-valuemax': props.max === Infinity ? undefined : props.max,
        ...splitControlAttrs(attrs, isNotClassOrStyle).control,
    });

    const showInnerButtons = () => !props.hideButtons && props.innerButtons && Boolean(state.value.hovering || state.value.focusing);

    const showOuterButtons = () => !props.hideButtons && !props.innerButtons;

    watch(
        () => props.modelValue,
        (value) => foundation.handleValueChange(value as number | string)
    );

    defineExpose<InputNumberHandle>({
        focus: (options) => inputHandle.value?.focus(options),
        blur: () => inputHandle.value?.blur(),
        select: () => inputHandle.value?.select(),
        setSelectionRange: (start, end, direction) => inputHandle.value?.setSelectionRange(start, end, direction),
        get input() {
            return inputHandle.value?.input ?? null;
        },
        get nativeElement() {
            return root.value;
        },
    });
</script>

<template>
    <div ref="root" v-bind="splitControlAttrs($attrs, isNotClassOrStyle).root" :class="[`${prefix}-number`, { [`${prefix}-number-size-${looks.size}`]: looks.size }]" @mouseenter="foundation.handleInputMouseEnter" @mouseleave="foundation.handleInputMouseLeave" @mousemove="foundation.handleInputMouseMove">
        <Input ref="input" v-bind="inputBindings()" :modelValue="state.value ?? ''" @blur="foundation.handleInputBlur" @change="foundation.handleInputChange" @focus="foundation.handleInputFocus" @keydown="foundation.handleInputKeyDown">
            <template v-if="showInnerButtons()" #suffix>
                <StepButtons
                    :disabled="Boolean(looks.disabled)"
                    :downNotAllowed="Boolean(looks.disabled) || reachesBound(state.number, props.min, -1)"
                    inner
                    :innerHover="Boolean(state.hovering && !state.focusing)"
                    :upNotAllowed="Boolean(looks.disabled) || reachesBound(state.number, props.max, 1)"
                    @mouseDown="foundation.handleStepMouseDown"
                    @pressDown="foundation.handleDownPress"
                    @pressUp="foundation.handleUpPress"
                    @release="foundation.handlePressEnd"
                />
            </template>
            <template v-else-if="$slots.suffix" #suffix>
                <slot name="suffix" />
            </template>
            <template v-if="$slots.prefix" #prefix>
                <slot name="prefix" />
            </template>
            <template v-if="$slots.insetLabel" #insetLabel>
                <slot name="insetLabel" />
            </template>
            <template v-if="$slots.clearIcon" #clearIcon>
                <slot name="clearIcon" />
            </template>
            <template v-if="$slots.addonBefore" #addonBefore>
                <slot name="addonBefore" />
            </template>
            <template v-if="$slots.addonAfter" #addonAfter>
                <slot name="addonAfter" />
            </template>
        </Input>
        <StepButtons
            v-if="showOuterButtons()"
            :disabled="Boolean(looks.disabled)"
            :downNotAllowed="Boolean(looks.disabled) || reachesBound(state.number, props.min, -1)"
            :inner="false"
            :innerHover="false"
            :upNotAllowed="Boolean(looks.disabled) || reachesBound(state.number, props.max, 1)"
            @mouseDown="foundation.handleStepMouseDown"
            @pressDown="foundation.handleDownPress"
            @pressUp="foundation.handleUpPress"
            @release="foundation.handlePressEnd"
        />
    </div>
</template>

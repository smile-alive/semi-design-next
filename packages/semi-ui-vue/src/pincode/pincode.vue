<script setup lang="ts">
    import { computed, useAttrs, watch } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/pincode/constants';
    import PinCodeFoundation, { type PinCodeAdapter } from '@fibrae/semi-foundation/pincode/foundation';
    import '@fibrae/semi-foundation/pincode/pincode.scss';
    import { splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import Input, { type InputChangeEvent, type InputHandle } from '../input';
    import useLocale from '../locale/use-locale';
    import type { PinCodeEmits, PinCodeFormat, PinCodeHandle, PinCodeProps, PinCodeState } from './interface';

    interface FoundationProps extends PinCodeProps {
        value?: string;
        format: PinCodeFormat;
    }

    type Foundation = PinCodeFoundation<FoundationProps, PinCodeState>;
    type Adapter = PinCodeAdapter<FoundationProps, PinCodeState>;

    defineOptions({ name: 'PinCode', inheritAttrs: false });

    const props = withDefaults(defineProps<PinCodeProps & /* @vue-ignore */ ElementProps<'div', keyof PinCodeProps | EmitHandlers<PinCodeEmits>>>(), {
        modelValue: undefined,
        modelModifiers: undefined,
        defaultValue: semiGlobalDefault('PinCode', 'defaultValue'),
        count: () => semiDefault('PinCode', 'count', 6),
        format: undefined,
        autofocus: () => semiDefault('PinCode', 'autofocus', false),
        disabled: semiGlobalDefault('PinCode', 'disabled'),
        size: semiGlobalDefault('PinCode', 'size'),
        validateStatus: semiGlobalDefault('PinCode', 'validateStatus'),
    });

    const emit = defineEmits<PinCodeEmits>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const locale = useLocale('PinCode');

    // The inputs are the focus targets, so their description and state go to each one; on the root a Tooltip's
    // tabindex would add an extra tab stop. The caller's name stays on the group.
    const cellKeys = new Set(['id', 'tabindex', 'tabIndex', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-required']);

    const format = computed(() => props.format ?? readSemiDefault(semi, 'PinCode', 'format', 'number'));

    // A v-for template ref array is not kept in source order, so each cell stores its own handle by index.
    const inputs: (InputHandle | null)[] = [];

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, PinCodeState>(
        PinCodeFoundation,
        props,
        // by code point, so a character outside the BMP is not split into two lone surrogates
        (view) => ({ valueList: Array.from(view.value ?? view.defaultValue ?? ''), currentActiveIndex: 0 }),
        (base) => ({
            // resolve after the commit: a controlled paste awaits the parent's new value before the next character
            onCurrentActiveIndexChange: (currentActiveIndex) => new Promise<void>((resolve) => base.setState({ currentActiveIndex }, resolve)),
            updateValueList: (valueList) => new Promise<void>((resolve) => base.setState({ valueList }, resolve)),
            notifyValueChange: (values) => {
                const value = values.join('');
                emit('update:modelValue', value);
                emit('change', value);
            },
            notifyComplete: (value) => emit('complete', value),
            changeSpecificInputFocusState: (index, focusState) => {
                if (focusState === 'focus') {
                    inputs[index]?.focus();
                } else {
                    inputs[index]?.blur();
                }
            },
        }),
        { props: { value: () => props.modelValue, format: () => format.value } }
    );

    // injected by Form: not DOM attributes, and no single cell carries the code's name
    const dropped = ['name', 'insetLabel', 'insetLabelId'];

    const setInput = (index: number) => (handle: unknown) => {
        inputs[index] = handle as InputHandle | null;
    };

    const handleCellChange = (index: number, value: string, event: InputChangeEvent) => foundation.handleCellChange(index, value, (event as InputEvent | CompositionEvent).data);

    // moving between the digits is not entering or leaving the code: Form's blur validation waits until focus is outside
    const isOutside = (event: FocusEvent) => !(event.currentTarget as Node).contains(event.relatedTarget as Node | null);

    const handleFocusIn = (event: FocusEvent) => {
        if (isOutside(event)) emit('focus', event);
    };

    const handleFocusOut = (event: FocusEvent) => {
        if (isOutside(event)) emit('blur', event);
    };

    const isCellKey = (key: string) => cellKeys.has(key);

    const rootAttrs = () => {
        const { root } = splitControlAttrs(attrs, isCellKey);
        for (const key of dropped) delete root[key];
        return root;
    };

    // Form's id goes on the first cell so clicking the label focuses it
    const cellAttrs = (index: number) => {
        const { control } = splitControlAttrs(attrs, isCellKey);
        if (index !== 0) delete control.id;
        return control;
    };

    const digitLabel = (index: number) => locale.value.locale.digit.replace('${index}', String(index + 1)).replace('${count}', String(props.count));

    watch(
        () => props.modelValue,
        (value) => foundation.updateValueList(Array.from(value || ''))
    );

    defineExpose<PinCodeHandle>({
        focus: (index) => {
            inputs[index]?.focus();
            inputs[index]?.setSelectionRange(1, 1);
        },
        blur: (index) => inputs[index]?.blur(),
    });
</script>

<template>
    <div :class="`${cssClasses.PREFIX}-wrapper`" role="group" v-bind="rootAttrs()" @focusin="handleFocusIn" @focusout="handleFocusOut">
        <Input
            v-for="(_, index) in props.count"
            :key="index"
            :ref="setInput(index)"
            v-bind="cellAttrs(index)"
            :aria-label="digitLabel(index)"
            :autofocus="props.autofocus && index === 0"
            composition
            :disabled="props.disabled"
            :inputmode="format === 'number' ? 'numeric' : 'text'"
            :modelValue="state.valueList[index] ?? ''"
            :showClear="false"
            :size="props.size"
            :validateStatus="props.validateStatus"
            @change="(value, event) => handleCellChange(index, value, event)"
            @focus="foundation.handleCurrentActiveIndexChange(index, 'focus')"
            @keydown="foundation.handleKeyDownOnSingleInput($event, index)"
            @paste="foundation.handlePaste($event, index)"
        />
    </div>
</template>

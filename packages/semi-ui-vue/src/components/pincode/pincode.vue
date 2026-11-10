<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import { FORM_INJECTED_PROP_KEYS } from '@fibrae/semi-foundation/components/form/constants';
    import { cssClasses } from '@fibrae/semi-foundation/components/pincode/constants';
    import PinCodeFoundation, { type PinCodeAdapter } from '@fibrae/semi-foundation/components/pincode/foundation';
    import { formatLocale } from '@fibrae/semi-foundation/locale/format';
    import '@fibrae/semi-foundation/components/pincode/pincode.scss';
    import type { ElementProps, EmitHandlers } from '../../base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../../base/semi-default';
    import useFoundation from '../../base/use-foundation';
    import { splitControlAttrs } from '../../utils/control-attrs';
    import useConfig from '../config-provider/use-config';
    import Input, { type InputChangeEvent, type InputHandle } from '../input';
    import useLocale from '../locale/use-locale';
    import type { PinCodeEmits, PinCodeFormat, PinCodeHandle, PinCodeProps, PinCodeState } from './interface';

    interface FoundationProps extends PinCodeProps {
        value?: string;
        format: PinCodeFormat;
    }

    type Foundation = PinCodeFoundation<FoundationProps>;
    type Adapter = PinCodeAdapter<FoundationProps>;

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
    const config = useConfig();

    // The inputs are the focus targets, so their description and state go to each one; on the root a Tooltip's
    // tabindex would add an extra tab stop. The caller's name stays on the group.
    const cellKeys = new Set(['id', 'tabindex', 'tabIndex', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-required']);

    const format = computed(() => props.format ?? readSemiDefault(semi, 'PinCode', 'format', 'number'));

    // A v-for template ref array is not kept in source order, so each cell stores its own handle by index.
    const inputs: (InputHandle | null)[] = [];

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, PinCodeState>(
        PinCodeFoundation,
        props,
        (view) => PinCodeFoundation.getInitialState(view),
        () => ({
            notifyValueChange: (values) => {
                const value = values.join('');
                emit('update:modelValue', value);
                emit('change', value);
            },
            notifyComplete: (value) => emit('complete', value),
            notifyFocus: (event) => emit('focus', event),
            notifyBlur: (event) => emit('blur', event),
            changeSpecificInputFocusState: (index, focusState) => {
                if (focusState === 'focus') {
                    inputs[index]?.focus();
                } else {
                    inputs[index]?.blur();
                }
            },
        }),
        { context: () => config.value, props: { value: () => props.modelValue, format: () => format.value } }
    );

    // injected by Form: not DOM attributes, and no single cell carries the code's name
    const dropped = [...FORM_INJECTED_PROP_KEYS, 'name'];

    const setInput = (index: number) => (handle: unknown) => {
        inputs[index] = handle as InputHandle | null;
    };

    const handleCellChange = (index: number, value: string, event: InputChangeEvent) => foundation.handleCellChange(index, value, (event as InputEvent | CompositionEvent).data);

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

    const digitLabel = (index: number) => formatLocale(locale.value.locale.digit, { index: index + 1, count: props.count });

    defineExpose<PinCodeHandle>({
        focus: (index) => {
            inputs[index]?.focus();
            inputs[index]?.setSelectionRange(1, 1);
        },
        blur: (index) => inputs[index]?.blur(),
    });
</script>

<template>
    <div :class="`${cssClasses.PREFIX}-wrapper`" role="group" v-bind="rootAttrs()" @focusin="foundation.handleFocus" @focusout="foundation.handleBlur">
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

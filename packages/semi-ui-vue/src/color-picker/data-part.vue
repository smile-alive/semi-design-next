<script setup lang="ts">
    import { watch } from 'vue';
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
    import DataPartFoundation, { type DataPartAdapter, type DataPartBaseProps, type DataPartBaseState } from '@fibrae/semi-foundation/color-picker/data-part-foundation';
    import type { ColorFormat } from '@fibrae/semi-foundation/color-picker/interface';
    import { IconEyedropper } from '@fibrae/semi-icons-vue';
    import useFoundation from '../_base/use-foundation';
    import Button from '../button';
    import Input, { InputGroup } from '../input';
    import InputNumber from '../input-number';
    import useLocale from '../locale/use-locale';
    import Select from '../select';
    import { FORMAT_OPTIONS } from './constants';
    import type { DataPartProps } from './interface';

    type Foundation = DataPartFoundation<DataPartBaseProps>;
    type Adapter = DataPartAdapter<DataPartBaseProps>;

    const props = defineProps<DataPartProps>();

    const i18n = useLocale('ColorPicker');

    const { foundation, state } = useFoundation<Foundation, Adapter, DataPartBaseProps, DataPartBaseState>(
        DataPartFoundation,
        props,
        () => ({
            format: props.defaultFormat,
            inputValue: DataPartFoundation.getInputValue(props.currentColor, props.defaultFormat),
        }),
        () => ({})
    );

    // report the color first, so the text box already shows the color it produced
    const onTextChange = (text: string) => {
        const value = foundation.getValueByInputValue(text);
        if (value) {
            props.foundation.handleChange(value, state.value.format);
        }
        foundation.handleInputValueChange(text);
    };

    // the same path as the alpha slider, so hue and the other channels are kept as they are
    const onAlphaChange = (percent: number) => {
        props.foundation.handleAlphaChangeByHandle({ a: Number((percent / 100).toFixed(2)) });
    };

    const onSelectFormat = (format: string | number) => {
        foundation.handleFormatChange(format as ColorFormat);
    };

    // An equal color object, e.g. a fresh controlled value, keeps what is being typed; so does the color the typed text
    // itself produced, whose canonical text (no alpha, 6 digits) would otherwise erase the next keystrokes.
    watch(
        () => props.currentColor,
        (currentColor, previous) => {
            if (!isEqual(currentColor, previous) && !foundation.isInputValueOf(currentColor)) {
                foundation.syncInputValue();
            }
        }
    );
</script>

<template>
    <div :class="`${cssClasses.PREFIX}-dataPart`" :style="{ width: `${props.width}px` }">
        <div
            :class="`${cssClasses.PREFIX}-colorDemoBlock`"
            :style="{
                minWidth: '20px',
                minHeight: '20px',
                backgroundColor: `rgba(${props.currentColor.rgba.r},${props.currentColor.rgba.g},${props.currentColor.rgba.b},${props.currentColor.rgba.a})`,
            }"
        />
        <InputGroup :class="`${cssClasses.PREFIX}-inputGroup`" size="small">
            <Input :aria-label="i18n.locale.color" :class="`${cssClasses.PREFIX}-colorPickerInput`" :modelValue="state.inputValue" :showClear="false" @change="onTextChange" />
            <InputNumber v-if="props.alpha" :aria-label="i18n.locale.alpha" :class="`${cssClasses.PREFIX}-colorPickerInputNumber`" hideButtons :max="100" :min="0" :modelValue="Math.round(props.currentColor.rgba.a * 100)" :showClear="false" @numberChange="onAlphaChange">
                <template #suffix>
                    <span :class="`${cssClasses.PREFIX}-inputNumberSuffix`">%</span>
                </template>
            </InputNumber>
            <Select :aria-label="i18n.locale.format" :class="`${cssClasses.PREFIX}-formatSelect`" :modelValue="state.format" :optionList="FORMAT_OPTIONS" size="small" @select="onSelectFormat" />
        </InputGroup>
        <Button v-if="props.eyeDropper" :aria-label="i18n.locale.eyeDropper" size="small" theme="light" type="tertiary" @click="foundation.handlePickValueWithStraw">
            <template #icon>
                <IconEyedropper />
            </template>
        </Button>
    </div>
</template>

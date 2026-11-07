<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
    import DataPartFoundation, { type DataPartAdapter, type DataPartBaseProps, type DataPartBaseState } from '@fibrae/semi-foundation/components/color-picker/data-part-foundation';
    import type { ColorFormat, HsvaColor, RgbaColor } from '@fibrae/semi-foundation/components/color-picker/interface';
    import { IconEyedropper } from '@fibrae/semi-icons-vue';
    import useFoundation from '../../base/use-foundation';
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
    const emit = defineEmits<{ change: [color: HsvaColor | RgbaColor | string, format: ColorFormat]; alphaChange: [alpha: number] }>();

    const i18n = useLocale('ColorPicker');

    const { foundation, state } = useFoundation<Foundation, Adapter, DataPartBaseProps, DataPartBaseState>(
        DataPartFoundation,
        props,
        () => DataPartFoundation.getInitialState(props),
        () => ({
            notifyChange: (color, format) => emit('change', color, format),
            notifyAlphaChange: (alpha) => emit('alphaChange', alpha),
        })
    );

    const onSelectFormat = (format: string | number) => {
        foundation.handleFormatChange(format as ColorFormat);
    };
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
            <Input :aria-label="i18n.locale.color" :class="`${cssClasses.PREFIX}-colorPickerInput`" :modelValue="state.inputValue" :showClear="false" @change="foundation.handleInputValueChange" />
            <InputNumber v-if="props.alpha" :aria-label="i18n.locale.alpha" :class="`${cssClasses.PREFIX}-colorPickerInputNumber`" hideButtons :max="100" :min="0" :modelValue="Math.round(props.currentColor.rgba.a * 100)" :showClear="false" @numberChange="foundation.handleAlphaInputChange">
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

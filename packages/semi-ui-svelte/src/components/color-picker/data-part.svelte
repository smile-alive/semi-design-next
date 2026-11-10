<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
    import DataPartFoundation, { type DataPartAdapter, type DataPartBaseProps, type DataPartBaseState } from '@fibrae/semi-foundation/components/color-picker/data-part-foundation';
    import type { ColorFormat } from '@fibrae/semi-foundation/components/color-picker/interface';
    import { IconEyedropper } from '@fibrae/semi-icons-svelte';
    import { useFoundation } from '../../base/index.js';
    import { Button } from '../button/index.js';
    import { InputNumber } from '../input-number/index.js';
    import { Input, InputGroup } from '../input/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { Select } from '../select/index.js';
    import { FORMAT_OPTIONS } from './constants.js';
    import type { DataPartProps } from './interface.js';

    type Foundation = DataPartFoundation<DataPartBaseProps>;
    type Adapter = DataPartAdapter<DataPartBaseProps>;

    const props: DataPartProps = $props();

    const locale = useLocale('ColorPicker');

    const { foundation, states } = useFoundation<Foundation, Adapter, DataPartBaseProps, DataPartBaseState>(
        DataPartFoundation,
        props,
        (view) => DataPartFoundation.getInitialState(view),
        () => ({
            notifyChange: (color, format) => props.onChange(color, format),
            notifyAlphaChange: (alpha) => props.onAlphaChange(alpha),
        })
    );

    const handleSelectFormat = (format: string | number) => {
        foundation.handleFormatChange(format as ColorFormat);
    };
</script>

{#snippet percentSuffix()}
    <span class={`${cssClasses.PREFIX}-inputNumberSuffix`}>%</span>
{/snippet}

{#snippet eyeDropperIcon()}
    <IconEyedropper />
{/snippet}

<div class={`${cssClasses.PREFIX}-dataPart`} style:width={`${props.width}px`}>
    <div class={`${cssClasses.PREFIX}-colorDemoBlock`} style:background-color={`rgba(${props.currentColor.rgba.r},${props.currentColor.rgba.g},${props.currentColor.rgba.b},${props.currentColor.rgba.a})`} style:min-height="20px" style:min-width="20px"></div>
    <InputGroup class={`${cssClasses.PREFIX}-inputGroup`} size="small">
        <Input aria-label={locale().locale.color} bind:value={() => states().inputValue, () => {}} class={`${cssClasses.PREFIX}-colorPickerInput`} onChange={foundation.handleInputValueChange} showClear={false} />
        {#if props.alpha}
            <InputNumber aria-label={locale().locale.alpha} bind:value={() => Math.round(props.currentColor.rgba.a * 100), () => {}} class={`${cssClasses.PREFIX}-colorPickerInputNumber`} hideButtons max={100} min={0} onNumberChange={foundation.handleAlphaInputChange} showClear={false} suffix={percentSuffix} />
        {/if}
        <!-- a fixed list of three formats: global Select defaults must not make it search, create or multiple, nor add a clear button -->
        <Select allowCreate={false} aria-label={locale().locale.format} bind:value={() => states().format, () => {}} class={`${cssClasses.PREFIX}-formatSelect`} filter={false} multiple={false} onSelect={handleSelectFormat} optionList={FORMAT_OPTIONS} showClear={false} size="small" />
    </InputGroup>
    {#if props.eyeDropper}
        <Button aria-label={locale().locale.eyeDropper} icon={eyeDropperIcon} size="small" theme="light" type="tertiary" onclick={foundation.handlePickValueWithStraw} />
    {/if}
</div>

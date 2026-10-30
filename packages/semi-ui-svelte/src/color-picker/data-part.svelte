<script lang="ts">
    import { untrack } from 'svelte';
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
    import DataPartFoundation, { type DataPartAdapter, type DataPartBaseProps, type DataPartBaseState } from '@fibrae/semi-foundation/color-picker/data-part-foundation';
    import type { ColorFormat } from '@fibrae/semi-foundation/color-picker/interface';
    import { IconEyedropper } from '@fibrae/semi-icons-svelte';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
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

    let previous = untrack(() => props.currentColor);

    const { foundation, states } = useFoundation<Foundation, Adapter, DataPartBaseProps, DataPartBaseState>(
        DataPartFoundation,
        props,
        () => ({
            format: props.defaultFormat,
            inputValue: DataPartFoundation.getInputValue(props.currentColor, props.defaultFormat),
        }),
        () => ({})
    );

    // report the color first, so the text box already shows the color it produced
    const handleTextChange = (text: string) => {
        const value = foundation.getValueByInputValue(text);
        if (value) {
            props.foundation.handleChange(value, states().format);
        }
        foundation.handleInputValueChange(text);
    };

    // the same path as the alpha slider, so hue and the other channels are kept as they are
    const handleAlphaChange = (percent: number) => {
        props.foundation.handleAlphaChangeByHandle({ a: Number((percent / 100).toFixed(2)) });
    };

    const handleSelectFormat = (format: string | number) => {
        foundation.handleFormatChange(format as ColorFormat);
    };

    // An equal color object, e.g. a fresh controlled value, keeps what is being typed; so does the color the typed text
    // itself produced, whose canonical text (no alpha, 6 digits) would otherwise erase the next keystrokes.
    watch(
        () => props.currentColor,
        (currentColor) => {
            const last = previous;
            previous = currentColor;
            if (!isEqual(currentColor, last) && !foundation.isInputValueOf(currentColor)) {
                foundation.syncInputValue();
            }
        }
    );
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
        <Input aria-label={locale().locale.color} bind:value={() => states().inputValue, () => {}} class={`${cssClasses.PREFIX}-colorPickerInput`} onChange={handleTextChange} showClear={false} />
        {#if props.alpha}
            <InputNumber aria-label={locale().locale.alpha} bind:value={() => Math.round(props.currentColor.rgba.a * 100), () => {}} class={`${cssClasses.PREFIX}-colorPickerInputNumber`} hideButtons max={100} min={0} onNumberChange={handleAlphaChange} showClear={false} suffix={percentSuffix} />
        {/if}
        <Select aria-label={locale().locale.format} bind:value={() => states().format, () => {}} class={`${cssClasses.PREFIX}-formatSelect`} onSelect={handleSelectFormat} optionList={FORMAT_OPTIONS} size="small" />
    </InputGroup>
    {#if props.eyeDropper}
        <Button aria-label={locale().locale.eyeDropper} icon={eyeDropperIcon} size="small" theme="light" type="tertiary" onclick={foundation.handlePickValueWithStraw} />
    {/if}
</div>

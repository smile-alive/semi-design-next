<script lang="ts">
    import ColorChooseAreaFoundation, { type ColorChooseAreaAdapter, type ColorChooseAreaBaseProps, type ColorChooseAreaBaseState } from '@fibrae/semi-foundation/color-picker/color-choose-area-foundation';
    import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
    import ColorPickerFoundation from '@fibrae/semi-foundation/color-picker/foundation';
    import { hsvaToHslString, hsvaToRgba } from '@fibrae/semi-foundation/color-picker/utils/convert';
    import { round } from '@fibrae/semi-foundation/color-picker/utils/round';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { toDragEvent } from './drag-event.js';
    import type { ColorChooseAreaProps } from './interface.js';

    type Foundation = ColorChooseAreaFoundation<ColorChooseAreaBaseProps>;
    type Adapter = ColorChooseAreaAdapter<ColorChooseAreaBaseProps>;

    const props: ColorChooseAreaProps = $props();

    const locale = useLocale('ColorPicker');

    let dom = $state<HTMLDivElement>();

    const { foundation, states } = useFoundation<Foundation, Adapter, ColorChooseAreaBaseProps, ColorChooseAreaBaseState>(
        ColorChooseAreaFoundation,
        props,
        () => ({ isHandleGrabbing: false }),
        () => ({
            // the foundation guards a missing element itself
            getDOM: () => dom as HTMLDivElement,
            notifyChange: (color) => props.onChange(color),
        })
    );

    const handlePosition = $derived(ColorPickerFoundation.getHandlePositionByHSVA(props.hsva, { width: props.width, height: props.height }, props.handleSize));

    const handleColor = $derived.by(() => {
        const { r, g, b, a } = hsvaToRgba(props.hsva);
        return `rgba(${r},${g},${b},${a})`;
    });

    // both ranges report the same two-dimensional position, as React Aria's ColorArea does
    const valueText = $derived(
        locale()
            .locale.saturationBrightness.replace('${saturation}', String(round(props.hsva.s)))
            .replace('${brightness}', String(round(props.hsva.v)))
    );

    const sliders = $derived([
        { axis: 's', name: locale().locale.saturation },
        { axis: 'v', name: locale().locale.brightness },
    ] as const);

    const handleInput = (event: Event & { currentTarget: HTMLInputElement }, axis: 's' | 'v') => {
        const input = event.currentTarget;
        foundation.setValue(axis, Number(input.value));
        // A change the owner does not accept leaves the area unrendered, and Svelte would not move the DOM value back.
        input.value = String(round(props.hsva[axis]));
    };
</script>

<div
    bind:this={dom}
    class={`${cssClasses.PREFIX}-colorChooseArea`}
    style:background-color={hsvaToHslString({ h: props.hsva.h, s: 100, v: 100, a: 1 })}
    style:cursor={states().isHandleGrabbing ? 'grabbing' : 'pointer'}
    style:height={`${props.height}px`}
    style:width={`${props.width}px`}
    onlostpointercapture={foundation.handleLostPointerCapture}
    onpointerdown={(event) => foundation.handlePointerDown(toDragEvent(event))}
    onpointermove={(event) => foundation.handlePointerMove(toDragEvent(event))}
>
    <div class={`${cssClasses.PREFIX}-handle`} style:background-color={handleColor} style:height={`${props.handleSize}px`} style:left={`${handlePosition.x}px`} style:top={`${handlePosition.y}px`} style:width={`${props.handleSize}px`}>
        {#each sliders as slider (slider.axis)}
            <input aria-label={slider.name} aria-valuetext={valueText} class={`${cssClasses.PREFIX}-handleSlider`} max={100} min={0} type="range" value={round(props.hsva[slider.axis])} oninput={(event) => handleInput(event, slider.axis)} onkeydown={(event) => foundation.handleKeyDown(slider.axis, event)} />
        {/each}
    </div>
</div>

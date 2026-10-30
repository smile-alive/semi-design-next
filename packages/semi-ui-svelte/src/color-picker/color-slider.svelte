<script lang="ts">
    import ColorSliderFoundation, { type ColorSliderAdapter, type ColorSliderBaseProps, type ColorSliderBaseState } from '@fibrae/semi-foundation/color-picker/color-slider-foundation';
    import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
    import { hsvaToHslString } from '@fibrae/semi-foundation/color-picker/utils/convert';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { toDragEvent } from './drag-event.js';
    import type { ColorSliderProps } from './interface.js';

    type Foundation = ColorSliderFoundation<ColorSliderBaseProps>;
    type Adapter = ColorSliderAdapter<ColorSliderBaseProps>;

    const props: ColorSliderProps = $props();

    const locale = useLocale('ColorPicker');

    let dom = $state<HTMLDivElement>();

    const { foundation } = useFoundation<Foundation, Adapter, ColorSliderBaseProps, ColorSliderBaseState>(
        ColorSliderFoundation,
        props,
        () => ({ isHandleGrabbing: false }),
        // the foundation guards a missing element itself
        () => ({ getDOM: () => dom as HTMLDivElement })
    );

    const handleInput = (event: Event & { currentTarget: HTMLInputElement }) => {
        const input = event.currentTarget;
        foundation.setValue(Number(input.value));
        // A change the owner does not accept leaves the slider unrendered, and Svelte would not move the DOM value back.
        input.value = String(Math.round(props.hue));
    };
</script>

<div
    bind:this={dom}
    class={[`${cssClasses.PREFIX}-colorSlider`, props.class]}
    style:height={`${props.height}px`}
    style:width={`${props.width}px`}
    onlostpointercapture={foundation.handleLostPointerCapture}
    onpointerdown={(event) => foundation.handlePointerDown(toDragEvent(event))}
    onpointermove={(event) => foundation.handlePointerMove(toDragEvent(event))}
>
    <div
        class={`${cssClasses.PREFIX}-handle`}
        style:background-color={hsvaToHslString({ h: props.hue, s: 100, v: 100, a: 1 })}
        style:height={`${props.handleSize}px`}
        style:left={`${(props.hue / 360) * props.width - props.handleSize / 2}px`}
        style:top="50%"
        style:transform="translateY(-50%)"
        style:width={`${props.handleSize}px`}
    >
        <input aria-label={locale().locale.hue} class={`${cssClasses.PREFIX}-handleSlider`} max={360} min={0} type="range" value={Math.round(props.hue)} oninput={handleInput} onkeydown={foundation.handleKeyDown} />
    </div>
</div>

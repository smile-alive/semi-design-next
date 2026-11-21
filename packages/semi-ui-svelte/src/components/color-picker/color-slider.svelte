<script lang="ts">
    import ColorSliderFoundation, { type ColorSliderAdapter, type ColorSliderBaseProps, type ColorSliderBaseState } from '@fibrae/semi-foundation/components/color-picker/color-slider-foundation';
    import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
    import { hsvaToHslString } from '@fibrae/semi-foundation/components/color-picker/utils/convert';
    import { useFoundation } from '../../base/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { toDragEvent } from './drag-event.js';
    import type { ColorSliderProps } from './interface.js';
    import { joinStyle } from './join-style.js';

    type Foundation = ColorSliderFoundation<ColorSliderBaseProps>;
    type Adapter = ColorSliderAdapter<ColorSliderBaseProps>;

    const props: ColorSliderProps = $props();

    const locale = useLocale('ColorPicker');

    let dom = $state<HTMLDivElement>();

    const foundationProps: ColorSliderBaseProps = {
        get width() {
            return props.width;
        },
        get value() {
            return props.hue;
        },
        max: 360,
        get onChange() {
            return props.onChange;
        },
    };

    const { foundation } = useFoundation<Foundation, Adapter, ColorSliderBaseProps, ColorSliderBaseState>(
        ColorSliderFoundation,
        foundationProps,
        () => ColorSliderFoundation.getInitialState(),
        () => ({
            getDOM: () => dom!,
            notifyChange: (value) => props.onChange(value),
        })
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
    class={[`${cssClasses.PREFIX}-colorSlider`, props.class, props.classNames?.hue]}
    style={joinStyle(`height: ${props.height}px; width: ${props.width}px`, props.styles?.hue)}
    onlostpointercapture={foundation.handleLostPointerCapture}
    onpointerdown={(event) => foundation.handlePointerDown(toDragEvent(event))}
    onpointermove={(event) => foundation.handlePointerMove(toDragEvent(event))}
>
    <div
        class={[`${cssClasses.PREFIX}-handle`, props.classNames?.handle]}
        style={joinStyle(`background-color: ${hsvaToHslString({ h: props.hue, s: 100, v: 100, a: 1 })}; height: ${props.handleSize}px; left: ${ColorSliderFoundation.getHandlePosition(foundationProps, props.handleSize)}px; top: 50%; transform: translateY(-50%); width: ${props.handleSize}px`, props.styles?.handle)}
    >
        <input aria-label={locale().locale.hue} class={`${cssClasses.PREFIX}-handleSlider`} max={360} min={0} type="range" value={Math.round(props.hue)} oninput={handleInput} onkeydown={foundation.handleKeyDown} />
    </div>
</div>

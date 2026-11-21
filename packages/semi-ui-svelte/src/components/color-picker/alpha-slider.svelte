<script lang="ts">
    import ColorSliderFoundation, { type ColorSliderAdapter, type ColorSliderBaseProps, type ColorSliderBaseState } from '@fibrae/semi-foundation/components/color-picker/color-slider-foundation';
    import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
    import { hsvaToHslaString, hsvaToRgbaString } from '@fibrae/semi-foundation/components/color-picker/utils/convert';
    import { round } from '@fibrae/semi-foundation/components/color-picker/utils/round';
    import { useFoundation } from '../../base/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { toDragEvent } from './drag-event.js';
    import type { AlphaSliderProps } from './interface.js';
    import { joinStyle } from './join-style.js';

    type Foundation = ColorSliderFoundation<ColorSliderBaseProps>;
    type Adapter = ColorSliderAdapter<ColorSliderBaseProps>;

    const props: AlphaSliderProps = $props();

    const locale = useLocale('ColorPicker');

    let dom = $state<HTMLDivElement>();

    const foundationProps: ColorSliderBaseProps = {
        get width() {
            return props.width;
        },
        get value() {
            return props.hsva.a * 100;
        },
        max: 100,
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
            notifyChange: (percent) => props.onChange(percent / 100),
        })
    );

    const handleInput = (event: Event & { currentTarget: HTMLInputElement }) => {
        const input = event.currentTarget;
        foundation.setValue(Number(input.value));
        // A change the owner does not accept leaves the slider unrendered, and Svelte would not move the DOM value back.
        input.value = String(round(props.hsva.a * 100));
    };
</script>

<div
    bind:this={dom}
    class={[`${cssClasses.PREFIX}-alphaSlider`, props.classNames?.alpha]}
    style={joinStyle(`height: ${props.height}px; width: ${props.width}px`, props.styles?.alpha)}
    onlostpointercapture={foundation.handleLostPointerCapture}
    onpointerdown={(event) => foundation.handlePointerDown(toDragEvent(event))}
    onpointermove={(event) => foundation.handlePointerMove(toDragEvent(event))}
>
    <div class={`${cssClasses.PREFIX}-alphaSliderInner`} style:background={`linear-gradient(90deg, ${hsvaToHslaString({ ...props.hsva, a: 0 })}, ${hsvaToHslaString({ ...props.hsva, a: 1 })})`}>
        <div
            class={[`${cssClasses.PREFIX}-alphaHandle`, props.classNames?.handle]}
            style={joinStyle(`background-color: ${hsvaToRgbaString(props.hsva)}; height: ${props.handleSize}px; left: ${ColorSliderFoundation.getHandlePosition(foundationProps, props.handleSize)}px; top: 50%; transform: translateY(-50%); width: ${props.handleSize}px`, props.styles?.handle)}
        >
            <input aria-label={locale().locale.alpha} aria-valuetext={`${round(props.hsva.a * 100)}%`} class={`${cssClasses.PREFIX}-handleSlider`} max={100} min={0} type="range" value={round(props.hsva.a * 100)} oninput={handleInput} onkeydown={foundation.handleKeyDown} />
        </div>
    </div>
</div>

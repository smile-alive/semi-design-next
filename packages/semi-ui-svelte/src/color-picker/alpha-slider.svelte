<script lang="ts">
    import AlphaSliderFoundation, { type AlphaSliderAdapter, type AlphaSliderBaseProps, type AlphaSliderBaseState } from '@fibrae/semi-foundation/color-picker/alpha-slider-foundation';
    import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
    import { hsvaToHslaString, hsvaToRgbaString } from '@fibrae/semi-foundation/color-picker/utils/convert';
    import { round } from '@fibrae/semi-foundation/color-picker/utils/round';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { toDragEvent } from './drag-event.js';
    import type { AlphaSliderProps } from './interface.js';

    type Foundation = AlphaSliderFoundation<AlphaSliderBaseProps>;
    type Adapter = AlphaSliderAdapter<AlphaSliderBaseProps>;

    const props: AlphaSliderProps = $props();

    const locale = useLocale('ColorPicker');

    let dom = $state<HTMLDivElement>();

    const { foundation } = useFoundation<Foundation, Adapter, AlphaSliderBaseProps, AlphaSliderBaseState>(
        AlphaSliderFoundation,
        props,
        () => ({ isHandleGrabbing: false }),
        // the foundation guards a missing element itself
        () => ({ getDOM: () => dom as HTMLDivElement })
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
    class={`${cssClasses.PREFIX}-alphaSlider`}
    style:height={`${props.height}px`}
    style:width={`${props.width}px`}
    onlostpointercapture={foundation.handleLostPointerCapture}
    onpointerdown={(event) => foundation.handlePointerDown(toDragEvent(event))}
    onpointermove={(event) => foundation.handlePointerMove(toDragEvent(event))}
>
    <div class={`${cssClasses.PREFIX}-alphaSliderInner`} style:background={`linear-gradient(90deg, ${hsvaToHslaString({ ...props.hsva, a: 0 })}, ${hsvaToHslaString({ ...props.hsva, a: 1 })})`}>
        <div class={`${cssClasses.PREFIX}-alphaHandle`} style:background-color={hsvaToRgbaString(props.hsva)} style:height={`${props.handleSize}px`} style:left={`${props.hsva.a * props.width - props.handleSize / 2}px`} style:top="50%" style:transform="translateY(-50%)" style:width={`${props.handleSize}px`}>
            <input aria-label={locale().locale.alpha} aria-valuetext={`${round(props.hsva.a * 100)}%`} class={`${cssClasses.PREFIX}-handleSlider`} max={100} min={0} type="range" value={round(props.hsva.a * 100)} oninput={handleInput} onkeydown={foundation.handleKeyDown} />
        </div>
    </div>
</div>

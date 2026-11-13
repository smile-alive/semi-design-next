<script lang="ts">
    import { omit } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
    import ColorPickerFoundation, { type ColorPickerAdapter, type ColorPickerProps as FoundationProps, type ColorPickerState } from '@fibrae/semi-foundation/components/color-picker/foundation';
    import { namedRole } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/color-picker/color-picker.scss';
    import { useDefaultProps, useFoundation } from '../../base/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { Popover } from '../popover/index.js';
    import type { TooltipTriggerProps } from '../tooltip/index.js';
    import AlphaSlider from './alpha-slider.svelte';
    import ColorChooseArea from './color-choose-area.svelte';
    import ColorSlider from './color-slider.svelte';
    import { DEFAULT_COLOR } from './constants.js';
    import DataPart from './data-part.svelte';
    import type { ColorPickerProps } from './interface.js';

    type Foundation = ColorPickerFoundation<FoundationProps>;
    type Adapter = ColorPickerAdapter<FoundationProps>;

    const defaults = useDefaultProps('ColorPicker');

    // No fallback on `value`: a bound `undefined` (back to uncontrolled) would throw with one
    let {
        value = $bindable(),
        alpha = defaults('alpha', true),
        eyeDropper = defaults('eyeDropper', true),
        defaultFormat = defaults('defaultFormat', 'hex'),
        width = defaults('width', 280),
        height = defaults('height', 280),
        usePopover = defaults('usePopover', false),
        popoverProps = defaults('popoverProps'),
        onChange,
        children,
        topSlot,
        bottomSlot,
        ...rest
    }: ColorPickerProps = $props();

    const locale = useLocale('ColorPicker');

    let picker = $state<HTMLDivElement>();
    let popover = $state<Popover>();

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: FoundationProps = {
        get value() {
            return value;
        },
        defaultValue: DEFAULT_COLOR,
        get alpha() {
            return alpha;
        },
        get width() {
            return width;
        },
        get height() {
            return height;
        },
        get defaultFormat() {
            return defaultFormat;
        },
        get eyeDropper() {
            return eyeDropper;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, FoundationProps, ColorPickerState>(
        ColorPickerFoundation,
        foundationProps,
        (view) => ColorPickerFoundation.getInitialState(view),
        () => ({
            notifyChange: (next) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                value = next;
                onChange?.(next);
            },
        })
    );

    const currentColor = $derived(ColorPickerFoundation.deriveColor(foundationProps, states()));

    // The root is not focusable; a Tooltip around the picker injects a tabindex that would add a Tab stop of its own
    const pickerAttrs = $derived(omit(rest, ['tabindex']));

    // The popup holds inputs and sliders: it is a dialog opened by click, not a hover tooltip, so moving the pointer away
    // cannot close it mid-edit. A dialog needs a name; the caller's wins.
    const popoverClass = $derived([`${cssClasses.PREFIX}-popover`, popoverProps?.class].filter(Boolean).join(' '));
    const popoverLabel = $derived(popoverProps?.['aria-label'] ?? (popoverProps?.['aria-labelledby'] ? undefined : locale().locale.color));

    /** The picker div: inside the popover when `usePopover`, so null while the popover is closed */
    export function getRoot() {
        return picker ?? null;
    }
</script>

{#snippet panel()}
    <div bind:this={picker} {...pickerAttrs} class={[cssClasses.PREFIX, rest.class]} role={namedRole(rest)}>
        {@render topSlot?.()}
        <ColorChooseArea handleSize={20} {height} hsva={currentColor.hsva} onChange={foundation.handleAreaChange} {width} />
        <ColorSlider class="colorSliderWrapper" handleSize={18} height={10} hue={currentColor.hsva.h} onChange={foundation.handleHueChange} {width} />
        {#if alpha}
            <AlphaSlider handleSize={18} height={10} hsva={currentColor.hsva} onChange={foundation.handleAlphaChange} {width} />
        {/if}
        <DataPart {alpha} {currentColor} {defaultFormat} {eyeDropper} onAlphaChange={foundation.handleAlphaChange} onChange={foundation.handleChange} {width} />
        {@render bottomSlot?.()}
    </div>
{/snippet}

{#snippet defaultTrigger({ props }: { props: TooltipTriggerProps })}
    <button {...props} aria-label={locale().locale.color} class={`${cssClasses.PREFIX}-popover-defaultChildren`} style:background-color={currentColor.hex} type="button"></button>
{/snippet}

{#if usePopover}
    <Popover
        {...popoverProps}
        aria-label={popoverLabel}
        bind:this={popover}
        child={children ? undefined : defaultTrigger}
        {children}
        class={popoverClass}
        content={panel}
        onOpen={() => {
            ColorPickerFoundation.focusPopup(popover?.getPopup() ?? null);
            popoverProps?.onOpen?.();
        }}
        role={popoverProps?.role ?? 'dialog'}
        trigger={popoverProps?.trigger ?? 'click'}
    />
{:else}
    {@render panel()}
{/if}

<script lang="ts">
    import { omit } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
    import ColorPickerFoundation, { type ColorPickerAdapter, type ColorPickerProps as FoundationProps, type ColorPickerState } from '@fibrae/semi-foundation/color-picker/foundation';
    import '@fibrae/semi-foundation/color-picker/color-picker.scss';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
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
        (view) => ({ currentColor: view.value ?? DEFAULT_COLOR }),
        () => ({
            notifyChange: (next) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                value = next;
                onChange?.(next);
            },
        })
    );

    // shortcut: repeats ColorPickerFoundation.getCurrentColor, which is protected; share it when the foundation exports it
    const currentColor = $derived(value !== undefined ? (value ?? DEFAULT_COLOR) : states().currentColor);

    // The root is not focusable; a Tooltip around the picker injects a tabindex that would add a Tab stop of its own
    const pickerAttrs = $derived(omit(rest, ['tabindex']));

    // The popup holds inputs and sliders: it is a dialog opened by click, not a hover tooltip, so moving the pointer away
    // cannot close it mid-edit. A dialog needs a name; the caller's wins.
    const popoverClass = $derived([`${cssClasses.PREFIX}-popover`, popoverProps?.class].filter(Boolean).join(' '));
    const popoverLabel = $derived(popoverProps?.['aria-label'] ?? (popoverProps?.['aria-labelledby'] ? undefined : locale().locale.color));

    const handleAreaChange = ({ s, v }: { s: number; v: number }) => {
        const { h, a } = currentColor.hsva;
        foundation.handleChange({ s, v, a, h }, 'hsva');
    };

    watch(
        () => value,
        (next) => {
            if (next === undefined) {
                foundation.resetToDefault();
            }
        }
    );

    /** The picker div: inside the popover when `usePopover`, so null while the popover is closed */
    export function getRoot() {
        return picker ?? null;
    }
</script>

{#snippet panel()}
    <div bind:this={picker} {...pickerAttrs} class={[cssClasses.PREFIX, rest.class]} role={groupRole(rest)}>
        {@render topSlot?.()}
        <ColorChooseArea handleSize={20} {height} hsva={currentColor.hsva} onChange={handleAreaChange} {width} />
        <ColorSlider class="colorSliderWrapper" {foundation} handleSize={18} height={10} hue={currentColor.hsva.h} {width} />
        {#if alpha}
            <AlphaSlider {foundation} handleSize={18} height={10} hsva={currentColor.hsva} {width} />
        {/if}
        <DataPart {alpha} {currentColor} {defaultFormat} {eyeDropper} {foundation} {width} />
        {@render bottomSlot?.()}
    </div>
{/snippet}

{#snippet defaultTrigger({ props }: { props: TooltipTriggerProps })}
    <button {...props} aria-label={locale().locale.color} class={`${cssClasses.PREFIX}-popover-defaultChildren`} style:background-color={currentColor.hex} type="button"></button>
{/snippet}

{#if usePopover}
    <Popover {...popoverProps} aria-label={popoverLabel} child={children ? undefined : defaultTrigger} {children} class={popoverClass} content={panel} role={popoverProps?.role ?? 'dialog'} trigger={popoverProps?.trigger ?? 'click'} />
{:else}
    {@render panel()}
{/if}

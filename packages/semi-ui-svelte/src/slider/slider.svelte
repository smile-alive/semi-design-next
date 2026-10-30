<script lang="ts">
    import { untrack } from 'svelte';
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/slider/constants';
    import SliderFoundation, { type HandleDot, type SliderAdapter, type SliderProps as BasicSliderProps, type SliderState } from '@fibrae/semi-foundation/slider/foundation';
    import { focusWithoutRing } from '@fibrae/semi-foundation/utils/supports';
    import '@fibrae/semi-foundation/slider/slider.scss';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { getConfigContext } from '../config-provider/context.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { TooltipTriggerProps } from '../tooltip/interface.js';
    import Tooltip from '../tooltip/tooltip.svelte';
    import type { SliderProps } from './interface.js';

    type Handle = 'min' | 'max';
    type Foundation = SliderFoundation<BasicSliderProps>;
    type Adapter = SliderAdapter<BasicSliderProps>;

    interface MarkItem {
        key: string;
        value: number;
        label: string | number;
        active: false | 'active' | 'unActive';
    }

    const defaults = useDefaultProps('Slider');

    // No fallback on `value`: a bound `undefined` (form reset) would throw with one
    let {
        value = $bindable(),
        disabled = defaults('disabled', false),
        included = defaults('included', true),
        marks = defaults('marks'),
        max = defaults('max', 100),
        min = defaults('min', 0),
        range = defaults('range', false),
        step = defaults('step', 1),
        tipFormatter = defaults('tipFormatter', (tipValue: number) => tipValue),
        tooltipVisible = defaults('tooltipVisible'),
        tooltipOnMark = defaults('tooltipOnMark', false),
        showMarkLabel = defaults('showMarkLabel', true),
        showArrow = defaults('showArrow', true),
        showBoundary = defaults('showBoundary', false),
        vertical = defaults('vertical', false),
        verticalReverse = defaults('verticalReverse', false),
        railStyle = defaults('railStyle'),
        handleDot = defaults('handleDot'),
        // no global default: a global id would repeat on every instance
        id,
        'aria-label': ariaLabel = defaults('aria-label'),
        'aria-labelledby': ariaLabelledby = defaults('aria-labelledby'),
        'aria-valuetext': ariaValuetext = defaults('aria-valuetext'),
        getAriaValueText = defaults('getAriaValueText'),
        onChange,
        onAfterChange,
        onMouseUp,
        onFocus,
        onBlur,
        onKeyDown,
        mark,
        tip,
        ...rest
    }: SliderProps = $props();

    const config = getConfigContext();
    const locale = useLocale('Slider');

    const uid = $props.id();
    let slider: HTMLDivElement | undefined;

    // A defined value makes the slider follow it; an undefined one (or a write of the slider's own) leaves the handles to the foundation
    let controlled = untrack(() => value !== undefined);
    let seen = untrack(() => value);
    let written: number | number[] | undefined;

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: BasicSliderProps = {
        get disabled() {
            return disabled;
        },
        get max() {
            return max;
        },
        get min() {
            return min;
        },
        get range() {
            return range;
        },
        get step() {
            return step;
        },
        get tipFormatter() {
            return tipFormatter;
        },
        get tooltipVisible() {
            return tooltipVisible;
        },
        get value() {
            return controlled ? value : undefined;
        },
        get vertical() {
            return vertical;
        },
        get verticalReverse() {
            return verticalReverse;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, BasicSliderProps, SliderState>(
        SliderFoundation,
        foundationProps,
        (view) => SliderFoundation.getInitialState(view),
        () => ({
            getSliderNode: () => slider,
            notifyChange: (next) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                written = next;
                value = next;
                onChange?.(next);
            },
            notifyAfterChange: (next) => onAfterChange?.(next),
            notifyMouseUp: (event) => onMouseUp?.(event),
        }),
        { context: () => config }
    );

    const prefix = cssClasses.PREFIX;
    const isRTL = $derived(config.direction === 'rtl' && !vertical);
    const stylePos = $derived(vertical ? 'top' : isRTL ? 'right' : 'left');
    const reverse = $derived(vertical && verticalReverse ? '-reverse' : '');
    const handles = $derived<Handle[]>(range ? ['min', 'max'] : ['min']);
    const percent = $derived(SliderFoundation.getMinAndMaxPercent({ range, min, max }, states().currentValue));
    const tips = $derived(SliderFoundation.computeHandleVisibleVal({ tooltipVisible, tipFormatter, range, step, min }, states()));

    const trackStyle = $derived.by(() => {
        if (!included) {
            return undefined;
        }
        const size = range ? `${Math.abs(percent.max - percent.min) * 100}%` : `${percent.min * 100}%`;
        const start = range ? `${Math.min(percent.min, percent.max) * 100}%` : '0';
        return `${vertical ? 'height' : 'width'}: ${size}; ${stylePos}: ${start}`;
    });

    const markList = $derived<MarkItem[]>(
        Object.entries(marks ?? {}).map(([key, label]) => {
            const markValue = Number(key);
            return { key, value: markValue, label, active: SliderFoundation.isMarkActive({ min, max, range, included }, states().currentValue, markValue) };
        })
    );

    const shownMarks = $derived(markList.filter((item) => item.active !== false));

    // aria-*, name and autofocus name and focus the inputs; the wrapper takes the rest
    const attrs = $derived(splitControlAttrs(rest, (key) => key.startsWith('aria-') || key === 'name' || key === 'autofocus' || key === 'tabindex'));

    // The inputs are the Tab stops, and the slider role supports no aria-required (a native range has no required either);
    // autofocus belongs to the start handle alone: the slider has one Tab stop to land on first
    const inputAttrs = (pos: Handle) => Object.fromEntries(Object.entries(attrs.control).filter(([key]) => key !== 'aria-required' && key !== 'tabindex' && (key !== 'autofocus' || pos === 'min')));

    const markPercent = (markValue: number) => ((markValue - min) / (max - min)) * 100;

    const handleIndex = (pos: Handle) => (pos === 'min' ? 0 : 1);

    const handleValue = (pos: Handle) => {
        const { currentValue } = states();
        return Array.isArray(currentValue) ? currentValue[handleIndex(pos)] : currentValue;
    };

    const handleStyle = (pos: Handle) => {
        const { chooseMovePos, isDrag } = states();
        const active = chooseMovePos === pos && (range || isDrag);
        return `${stylePos}: ${(pos === 'min' ? percent.min : percent.max) * 100}%; z-index: ${active ? 2 : 1}`;
    };

    const dotOf = (pos: Handle): HandleDot | undefined => (Array.isArray(handleDot) ? handleDot[handleIndex(pos)] : handleDot);

    const handleA11y = (pos: Handle) =>
        SliderFoundation.getHandleA11y({
            range,
            pos,
            id,
            ariaLabel: ariaLabel ?? undefined,
            ariaLabelledby: ariaLabelledby ?? undefined,
            generatedId: uid,
            endName: pos === 'min' ? locale().locale.rangeStart : locale().locale.rangeEnd,
        });

    const valuetext = (pos: Handle) => (getAriaValueText ? getAriaValueText(handleValue(pos), handleIndex(pos)) : ariaValuetext);

    // Only a single slider re-checks for a hidden container, on hover and on its input's focus: both show the tooltip.
    const syncSingle = () => {
        if (!range) {
            foundation.syncIsInRenderTree();
        }
    };

    const onHandleDown = (event: PointerEvent & { currentTarget: HTMLElement }, pos: Handle) => {
        // Chrome treats a scripted focus on a range input as keyboard focus; the ring is for the keyboard only
        const input = event.currentTarget.querySelector('input');
        if (input) focusWithoutRing(input, { preventScroll: true });
        foundation.onHandleDown(event, pos);
    };

    const onInput = (event: Event & { currentTarget: HTMLInputElement }, pos: Handle) => {
        foundation.handleInputChange(Number(event.currentTarget.value), pos);
        // A controlled or blocked handle keeps its rendered value, which Svelte does not patch back after the browser moved it.
        event.currentTarget.value = String(handleValue(pos));
    };

    const onFocusout = (event: FocusEvent & { currentTarget: HTMLElement }) => {
        if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
            onBlur?.(event);
        }
    };

    // A literal array is a new value on every render, so values are compared deeply.
    watch(
        () => value,
        (next) => {
            if (isEqual(next, seen)) {
                return;
            }
            seen = next;
            if (next === undefined) {
                // a form reset: back to the default position, nothing to report
                controlled = false;
                foundation.resetValue();
                return;
            }
            // the echo of a change the foundation already applied
            if (!controlled && isEqual(next, written)) {
                return;
            }
            controlled = true;
            foundation.handleValueChange(next);
            // a controlled value change ends a change too
            onAfterChange?.(next);
        }
    );
</script>

{#snippet markLabel(item: MarkItem)}
    {#if mark}{@render mark({ value: item.value, label: item.label })}{:else}{item.label}{/if}
{/snippet}

<!-- The mark tip is for the pointer only: the Tooltip trigger props must not make the dot a Tab stop -->
{#snippet markDot(item: MarkItem, trigger?: TooltipTriggerProps)}
    <span {...trigger} class={[`${prefix}-dot`, { [`${prefix}-dot-active`]: item.active === 'active' }]} style="{stylePos}: calc({markPercent(item.value)}% - 2px)" tabindex="-1" onclick={foundation.handleWrapClick}></span>
{/snippet}

{#snippet handleView(pos: Handle)}
    {@const dot = dotOf(pos)}
    <!-- closeOnEsc off: the slider drives this tip, which Escape cannot hide, so the key goes on to the layer below -->
    <Tooltip class={`${cssClasses.HANDLE}-tooltip`} closeOnEsc={false} position="top" {showArrow} trigger="custom" visible={states().isInRenderTree && (tips.tipVisible[pos] || states().focusVisibleHandle === pos)}>
        {#snippet content()}
            {#if tip}{@render tip({ value: tips.tipChildren[pos], handle: pos })}{:else}{tips.tipChildren[pos]}{/if}
        {/snippet}
        {#snippet child({ props })}
            <!-- The input inside is the control: the trigger props must not describe this span or make it a Tab stop -->
            <span
                {...props}
                aria-describedby={undefined}
                class={[cssClasses.HANDLE, { [`${cssClasses.HANDLE}-clicked`]: states().chooseMovePos === pos && states().isDrag }]}
                style={handleStyle(pos)}
                tabindex="-1"
                onmousedown={(event) => event.preventDefault()}
                onmouseenter={() => foundation.onHandleEnter(pos)}
                onmouseleave={foundation.onHandleLeave}
                onmouseover={syncSingle}
                onpointerdown={(event) => onHandleDown(event, pos)}
            >
                <input
                    {...inputAttrs(pos)}
                    aria-label={handleA11y(pos).ariaLabel}
                    aria-labelledby={handleA11y(pos).ariaLabelledby}
                    aria-orientation={vertical ? 'vertical' : undefined}
                    aria-valuetext={valuetext(pos)}
                    class={`${cssClasses.HANDLE}-input`}
                    dir={isRTL || (vertical && verticalReverse) ? 'rtl' : 'ltr'}
                    {disabled}
                    id={handleA11y(pos).id}
                    {max}
                    {min}
                    {step}
                    style:writing-mode={vertical ? 'vertical-lr' : undefined}
                    type="range"
                    value={handleValue(pos)}
                    onblur={() => foundation.onBlur(pos)}
                    onfocus={(event) => {
                        foundation.onFocus({ target: event.currentTarget }, pos);
                        syncSingle();
                    }}
                    oninput={(event) => onInput(event, pos)}
                    onkeydown={(event) => {
                        onKeyDown?.(event);
                        foundation.handleKeyDown(event, pos);
                    }}
                    onkeyup={foundation.handleKeyUp}
                />
                {#if dot}
                    <div class={cssClasses.HANDLE_DOT} style:background-color={dot.color} style:height={dot.size} style:width={dot.size}></div>
                {/if}
            </span>
        {/snippet}
    </Tooltip>
{/snippet}

{#snippet body()}
    <div
        bind:this={slider}
        {...attrs.root}
        class={[
            `${prefix}-wrapper`,
            rest.class,
            {
                [`${prefix}-disabled`]: disabled,
                [`${cssClasses.VERTICAL}-wrapper`]: vertical,
                [`${prefix}-reverse`]: vertical && verticalReverse,
            },
        ]}
        onfocusin={(event) => onFocus?.(event)}
        onfocusout={onFocusout}
        onmouseenter={foundation.handleWrapperEnter}
        onmouseleave={foundation.handleWrapperLeave}
    >
        <div class={`${prefix}-rail`} style={railStyle} onclick={foundation.handleWrapClick}></div>
        <div class={cssClasses.TRACK} style={trackStyle} onclick={foundation.handleWrapClick}></div>
        {#if markList.length}
            <div class={cssClasses.DOTS}>
                {#each shownMarks as item (item.key)}
                    {#if tooltipOnMark}
                        <Tooltip>
                            {#snippet content()}{@render markLabel(item)}{/snippet}
                            {#snippet child({ props })}{@render markDot(item, props)}{/snippet}
                        </Tooltip>
                    {:else}
                        {@render markDot(item)}
                    {/if}
                {/each}
            </div>
        {/if}
        <div>
            {#each handles as pos (pos)}
                {@render handleView(pos)}
            {/each}
        </div>
        {#if showMarkLabel && markList.length}
            <div class={cssClasses.MARKS + reverse}>
                {#each shownMarks as item (item.key)}
                    <span class={`${prefix}-mark${reverse}`} style="{stylePos}: {markPercent(item.value)}%" onclick={() => foundation.handleMarkClick(item.value)}>
                        {@render markLabel(item)}
                    </span>
                {/each}
            </div>
        {/if}
        <div class={[`${prefix}-boundary`, { [`${prefix}-boundary-show`]: showBoundary && states().showBoundary }]}>
            <span class={`${prefix}-boundary-min`}>{min}</span>
            <span class={`${prefix}-boundary-max`}>{max}</span>
        </div>
    </div>
{/snippet}

{#if vertical}
    {@render body()}
{:else}
    <div class={prefix}>
        {@render body()}
    </div>
{/if}

<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/switch/constants';
    import SwitchFoundation, { type SwitchAdapter, type SwitchBaseProps, type SwitchState } from '@fibrae/semi-foundation/components/switch/foundation';
    import { joinIds } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/switch/switch.scss';
    import { useDefaultProps, useFoundation } from '../../base/index.js';
    import { isNativeInputKey, splitControlAttrs } from '../../utils/index.js';
    import Spin from '../spin/spin.svelte';
    import useTrigger, { attachmentProps } from '../tooltip/use-trigger.svelte.js';
    import type { SwitchProps } from './interface.js';

    type Foundation = SwitchFoundation<SwitchBaseProps, Event>;
    type Adapter = SwitchAdapter<SwitchBaseProps, Event>;

    const defaults = useDefaultProps('Switch');

    // No fallback on `checked`: a bound `undefined` (form reset) would throw with one
    let { checked = $bindable(), disabled = defaults('disabled', false), loading = defaults('loading', false), size = defaults('size', 'default'), onChange, checkedText = defaults('checkedText'), uncheckedText = defaults('uncheckedText'), ...rest }: SwitchProps = $props();

    let root = $state<HTMLDivElement>();

    const foundationProps: SwitchBaseProps = {
        get checked() {
            return checked;
        },
        get loading() {
            return loading;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, SwitchBaseProps, SwitchState>(
        SwitchFoundation,
        foundationProps,
        (view) => SwitchFoundation.getInitialState(view),
        () => ({
            notifyChange: (next, event) => {
                checked = next;
                onChange?.(next, event);
            },
        })
    );

    // Told by an enclosing Tooltip whose span wraps this switch: the input, not the span, takes the description, so the
    // pair stays one Tab stop; a disabled switch ignores the pointer when the span answers for it
    const bindTrigger = useTrigger(
        () => root,
        () => ({ disabled, loading: false, block: false, describes: true })
    );

    const shown = $derived(SwitchFoundation.deriveChecked({ checked }, states()));

    // aria-*, id, name, tabindex, autofocus and focus listeners name and focus the input, the only focus target
    const attrs = $derived(splitControlAttrs(rest, isNativeInputKey));
    const tooltip = $derived(bindTrigger());

    const handleChange = (event: Event & { currentTarget: HTMLInputElement }) => {
        const input = event.currentTarget;
        foundation.handleChange(input.checked, event);
        // a rejected change leaves `shown` as it was, so Svelte does not patch the box the browser already toggled
        input.checked = shown;
    };
</script>

<div
    bind:this={root}
    {...attrs.root}
    {...attachmentProps(rest)}
    class={[
        cssClasses.PREFIX,
        rest.class,
        {
            [cssClasses.CHECKED]: shown,
            [cssClasses.DISABLED]: disabled,
            [cssClasses.LARGE]: size === 'large',
            [cssClasses.SMALL]: size === 'small',
            [cssClasses.LOADING]: loading,
        },
    ]}
    style={[rest.style, tooltip?.pointerEventsNone && 'pointer-events: none'].filter(Boolean).join(';') || undefined}
>
    {#if loading}
        <Spin class={cssClasses.LOADING_SPIN} size={size === 'default' ? 'middle' : size} />
    {:else}
        <div aria-hidden="true" class={cssClasses.KNOB}></div>
    {/if}
    {#if checkedText && shown && size !== 'small'}
        <div class={cssClasses.CHECKED_TEXT} x-semi-prop="checkedText">{@render checkedText()}</div>
    {/if}
    {#if uncheckedText && !shown && size !== 'small'}
        <div class={cssClasses.UNCHECKED_TEXT} x-semi-prop="uncheckedText">{@render uncheckedText()}</div>
    {/if}
    <input {...attrs.control} aria-describedby={joinIds(rest['aria-describedby'], tooltip?.['aria-describedby'])} aria-disabled={loading || undefined} checked={shown} class={cssClasses.NATIVE_CONTROL} {disabled} role="switch" type="checkbox" onchange={handleChange} />
</div>

<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/switch/constants';
    import SwitchFoundation, { type SwitchAdapter, type SwitchBaseProps, type SwitchState } from '@fibrae/semi-foundation/switch/foundation';
    import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import '@fibrae/semi-foundation/switch/switch.scss';
    import { isNativeInputKey, splitControlAttrs } from '../_base/control-attrs.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import Spin from '../spin/spin.svelte';
    import useTrigger, { attachmentProps } from '../tooltip/use-trigger.svelte.js';
    import type { SwitchProps } from './interface.js';

    type Foundation = SwitchFoundation<SwitchBaseProps, SwitchState, Event>;
    type Adapter = SwitchAdapter<SwitchBaseProps, SwitchState, Event>;

    const defaults = useDefaultProps('Switch');

    // No fallback on `checked`: a bound `undefined` (form reset) would throw with one
    let { checked = $bindable(), disabled = defaults('disabled', false), loading = defaults('loading', false), size = defaults('size', 'default'), onChange, checkedText = defaults('checkedText'), uncheckedText = defaults('uncheckedText'), ...rest }: SwitchProps = $props();

    let root = $state<HTMLDivElement>();

    // $bindable needs destructuring, so the foundation reads the props through getters
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
        (base) => ({
            setChecked: (next) => base.setState({ checked: next }),
            notifyChange: (next, event) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
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

    watch(() => checked, foundation.setChecked);
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
        <Spin size={size === 'default' ? 'middle' : size} wrapperClassName={cssClasses.LOADING_SPIN} />
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

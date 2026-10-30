<script lang="ts">
    import CheckboxFoundation, { type BaseCheckboxProps, type CheckboxAdapter, type CheckboxBaseState, type CheckboxView } from '@fibrae/semi-foundation/checkbox/checkbox-foundation';
    import { checkboxClasses } from '@fibrae/semi-foundation/checkbox/constants';
    import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import { focusWithoutRing } from '@fibrae/semi-foundation/utils/supports';
    import '@fibrae/semi-foundation/checkbox/checkbox.scss';
    import { IconCheckboxIndeterminate, IconCheckboxTick } from '@fibrae/semi-icons-svelte';
    import { isNativeInputKey, splitControlAttrs } from '../_base/control-attrs.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import useTrigger, { attachmentProps } from '../tooltip/use-trigger.svelte.js';
    import { getCheckboxGroupContext } from './context.js';
    import type { CheckboxEvent, CheckboxProps } from './interface.js';

    type Foundation = CheckboxFoundation<BaseCheckboxProps, CheckboxBaseState>;
    type Adapter = CheckboxAdapter<BaseCheckboxProps, CheckboxBaseState>;

    const defaults = useDefaultProps('Checkbox');

    // No fallback on `checked`: a bound `undefined` (form reset) would throw with one
    let {
        checked = $bindable(),
        value,
        disabled = defaults('disabled', false),
        indeterminate = defaults('indeterminate', false),
        type = defaults('type', 'default'),
        addonId,
        extraId,
        prefixCls = defaults('prefixCls'),
        preventScroll = defaults('preventScroll'),
        name,
        onChange,
        onclick,
        children,
        extra,
        ...rest
    }: CheckboxProps = $props();

    const group = getCheckboxGroupContext();

    const uid = $props.id();
    let input = $state<HTMLInputElement>();
    let root = $state<HTMLSpanElement>();

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: BaseCheckboxProps = {
        get checked() {
            return checked;
        },
        get disabled() {
            return disabled;
        },
        get value() {
            return value;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, BaseCheckboxProps, CheckboxBaseState>(
        CheckboxFoundation,
        foundationProps,
        (props) => ({ checked: Boolean(props.checked) }),
        (base) => ({
            setChecked: (next) => base.setState({ checked: next }),
            notifyChange: (event) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                checked = event.target.checked;
                onChange?.(event as CheckboxEvent);
            },
            generateEvent: (next, event) => ({
                target: { checked: next, value, name: inputName, disabled: view.disabled },
                stopPropagation: () => event.stopPropagation(),
                preventDefault: () => event.preventDefault(),
                // only a click reaches the foundation, which types its source event structurally
                nativeEvent: event as MouseEvent,
            }),
            getIsInGroup: () => view.inGroup,
            getGroupValue: () => group?.view.value ?? [],
            notifyGroupChange: (event) => group?.onChange(event),
            getGroupDisabled: () => Boolean(group?.view.disabled),
            // A click on the text lands on the wrapper, not the input. Script focus matches :focus-visible when nothing
            // was focused before, so the focus a click moves in must say it is not keyboard focus.
            focusCheckboxEntity: () => {
                if (input && input !== input.ownerDocument.activeElement) {
                    focusWithoutRing(input, { preventScroll });
                }
            },
        })
    );

    // Told by an enclosing Tooltip whose span wraps this checkbox: the input, not the span, takes the description, so
    // the pair stays one Tab stop; a disabled checkbox ignores the pointer when the span answers for it
    const bindTrigger = useTrigger(
        () => root,
        () => ({ disabled: view.disabled, loading: false, block: false, describes: true })
    );

    // annotated because the adapter above reads it: inferring it would be circular
    const view: CheckboxView = $derived(CheckboxFoundation.deriveView({ checked, disabled, name: name ?? undefined, type, value, 'aria-invalid': rest['aria-invalid'] ?? undefined, 'aria-errormessage': rest['aria-errormessage'] ?? undefined }, states(), group?.view));
    const prefix = $derived(prefixCls || checkboxClasses.PREFIX);
    const addonDomId = $derived(addonId || `addon-${uid}`);
    const extraDomId = $derived(extraId || `extra-${uid}`);
    const inputName = $derived(view.name || undefined);

    // The native flag is what assistive technology reads as "mixed"; a checked box is never mixed.
    const showMixed = $derived(indeterminate && !view.checked);
    const labelledby = $derived(joinIds(rest['aria-labelledby'], children ? addonDomId : undefined));
    const tooltip = $derived(bindTrigger());
    const describedby = $derived(joinIds(rest['aria-describedby'], extra ? extraDomId : undefined, tooltip?.['aria-describedby']));

    // aria-*, id, tabindex, autofocus and focus listeners name and focus the input, the only focus target
    const attrs = $derived(splitControlAttrs(rest, isNativeInputKey));

    // The root is a span rather than a label so that text clicks and box clicks share this one handler (gitlab #364).
    // Links and buttons inside the label content keep their own behavior, as inside a native label.
    const handleClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLSpanElement }) => {
        onclick?.(event);
        if (event.target instanceof Element && CheckboxFoundation.isInnerInteractiveClick(event.target, event.currentTarget, input)) {
            return;
        }
        foundation.handleChange(event);
    };

    // The click already ran the foundation and the browser cleared the native flags; Svelte does not patch a value that
    // did not change, so a controlled box that refused the toggle is put back here.
    const handleInputChange = (event: Event & { currentTarget: HTMLInputElement }) => {
        event.currentTarget.checked = view.checked;
        event.currentTarget.indeterminate = showMixed;
    };

    watch(
        () => checked,
        (next) => foundation.setChecked(Boolean(next))
    );

    export function focus() {
        input?.focus({ preventScroll });
    }

    export function blur() {
        input?.blur();
    }
</script>

<span
    bind:this={root}
    {...attrs.root}
    {...attachmentProps(rest)}
    class={[
        prefix,
        rest.class,
        {
            [`${prefix}-disabled`]: view.disabled,
            [`${prefix}-indeterminate`]: indeterminate,
            [`${prefix}-checked`]: view.checked,
            [`${prefix}-unChecked`]: !view.checked,
            [`${prefix}-cardType`]: view.isCardType,
            [`${prefix}-cardType_disabled`]: view.disabled && view.isCardType,
            [`${prefix}-cardType_enable`]: !(view.disabled && view.isCardType),
            [`${prefix}-cardType_checked`]: view.isCardType && view.checked && !view.disabled,
            [`${prefix}-cardType_checked_disabled`]: view.isCardType && view.checked && view.disabled,
        },
    ]}
    style={[rest.style, tooltip?.pointerEventsNone && 'pointer-events: none'].filter(Boolean).join(';') || undefined}
    onclick={handleClick}
>
    <span class={[`${prefix}-inner`, { [`${prefix}-inner-checked`]: view.checked, [`${prefix}-inner-pureCardType`]: view.isPureCardType }]}>
        <input
            {...attrs.control}
            aria-describedby={describedby}
            aria-errormessage={view.ariaErrormessage}
            aria-invalid={view.ariaInvalid}
            aria-labelledby={labelledby}
            bind:this={input}
            checked={view.checked}
            class={checkboxClasses.INPUT}
            disabled={view.disabled}
            indeterminate={showMixed}
            name={inputName}
            type="checkbox"
            value={value === undefined ? undefined : String(value)}
            onchange={handleInputChange}
        />
        <span class="{prefix}-inner-display">
            {#if view.checked}
                <IconCheckboxTick />
            {:else if indeterminate}
                <IconCheckboxIndeterminate />
            {/if}
        </span>
    </span>
    {#if children || extra}
        <div class="{prefix}-content">
            {#if children}
                <span class="{prefix}-addon" id={addonDomId} x-semi-prop="children">{@render children()}</span>
            {/if}
            {#if extra}
                <div class={[`${prefix}-extra`, { [`${prefix}-cardType_extra_noChildren`]: view.isCardType && !children }]} id={extraDomId} x-semi-prop="extra">{@render extra()}</div>
            {/if}
        </div>
    {/if}
</span>

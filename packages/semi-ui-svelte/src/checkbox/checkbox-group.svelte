<script lang="ts">
    import type { CheckboxGroupView } from '@fibrae/semi-foundation/checkbox/checkbox-foundation';
    import CheckboxGroupFoundation, { type CheckboxGroupAdapter, type CheckboxGroupBaseProps, type CheckboxGroupBaseState } from '@fibrae/semi-foundation/checkbox/checkbox-group-foundation';
    import { checkboxGroupClasses, strings } from '@fibrae/semi-foundation/checkbox/constants';
    import '@fibrae/semi-foundation/checkbox/checkbox.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import Checkbox from './checkbox.svelte';
    import { setCheckboxGroupContext } from './context.js';
    import type { CheckboxGroupProps, CheckboxOptionItem } from './interface.js';

    type Foundation = CheckboxGroupFoundation<CheckboxGroupBaseProps, CheckboxGroupBaseState>;
    type Adapter = CheckboxGroupAdapter<CheckboxGroupBaseProps, CheckboxGroupBaseState>;

    const defaults = useDefaultProps('CheckboxGroup');

    // No fallback on `value`: a bound `undefined` (form reset) would throw with one
    let {
        value = $bindable(),
        disabled = defaults('disabled', false),
        name = defaults('name'),
        options = defaults('options'),
        direction = defaults('direction', 'vertical'),
        type = defaults('type', 'default'),
        prefixCls = defaults('prefixCls'),
        onChange,
        onBlur,
        onfocusout,
        label,
        extra,
        children,
        ...rest
    }: CheckboxGroupProps = $props();

    // One name per group, so form submission never mixes groups.
    const uid = $props.id();

    // role="group" supports none of these. aria-invalid and aria-errormessage go to each checkbox (the role supports
    // them there); aria-required is dropped: on each checkbox it would mean every one is required, not "at least one".
    // Tooltip injects the rest for a dialog trigger, and tabindex would add a stray Tab stop.
    const DROPPED_ATTRS = new Set(['aria-invalid', 'aria-errormessage', 'aria-required', 'aria-expanded', 'aria-haspopup', 'aria-controls', 'tabindex', 'tabIndex']);

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: CheckboxGroupBaseProps = {
        get value() {
            return value;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, CheckboxGroupBaseProps, CheckboxGroupBaseState>(
        CheckboxGroupFoundation,
        foundationProps,
        (props) => ({ value: Array.isArray(props.value) ? props.value : [] }),
        (base) => ({
            updateGroupValue: (next) => base.setState({ value: next }),
            notifyChange: (next) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                value = next;
                onChange?.(next);
            },
        })
    );

    const isPureCardType = $derived(type === strings.TYPE_PURECARD);
    const isCardType = $derived(type === strings.TYPE_CARD || isPureCardType);
    const prefix = $derived(prefixCls || checkboxGroupClasses.PREFIX);
    const items = $derived<CheckboxOptionItem[]>((options ?? []).map((option) => (typeof option === 'string' ? { label: option, value: option } : option)));
    const rootAttrs = $derived(Object.fromEntries(Object.entries(rest).filter(([key]) => !DROPPED_ATTRS.has(key))));

    const view: CheckboxGroupView = $derived({
        value: CheckboxGroupFoundation.deriveValue({ value }, states()) ?? [],
        disabled,
        name: name || uid,
        isCardType,
        isPureCardType,
        ariaInvalid: rest['aria-invalid'] ?? undefined,
        ariaErrormessage: rest['aria-errormessage'] ?? undefined,
    });

    setCheckboxGroupContext({
        get view() {
            return view;
        },
        onChange: foundation.handleChange,
    });

    // Moving between the boxes is not leaving the group: a form's blur validation waits until focus is outside.
    const handleFocusout = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        onfocusout?.(event);
        if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
            onBlur?.(event);
        }
    };

    watch(() => value, foundation.handlePropValueChange);
</script>

<div {...rootAttrs} class={[prefix, `${prefix}-wrapper`, direction && `${prefix}-${direction}`, direction && isCardType && `${prefix}-${direction}-cardType`, direction && isPureCardType && `${prefix}-${direction}-pureCardType`, rest.class]} role="group" onfocusout={handleFocusout}>
    {#if options}
        {#each items as option, index (index)}
            {#snippet itemLabel()}
                {#if label}{@render label({ option, index })}{:else}{option.label}{/if}
            {/snippet}
            {#snippet itemExtra()}
                {#if extra}{@render extra({ option, index })}{:else}{option.extra}{/if}
            {/snippet}
            <Checkbox children={option.label !== undefined || label ? itemLabel : undefined} class={option.class} disabled={option.disabled || disabled} extra={option.extra !== undefined || extra ? itemExtra : undefined} {prefixCls} style={option.style} value={option.value} />
        {/each}
    {:else}
        {@render children?.()}
    {/if}
</div>

<script lang="ts">
    import type { CheckboxGroupView } from '@fibrae/semi-foundation/components/checkbox/checkbox-foundation';
    import CheckboxGroupFoundation, { type CheckboxGroupAdapter, type CheckboxGroupBaseProps, type CheckboxGroupBaseState } from '@fibrae/semi-foundation/components/checkbox/checkbox-group-foundation';
    import { checkboxGroupClasses, strings } from '@fibrae/semi-foundation/components/checkbox/constants';
    import '@fibrae/semi-foundation/components/checkbox/checkbox.scss';
    import useDefaultProps from '../../base/use-default-props.js';
    import useFoundation from '../../base/use-foundation.svelte.js';
    import Checkbox from './checkbox.svelte';
    import { setCheckboxGroupContext } from './context.js';
    import type { CheckboxGroupProps, CheckboxOptionItem } from './interface.js';

    type Foundation = CheckboxGroupFoundation<CheckboxGroupBaseProps>;
    type Adapter = CheckboxGroupAdapter<CheckboxGroupBaseProps>;

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

    const uid = $props.id();

    // role="group" supports none of these. aria-invalid and aria-errormessage go to each checkbox (the role supports
    // them there); aria-required is dropped: on each checkbox it would mean every one is required, not "at least one".
    // Tooltip injects the rest for a dialog trigger, and tabindex would add a stray Tab stop.
    const DROPPED_ATTRS = new Set(['aria-invalid', 'aria-errormessage', 'aria-required', 'aria-expanded', 'aria-haspopup', 'aria-controls', 'tabindex', 'tabIndex']);

    const foundationProps: CheckboxGroupBaseProps = {
        get value() {
            return value;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, CheckboxGroupBaseProps, CheckboxGroupBaseState>(
        CheckboxGroupFoundation,
        foundationProps,
        (props) => CheckboxGroupFoundation.getInitialState(props),
        () => ({
            notifyChange: (next) => {
                value = next;
                onChange?.(next);
            },
            notifyBlur: (event) => onBlur?.(event),
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

    const handleFocusout = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        onfocusout?.(event);
        foundation.handleBlur(event);
    };
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

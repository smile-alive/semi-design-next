<script lang="ts">
    import { SvelteSet } from 'svelte/reactivity';
    import { radioGroupClasses, strings } from '@fibrae/semi-foundation/radio/constants';
    import RadioGroupFoundation, { type RadioGroupAdapter, type RadioGroupBaseProps, type RadioGroupBaseState } from '@fibrae/semi-foundation/radio/radio-group-foundation';
    import '@fibrae/semi-foundation/radio/radio.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { setRadioGroupContext } from './context.js';
    import type { RadioGroupProps, RadioOptionItem, RadioValue } from './interface.js';
    import Radio from './radio.svelte';

    type Foundation = RadioGroupFoundation<RadioGroupBaseProps, RadioGroupBaseState>;
    type Adapter = RadioGroupAdapter<RadioGroupBaseProps, RadioGroupBaseState>;

    const defaults = useDefaultProps('RadioGroup');

    // No fallback on `value`: a bound `undefined` (form reset) would throw with one
    let {
        value = $bindable(),
        disabled = defaults('disabled', false),
        name = defaults('name'),
        options = defaults('options'),
        direction = defaults('direction', 'horizontal'),
        mode = defaults('mode', ''),
        type = defaults('type', 'default'),
        buttonSize = defaults('buttonSize', 'middle'),
        prefixCls = defaults('prefixCls'),
        onChange,
        onBlur,
        children,
        label,
        extra,
        ...rest
    }: RadioGroupProps = $props();

    // one name per group keeps arrow keys and form submission inside the group
    const uid = $props.id();
    const syncs = new SvelteSet<() => void>();

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: RadioGroupBaseProps = {
        get mode() {
            return mode;
        },
        get value() {
            return value;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, RadioGroupBaseProps, RadioGroupBaseState>(
        RadioGroupFoundation,
        foundationProps,
        (view) => ({ value: view.value }),
        (base) => ({
            setValue: (next) => base.setState({ value: next }),
            notifyChange: (event) => {
                // a value written locally makes the group read as controlled, so the state follows it for a later write of `undefined`
                base.setState({ value: event.target.value });
                value = event.target.value as RadioValue | undefined;
                onChange?.(event as Parameters<NonNullable<typeof onChange>>[0]);
            },
        })
    );

    // A radiogroup supports none of these; Tooltip injects them for a dialog trigger and tabindex adds a stray Tab stop.
    const DROPPED_ATTRS = ['aria-expanded', 'aria-haspopup', 'aria-controls', 'tabindex'];
    const current = $derived(value === undefined ? (states().value as RadioValue | undefined) : value);
    const isButtonRadio = $derived(type === strings.TYPE_BUTTON);
    const isPureCardRadio = $derived(type === strings.TYPE_PURECARD);
    const isCardRadio = $derived(type === strings.TYPE_CARD || isPureCardRadio);
    const prefix = $derived(prefixCls || radioGroupClasses.PREFIX);
    const items = $derived<RadioOptionItem[]>((options ?? []).map((option) => (typeof option === 'string' ? { label: option, value: option } : option)));
    const rootAttrs = $derived(Object.fromEntries(Object.entries(rest).filter(([key]) => !DROPPED_ATTRS.includes(key))));

    setRadioGroupContext({
        get value() {
            return current;
        },
        get disabled() {
            return Boolean(disabled);
        },
        get name() {
            return name || uid;
        },
        get prefixCls() {
            return prefixCls;
        },
        get isButtonRadio() {
            return isButtonRadio;
        },
        get isCardRadio() {
            return isCardRadio;
        },
        get isPureCardRadio() {
            return isPureCardRadio;
        },
        get buttonSize() {
            return buttonSize;
        },
        get mode() {
            return mode;
        },
        handleChange: foundation.handleChange,
        register: (sync) => {
            syncs.add(sync);
            return () => void syncs.delete(sync);
        },
        sync: () => syncs.forEach((sync) => sync()),
    });

    // Moving between the radios is not leaving the group: a form's blur validation waits until focus is outside.
    const handleFocusout = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        rest.onfocusout?.(event);
        if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
            onBlur?.(event);
        }
    };

    watch(
        () => value,
        (next) => foundation.handlePropValueChange(next as RadioValue)
    );
</script>

<div
    {...rootAttrs}
    class={[
        prefix,
        `${prefix}-wrapper`,
        rest.class,
        {
            [`${prefix}-${direction}`]: direction && !isButtonRadio,
            [`${prefix}-${direction}-default`]: direction && type === 'default',
            [`${prefix}-${direction}-card`]: direction && isCardRadio,
            [`${prefix}-buttonRadio`]: isButtonRadio,
        },
    ]}
    role="radiogroup"
    onfocusout={handleFocusout}
>
    {#if options}
        {#each items as option, index (index)}
            {#snippet optionLabel()}
                {#if label}{@render label({ option, index })}{:else}{option.label}{/if}
            {/snippet}
            {#snippet optionExtra()}
                {#if extra}{@render extra({ option, index })}{:else}{option.extra}{/if}
            {/snippet}
            <Radio
                addonClassName={option.addonClass}
                addonId={option.addonId}
                addonStyle={option.addonStyle}
                children={option.label !== undefined || label ? optionLabel : undefined}
                class={option.class}
                disabled={option.disabled || disabled}
                extra={option.extra !== undefined || extra ? optionExtra : undefined}
                extraId={option.extraId}
                style={option.style}
                value={option.value}
            />
        {/each}
    {:else}
        {@render children?.()}
    {/if}
</div>

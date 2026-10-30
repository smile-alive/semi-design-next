<script lang="ts">
    import { onMount } from 'svelte';
    import { radioClasses } from '@fibrae/semi-foundation/radio/constants';
    import RadioFoundation, { type RadioAdapter, type RadioBaseProps, type RadioBaseState, type RadioChangeEvent as FoundationRadioChangeEvent } from '@fibrae/semi-foundation/radio/radio-foundation';
    import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import '@fibrae/semi-foundation/radio/radio.scss';
    import { IconRadio } from '@fibrae/semi-icons-svelte';
    import { isNativeInputKey, splitControlAttrs } from '../_base/control-attrs.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { getRadioGroupContext } from './context.js';
    import type { RadioChangeEvent, RadioProps, RadioValue } from './interface.js';

    type Foundation = RadioFoundation<RadioBaseProps, RadioBaseState>;
    type Adapter = RadioAdapter<RadioBaseProps, RadioBaseState>;

    const defaults = useDefaultProps('Radio');

    // No fallback on `checked`: a bound `undefined` (form reset) would throw with one
    let {
        checked = $bindable(),
        value,
        disabled = defaults('disabled'),
        displayMode = defaults('displayMode'),
        mode = defaults('mode', ''),
        type = defaults('type', 'default'),
        addonStyle = defaults('addonStyle'),
        addonClassName = defaults('addonClassName'),
        addonId,
        extraId,
        prefixCls,
        preventScroll = defaults('preventScroll'),
        onChange,
        children,
        extra,
        ...rest
    }: RadioProps = $props();

    const group = getRadioGroupContext();

    const uid = $props.id();
    let input: HTMLInputElement | undefined = $state();

    // The last value this radio wrote to `checked`. Writing an unbound bindable prop overrides it locally, which would
    // make an uncontrolled radio read as controlled; a `checked` equal to the echo counts as uncontrolled instead.
    let echoed: boolean | undefined;

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: RadioBaseProps = {
        get checked() {
            return checked === echoed ? undefined : checked;
        },
        get disabled() {
            return disabled;
        },
        get mode() {
            return mode;
        },
        get name() {
            return rest.name ?? undefined;
        },
        get prefixCls() {
            return prefixCls;
        },
        get type() {
            return type;
        },
        get value() {
            return value;
        },
    };

    // Not a `$props()` fallback: a RadioGroup's prefixCls must rank above the global default
    const globalPrefixCls = defaults('prefixCls');

    // The radio role supports neither aria-invalid, aria-errormessage nor aria-required (they belong on the radiogroup)
    const UNSUPPORTED_ARIA = ['aria-invalid', 'aria-errormessage', 'aria-required'];
    const innerPrefix = $derived(prefixCls ?? globalPrefixCls ?? radioClasses.PREFIX);
    const addonDomId = $derived(addonId || `addon-${uid}`);
    const extraDomId = $derived(extraId || `extra-${uid}`);
    const attrs = $derived(splitControlAttrs(rest, isNativeInputKey));
    const controlAttrs = $derived(Object.fromEntries(Object.entries(attrs.control).filter(([key]) => !UNSUPPORTED_ARIA.includes(key))));

    // The browser repeats a click on the label text as a click on the input, so the owner's onclick is forwarded for the
    // input's click only. shortcut: only the plain `onclick` handler is wrapped; capture-phase `onclickcapture` keeps the
    // label-level call, wrap it the same way once a consumer relies on it.
    const rootAttrs = $derived.by(() => {
        const { onclick: _onclick, ...root } = attrs.root;
        return root;
    });

    const labelledby = $derived(joinIds(rest['aria-labelledby'], children ? addonDomId : undefined));
    const inputName = $derived(rest.name ?? group?.name);

    const groupView = () => (group ? { mode: group.mode, radioGroup: group } : null);

    const { foundation, states } = useFoundation<Foundation, Adapter, RadioBaseProps, RadioBaseState>(
        RadioFoundation,
        foundationProps,
        (view) => RadioFoundation.getInitialState(view),
        (base) => ({
            setChecked: (next) => base.setState({ checked: next }),
            notifyGroupChange: (event) => group?.handleChange(pick(event)),
            notifyChange: (event) => {
                const picked = pick(event);
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                echoed = picked.target.checked;
                checked = echoed;
                onChange?.(picked);
            },
            getInput: () => input ?? null,
        }),
        { context: groupView }
    );

    const view = $derived(RadioFoundation.deriveView({ ...foundationProps, prefixCls: prefixCls ?? group?.prefixCls ?? globalPrefixCls }, states(), groupView()));
    const prefix = $derived(view.prefixCls || radioClasses.PREFIX);
    const hasExtra = $derived(Boolean(extra) && !view.isButtonRadio);
    const describedby = $derived(joinIds(rest['aria-describedby'], hasExtra ? extraDomId : undefined, rest['aria-invalid'] ? rest['aria-errormessage'] : undefined));

    const pick = (event: FoundationRadioChangeEvent): RadioChangeEvent => {
        return {
            target: {
                checked: event.target.checked,
                value: event.target.value as RadioValue | undefined,
                name: event.target.name as string | undefined,
                disabled: Boolean(event.target.disabled),
            },
            stopPropagation: event.stopPropagation,
            preventDefault: event.preventDefault,
        };
    };

    // A native radio checks itself and unchecks its same-name siblings on click. Svelte does not patch a value that did
    // not change, so when the owner refuses the change the DOM is written back by hand.
    const sync = () => {
        if (input) {
            input.checked = view.checked;
        }
    };

    const requestSync = () => {
        if (group) {
            group.sync();
        } else {
            sync();
        }
    };

    const handleLabelClick = (event: MouseEvent) => {
        if (event.target === input) {
            (attrs.root.onclick as ((event: MouseEvent) => void) | undefined)?.(event);
        }
    };

    const handleChange = (event: Event & { currentTarget: HTMLInputElement }) => {
        foundation.handleChange(event.currentTarget.checked, event);
        requestSync();
    };

    const handleClick = (event: MouseEvent) => {
        // Clicking an unchecked radio is followed by a change event; writing back before it would hide the new state.
        const wasChecked = view.checked;
        foundation.handleClick(event);
        if (wasChecked) {
            requestSync();
        }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
        const wasChecked = view.checked;
        foundation.handleKeyUp(event);
        if (wasChecked) {
            requestSync();
        }
    };

    watch(
        () => checked,
        (next) => foundation.setChecked(Boolean(next))
    );

    onMount(() => group?.register(sync));

    export function focus() {
        input?.focus({ preventScroll });
    }

    export function blur() {
        input?.blur();
    }
</script>

<label
    {...rootAttrs}
    class={[
        prefix,
        rest.class,
        {
            [`${prefix}-disabled`]: view.disabled,
            [`${prefix}-checked`]: view.checked,
            [`${prefix}-${displayMode}`]: Boolean(displayMode),
            [`${prefix}-buttonRadioComponent`]: !view.inGroup && view.isButtonRadio,
            [`${prefix}-buttonRadioGroup`]: view.isButtonRadio,
            [`${prefix}-buttonRadioGroup-${view.buttonSize}`]: view.isButtonRadio && view.buttonSize,
            [`${prefix}-cardRadioGroup`]: view.isCardRadio,
            [`${prefix}-cardRadioGroup_disabled`]: view.disabled && view.isCardRadio,
            [`${prefix}-cardRadioGroup_checked`]: view.isCardRadio && view.checked && !view.disabled,
            [`${prefix}-cardRadioGroup_checked_disabled`]: view.isCardRadio && view.checked && view.disabled,
        },
    ]}
    onclick={handleLabelClick}
>
    <span
        class={[
            `${innerPrefix}-inner`,
            {
                [`${innerPrefix}-inner-checked`]: view.checked,
                [`${innerPrefix}-inner-buttonRadio`]: view.isButtonRadio,
                [`${innerPrefix}-inner-pureCardRadio`]: view.isPureCardRadio,
            },
        ]}
    >
        <input bind:this={input} {...controlAttrs} aria-describedby={describedby} aria-labelledby={labelledby} checked={view.checked} disabled={view.disabled} name={inputName} type="radio" value={value === undefined ? undefined : String(value)} onchange={handleChange} onclick={handleClick} onkeyup={handleKeyUp} />
        <span class={{ [`${innerPrefix}-inner-display`]: !view.isButtonRadio }}>
            {#if view.checked}
                <IconRadio />
            {/if}
        </span>
    </span>
    {#if children || extra}
        <div class={[`${prefix}-content`, { [`${prefix}-isCardRadioGroup_content`]: view.isCardRadio }]}>
            {#if children}
                <span
                    class={[
                        addonClassName,
                        {
                            [`${prefix}-addon`]: !view.isButtonRadio,
                            [`${prefix}-addon-buttonRadio`]: view.isButtonRadio,
                            [`${prefix}-addon-buttonRadio-checked`]: view.isButtonRadio && view.checked,
                            [`${prefix}-addon-buttonRadio-disabled`]: view.isButtonRadio && view.disabled,
                            [`${prefix}-addon-buttonRadio-${view.buttonSize}`]: view.isButtonRadio && view.buttonSize,
                        },
                    ]}
                    id={addonDomId}
                    style={addonStyle}
                    x-semi-prop="children"
                >
                    {@render children()}
                </span>
            {/if}
            {#if extra && !view.isButtonRadio}
                <div class="{prefix}-extra" id={extraDomId} x-semi-prop="extra">{@render extra()}</div>
            {/if}
        </div>
    {/if}
</label>

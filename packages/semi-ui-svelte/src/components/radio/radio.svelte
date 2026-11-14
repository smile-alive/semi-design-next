<script lang="ts">
    import { onMount } from 'svelte';
    import { radioClasses } from '@fibrae/semi-foundation/components/radio/constants';
    import RadioFoundation, { type RadioAdapter, type RadioBaseProps, type RadioBaseState } from '@fibrae/semi-foundation/components/radio/radio-foundation';
    import { joinIds } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/radio/radio.scss';
    import { IconRadio } from '@fibrae/semi-icons-svelte';
    import { useDefaultProps, useFoundation } from '../../base/index.js';
    import { isNativeInputKey, splitControlAttrs } from '../../utils/index.js';
    import { getRadioGroupContext } from './context.js';
    import type { RadioProps } from './interface.js';

    type Foundation = RadioFoundation<RadioBaseProps>;
    type Adapter = RadioAdapter<RadioBaseProps>;

    const defaults = useDefaultProps('Radio');

    // No fallback on `checked`: a bound `undefined` (form reset) would throw with one
    let {
        checked = $bindable(),
        value,
        disabled = defaults('disabled'),
        displayMode = defaults('displayMode'),
        mode = defaults('mode', ''),
        type = defaults('type', 'default'),
        classNames = defaults('classNames'),
        styles = defaults('styles'),
        addonId,
        extraId,
        preventScroll = defaults('preventScroll'),
        onChange,
        children,
        extra,
        ...rest
    }: RadioProps = $props();

    const group = getRadioGroupContext();

    const uid = $props.id();
    let input: HTMLInputElement | undefined = $state();

    // The last value an unbound radio wrote to `checked`. Writing an unbound bindable prop overrides it locally, which
    // would make an uncontrolled radio read as controlled; a `checked` equal to the echo counts as uncontrolled instead.
    // null marks a parent that bound the echo and then reset it: the foundation must see that change, as a controlled
    // empty value. Each read of the getter leaves the same answer for the same `checked`.
    let echoed: boolean | null | undefined;

    const foundationProps: RadioBaseProps = {
        get checked() {
            if (checked === echoed) {
                return undefined;
            }
            echoed = checked === undefined ? null : undefined;
            return checked === undefined ? null : checked;
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
        get type() {
            return type;
        },
        get value() {
            return value;
        },
    };

    const prefix = radioClasses.PREFIX;

    // The radio role supports neither aria-invalid, aria-errormessage nor aria-required (they belong on the radiogroup)
    const UNSUPPORTED_ARIA = ['aria-invalid', 'aria-errormessage', 'aria-required'];
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
    const inputName = $derived(group?.name ?? rest.name);

    const groupView = () => (group ? { mode: group.mode, radioGroup: group } : null);

    const { foundation, states } = useFoundation<Foundation, Adapter, RadioBaseProps, RadioBaseState>(
        RadioFoundation,
        foundationProps,
        (view) => RadioFoundation.getInitialState(view),
        () => ({
            notifyGroupChange: (event) => group?.handleChange(event),
            notifyChange: (event) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                echoed = foundationProps.checked === undefined ? event.target.checked : undefined;
                checked = event.target.checked;
                onChange?.(event);
            },
            getInput: () => input ?? null,
        }),
        { context: groupView }
    );

    const view = $derived(RadioFoundation.deriveView(foundationProps, states(), groupView()));
    const hasExtra = $derived(Boolean(extra) && !view.isButtonRadio);
    const describedby = $derived(joinIds(rest['aria-describedby'], hasExtra ? extraDomId : undefined, rest['aria-invalid'] ? rest['aria-errormessage'] : undefined));

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
            `${prefix}-inner`,
            {
                [`${prefix}-inner-checked`]: view.checked,
                [`${prefix}-inner-buttonRadio`]: view.isButtonRadio,
                [`${prefix}-inner-pureCardRadio`]: view.isPureCardRadio,
            },
        ]}
    >
        <input bind:this={input} {...controlAttrs} aria-describedby={describedby} aria-labelledby={labelledby} checked={view.checked} disabled={view.disabled} name={inputName} type="radio" value={value === undefined ? undefined : String(value)} onchange={handleChange} onclick={handleClick} onkeyup={handleKeyUp} />
        <span class={{ [`${prefix}-inner-display`]: !view.isButtonRadio }}>
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
                        {
                            [`${prefix}-addon`]: !view.isButtonRadio,
                            [`${prefix}-addon-buttonRadio`]: view.isButtonRadio,
                            [`${prefix}-addon-buttonRadio-checked`]: view.isButtonRadio && view.checked,
                            [`${prefix}-addon-buttonRadio-disabled`]: view.isButtonRadio && view.disabled,
                            [`${prefix}-addon-buttonRadio-${view.buttonSize}`]: view.isButtonRadio && view.buttonSize,
                        },
                        classNames?.addon,
                    ]}
                    id={addonDomId}
                    style={styles?.addon}
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

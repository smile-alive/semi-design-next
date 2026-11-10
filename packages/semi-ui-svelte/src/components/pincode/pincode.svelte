<script lang="ts">
    import { FORM_INJECTED_PROP_KEYS } from '@fibrae/semi-foundation/components/form/constants';
    import { cssClasses } from '@fibrae/semi-foundation/components/pincode/constants';
    import PinCodeFoundation, { type PinCodeAdapter, type PinCodeBaseProps } from '@fibrae/semi-foundation/components/pincode/foundation';
    import { formatLocale } from '@fibrae/semi-foundation/locale';
    import '@fibrae/semi-foundation/components/pincode/pincode.scss';
    import { useDefaultProps, useFoundation } from '../../base/index.js';
    import { splitControlAttrs } from '../../utils/index.js';
    import { getConfigContext } from '../config-provider/context.js';
    import { Input, type InputChangeEvent } from '../input/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { PinCodeProps, PinCodeState } from './interface.js';

    type Foundation = PinCodeFoundation<PinCodeBaseProps>;
    type Adapter = PinCodeAdapter<PinCodeBaseProps>;

    const defaults = useDefaultProps('PinCode');

    // No fallback on `value`: a bound `undefined` (form reset) would throw with one
    let { value = $bindable(), count = defaults('count', 6), format = defaults('format', 'number'), autofocus = defaults('autofocus', false), disabled = defaults('disabled'), size = defaults('size'), validateStatus = defaults('validateStatus'), onChange, onComplete, onFocus, onBlur, ...rest }: PinCodeProps = $props();

    const locale = useLocale('PinCode');
    const config = getConfigContext();

    let inputs = $state<(ReturnType<typeof Input> | undefined)[]>([]);

    // The inputs are the focus targets, so their description and state go to each one; on the root a Tooltip's
    // tabindex would add an extra tab stop. The caller's name stays on the group.
    const cellKeys = new Set(['id', 'tabindex', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-required']);

    // injected by Form: not DOM attributes, and no single cell carries the code's name
    const dropped = new Set<string>([...FORM_INJECTED_PROP_KEYS, 'name']);

    const foundationProps: PinCodeBaseProps = {
        get value() {
            return value;
        },
        get format() {
            return format;
        },
        get count() {
            return count;
        },
        get disabled() {
            return disabled;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, PinCodeBaseProps, PinCodeState>(
        PinCodeFoundation,
        foundationProps,
        (view) => PinCodeFoundation.getInitialState(view),
        () => ({
            notifyValueChange: (values) => {
                const next = values.join('');
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                value = next;
                onChange?.(next);
            },
            notifyComplete: (next) => onComplete?.(next),
            notifyFocus: (event) => onFocus?.(event),
            notifyBlur: (event) => onBlur?.(event),
            changeSpecificInputFocusState: (index, focusState) => {
                if (focusState === 'focus') {
                    inputs[index]?.focus();
                } else {
                    inputs[index]?.blur();
                }
            },
        }),
        { context: () => config }
    );

    const attrs = $derived(splitControlAttrs(rest, (key) => cellKeys.has(key)));
    const rootAttrs = $derived(Object.fromEntries(Object.entries(attrs.root).filter(([key]) => !dropped.has(key))));

    const digitLabel = (index: number) => formatLocale(locale().locale.digit, { index: index + 1, count });

    // Form's id goes on the first cell so clicking the label focuses it
    const cellAttrs = (index: number) => (index === 0 ? attrs.control : { ...attrs.control, id: undefined });

    const handleCellChange = (index: number, text: string, event: InputChangeEvent) => foundation.handleCellChange(index, text, event instanceof InputEvent || event instanceof CompositionEvent ? event.data : undefined);

    const handleFocusIn = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        rest.onfocusin?.(event);
        foundation.handleFocus(event);
    };

    const handleFocusOut = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        rest.onfocusout?.(event);
        foundation.handleBlur(event);
    };

    export function focus(index: number) {
        inputs[index]?.focus();
        inputs[index]?.setSelectionRange(1, 1);
    }

    export function blur(index: number) {
        inputs[index]?.blur();
    }
</script>

<div role="group" {...rootAttrs} class={[`${cssClasses.PREFIX}-wrapper`, rootAttrs.class]} onfocusin={handleFocusIn} onfocusout={handleFocusOut}>
    {#each { length: count } as _, index (index)}
        <Input
            aria-label={digitLabel(index)}
            autofocus={autofocus && index === 0}
            bind:this={inputs[index]}
            bind:value={() => states().valueList[index] ?? '', () => {}}
            composition
            {disabled}
            inputmode={format === 'number' ? 'numeric' : 'text'}
            showClear={false}
            {size}
            {validateStatus}
            {...cellAttrs(index)}
            onChange={(text, event) => handleCellChange(index, text, event)}
            onFocus={() => foundation.handleCurrentActiveIndexChange(index, 'focus')}
            onKeyDown={(event) => foundation.handleKeyDownOnSingleInput(event, index)}
            onpaste={(event) => foundation.handlePaste(event, index)}
        />
    {/each}
</div>

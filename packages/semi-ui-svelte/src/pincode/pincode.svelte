<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/pincode/constants';
    import PinCodeFoundation, { type PinCodeAdapter, type PinCodeBaseProps } from '@fibrae/semi-foundation/pincode/foundation';
    import '@fibrae/semi-foundation/pincode/pincode.scss';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { Input, type InputChangeEvent } from '../input/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { PinCodeProps, PinCodeState } from './interface.js';

    type Foundation = PinCodeFoundation<PinCodeBaseProps, PinCodeState>;
    type Adapter = PinCodeAdapter<PinCodeBaseProps, PinCodeState>;

    const defaults = useDefaultProps('PinCode');

    // No fallback on `value`: a bound `undefined` (form reset) would throw with one
    let { value = $bindable(), count = defaults('count', 6), format = defaults('format', 'number'), autofocus = defaults('autofocus', false), disabled = defaults('disabled'), size = defaults('size'), validateStatus = defaults('validateStatus'), onChange, onComplete, onFocus, onBlur, ...rest }: PinCodeProps = $props();

    const locale = useLocale('PinCode');

    // each cell stores its own handle by index
    let inputs = $state<(ReturnType<typeof Input> | undefined)[]>([]);

    // The inputs are the focus targets, so their description and state go to each one; on the root a Tooltip's
    // tabindex would add an extra tab stop. The caller's name stays on the group.
    const cellKeys = new Set(['id', 'tabindex', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-required']);

    // injected by Form: not DOM attributes, and no single cell carries the code's name
    const dropped = new Set(['name', 'insetLabel', 'insetLabelId']);

    // $bindable needs destructuring, so the foundation reads the props through getters
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
        // by code point, so a character outside the BMP is not split into two lone surrogates
        (view) => ({ valueList: Array.from(view.value ?? ''), currentActiveIndex: 0 }),
        (base) => ({
            // resolve after the commit: a controlled paste awaits the parent's new value before the next character
            onCurrentActiveIndexChange: (currentActiveIndex) => new Promise<void>((resolve) => base.setState({ currentActiveIndex }, resolve)),
            updateValueList: (valueList) => new Promise<void>((resolve) => base.setState({ valueList }, resolve)),
            notifyValueChange: (values) => {
                const next = values.join('');
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                value = next;
                onChange?.(next);
            },
            notifyComplete: (next) => onComplete?.(next),
            changeSpecificInputFocusState: (index, focusState) => {
                if (focusState === 'focus') {
                    inputs[index]?.focus();
                } else {
                    inputs[index]?.blur();
                }
            },
        })
    );

    const attrs = $derived(splitControlAttrs(rest, (key) => cellKeys.has(key)));
    const rootAttrs = $derived(Object.fromEntries(Object.entries(attrs.root).filter(([key]) => !dropped.has(key))));

    const digitLabel = (index: number) =>
        locale()
            .locale.digit.replace('${index}', String(index + 1))
            .replace('${count}', String(count));

    // Form's id goes on the first cell so clicking the label focuses it
    const cellAttrs = (index: number) => (index === 0 ? attrs.control : { ...attrs.control, id: undefined });

    const handleCellChange = (index: number, text: string, event: InputChangeEvent) => foundation.handleCellChange(index, text, event instanceof InputEvent || event instanceof CompositionEvent ? event.data : undefined);

    // moving between the digits is not entering or leaving the code: Form's blur validation waits until focus is outside
    const isOutside = (event: FocusEvent & { currentTarget: HTMLElement }) => !(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget));

    const handleFocusIn = (event: FocusEvent & { currentTarget: HTMLElement }) => {
        if (isOutside(event)) {
            onFocus?.(event);
        }
    };

    const handleFocusOut = (event: FocusEvent & { currentTarget: HTMLElement }) => {
        if (isOutside(event)) {
            onBlur?.(event);
        }
    };

    watch(
        () => value,
        (next) => foundation.updateValueList(Array.from(next || ''))
    );

    /** Focuses the input at `index` (0-based) with the caret after its character */
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

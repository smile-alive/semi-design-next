<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/time-picker/constants';
    import TimeInputFoundation, { type TimeInputAdapter, type TimeInputState } from '@fibrae/semi-foundation/components/time-picker/input-foundation';
    import { IconClock } from '@fibrae/semi-icons-svelte';
    import useFoundation from '../../base/use-foundation.svelte.js';
    import { Input } from '../input/index.js';
    import type { TimeInputProps } from './interface.js';

    type Foundation = TimeInputFoundation<TimeInputProps, FocusEvent>;
    type Adapter = TimeInputAdapter<TimeInputProps, FocusEvent>;

    let { value, inputReadOnly = false, invalid = false, validateStatus, focusOnOpen = false, preventScroll, onChange, onFocus, onBlur, ...rest }: TimeInputProps = $props();

    let input = $state<Input>();

    const { foundation } = useFoundation<Foundation, Adapter, TimeInputProps, TimeInputState>(
        TimeInputFoundation,
        {
            get value() {
                return value;
            },
            get focusOnOpen() {
                return focusOnOpen;
            },
            get preventScroll() {
                return preventScroll;
            },
        },
        () => ({}),
        () => ({
            notifyChange: (next) => onChange?.(next),
            notifyFocus: (event) => onFocus?.(event),
            notifyBlur: (event) => onBlur?.(event),
            getInputNode: () => input?.getInput() ?? null,
        })
    );

    const prefix = cssClasses.PREFIX;
</script>

<div class={`${prefix}-input-wrap`}>
    <!-- Fully controlled: the picker decides the text, and the Input puts back what it rejects -->
    <Input
        bind:this={input}
        {...rest}
        bind:value={() => value, (next) => foundation.handleChange(String(next ?? ''))}
        class={[`${prefix}-input`, { [`${prefix}-input-invalid`]: invalid, [`${prefix}-input-readonly`]: inputReadOnly }]}
        hideSuffix
        onBlur={foundation.handleBlur}
        onFocus={foundation.handleFocus}
        {preventScroll}
        readOnly={inputReadOnly}
        validateStatus={invalid ? 'error' : validateStatus}
    >
        {#snippet suffix()}
            <IconClock />
        {/snippet}
    </Input>
</div>

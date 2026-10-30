<script lang="ts">
    import { onMount } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/time-picker/constants';
    import TimeInputFoundation, { type TimeInputAdapter } from '@fibrae/semi-foundation/time-picker/input-foundation';
    import { IconClock } from '@fibrae/semi-icons-svelte';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { Input } from '../input/index.js';
    import type { TimeInputProps } from './interface.js';

    type Foundation = TimeInputFoundation<TimeInputProps, Record<string, never>, FocusEvent>;
    type Adapter = TimeInputAdapter<TimeInputProps, Record<string, never>, FocusEvent>;

    let { value, inputReadOnly = false, invalid = false, validateStatus, focusOnOpen = false, preventScroll, onChange, onFocus, onBlur, ...rest }: TimeInputProps = $props();

    let input = $state<Input>();

    const { foundation } = useFoundation<Foundation, Adapter, TimeInputProps, Record<string, never>>(
        TimeInputFoundation,
        {},
        () => ({}),
        () => ({
            notifyChange: (next) => onChange?.(next),
            notifyFocus: (event) => onFocus?.(event),
            notifyBlur: (event) => onBlur?.(event),
            getInputNode: () => input?.getInput() ?? null,
        })
    );

    const prefix = cssClasses.PREFIX;

    // Re-formatting moves the caret to the end; watch runs after the Input wrote the new text
    watch(() => value, foundation.restoreCursor);

    onMount(() => {
        const frame = requestAnimationFrame(() => {
            const node = input?.getInput();
            if (focusOnOpen && node) {
                node.focus({ preventScroll });
                node.select();
            }
        });
        return () => cancelAnimationFrame(frame);
    });
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

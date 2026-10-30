<script lang="ts">
    import { Input } from '../input/index.js';
    import type { InsetInputBoxProps } from './internal.js';

    let { kind, panel, type, insetInputValue, placeholder, ariaLabel, disabled = false, onChange, onFocus }: InsetInputBoxProps = $props();

    let input = $state<Input>();

    const field = $derived(kind === 'date' ? 'dateInput' : 'timeInput');

    const handleChange = (value: string, event: Event) => {
        onChange({ value, event, insetInputValue, panel, field });
    };

    export function focus(options?: FocusOptions) {
        input?.focus(options);
    }

    export function blur() {
        input?.blur();
    }

    export function getInput() {
        return input?.getInput();
    }
</script>

{#if kind === 'date' || type.includes('Time')}
    <!-- Fully controlled: the picker owns the text -->
    <Input aria-label={ariaLabel} bind:this={input} bind:value={() => insetInputValue[panel][field], () => {}} {disabled} onChange={handleChange} {onFocus} {placeholder} showClear={false} />
{/if}

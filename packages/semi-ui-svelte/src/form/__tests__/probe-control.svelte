<script lang="ts">
    // A bare control that shows what the field injects: value, validateStatus and the change and blur callbacks
    let { id, name, value = $bindable(), validateStatus, onChange, onBlur }: { id?: string; name?: string; value?: unknown; validateStatus?: string; onChange?: (value: string) => void; onBlur?: (event: FocusEvent) => void } = $props();
</script>

<input data-status={validateStatus} data-value={JSON.stringify(value)} {id} {name} value={(value as string | undefined) ?? ''} onblur={(event) => onBlur?.(event)} oninput={(event) => onChange?.(event.currentTarget.value)} />

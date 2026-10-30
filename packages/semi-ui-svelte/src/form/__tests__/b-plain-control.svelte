<script lang="ts">
    // A minimal custom control: the value comes in as a bindable prop and goes out through onChange. Unknown props land
    // on the input, so an attribute the field should not inject shows up in the DOM.
    let { value = $bindable(), onChange, validateStatus, ...rest }: { value?: string; onChange?: (value: string) => void; validateStatus?: string; [key: string]: unknown } = $props();
</script>

<input {...rest} data-status={validateStatus} value={value ?? ''} oninput={(event) => onChange?.(event.currentTarget.value)} />

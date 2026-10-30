<script lang="ts">
    import type { RadioProps } from '../radio/interface.js';
    import Radio from '../radio/radio.svelte';
    import Field from './field.svelte';
    import type { OptionalFieldProps, WithFieldOption } from './interface.js';

    let props: OptionalFieldProps<RadioProps> = $props();

    // Radio forwards native focus listeners to its input
    const fieldOptions: WithFieldOption = { valueKey: 'checked', valuePath: 'target.checked', shouldInject: false, onBlurFnName: 'onblur', insetLabel: false, validateStatus: false };
</script>

<Field {...props as OptionalFieldProps<RadioProps> & { field: string }} component={Radio} {fieldOptions} />

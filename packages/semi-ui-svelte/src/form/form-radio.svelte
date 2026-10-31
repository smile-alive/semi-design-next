<script lang="ts">
    import type { RadioProps } from '../radio/interface.js';
    import Radio from '../radio/radio.svelte';
    import Field from './field.svelte';
    import type { OptionalFieldProps, WithFieldOption } from './interface.js';

    let props: OptionalFieldProps<RadioProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    // Radio forwards native focus listeners to its input
    const fieldOptions: WithFieldOption = { valueKey: 'checked', valuePath: 'target.checked', shouldInject: false, onBlurFnName: 'onblur', insetLabel: false, validateStatus: false };

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props as OptionalFieldProps<RadioProps> & { field: string }} component={Radio} {fieldOptions} />

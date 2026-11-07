<script lang="ts">
    import type { RadioGroupProps } from '../radio/interface.js';
    import RadioGroup from '../radio/radio-group.svelte';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<RadioGroupProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    const fieldOptions: WithFieldOption = { valuePath: 'target.value', insetLabel: false, validateStatus: false };

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={RadioGroup} {fieldOptions} />

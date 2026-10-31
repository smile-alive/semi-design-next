<script lang="ts">
    import Checkbox from '../checkbox/checkbox.svelte';
    import type { CheckboxProps } from '../checkbox/interface.js';
    import Field from './field.svelte';
    import type { OptionalFieldProps, WithFieldOption } from './interface.js';

    let props: OptionalFieldProps<CheckboxProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    // Checkbox forwards native focus listeners to its input
    const fieldOptions: WithFieldOption = { valueKey: 'checked', valuePath: 'target.checked', shouldInject: false, onBlurFnName: 'onblur', insetLabel: false, validateStatus: false };

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props as OptionalFieldProps<CheckboxProps> & { field: string }} component={Checkbox} {fieldOptions} />

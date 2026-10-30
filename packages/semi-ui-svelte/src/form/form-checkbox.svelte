<script lang="ts">
    import Checkbox from '../checkbox/checkbox.svelte';
    import type { CheckboxProps } from '../checkbox/interface.js';
    import Field from './field.svelte';
    import type { OptionalFieldProps, WithFieldOption } from './interface.js';

    let props: OptionalFieldProps<CheckboxProps> = $props();

    // Checkbox forwards native focus listeners to its input
    const fieldOptions: WithFieldOption = { valueKey: 'checked', valuePath: 'target.checked', shouldInject: false, onBlurFnName: 'onblur', insetLabel: false, validateStatus: false };
</script>

<Field {...props as OptionalFieldProps<CheckboxProps> & { field: string }} component={Checkbox} {fieldOptions} />

<script lang="ts">
    import CheckboxGroup from '../checkbox/checkbox-group.svelte';
    import type { CheckboxGroupProps } from '../checkbox/interface.js';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<CheckboxGroupProps> = $props();

    const fieldOptions: WithFieldOption = { insetLabel: false, validateStatus: false };
</script>

<Field {...props} component={CheckboxGroup} {fieldOptions} />

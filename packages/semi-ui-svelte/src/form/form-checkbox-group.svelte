<script lang="ts">
    import CheckboxGroup from '../checkbox/checkbox-group.svelte';
    import type { CheckboxGroupProps } from '../checkbox/interface.js';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<CheckboxGroupProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    const fieldOptions: WithFieldOption = { insetLabel: false, validateStatus: false };

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={CheckboxGroup} {fieldOptions} />

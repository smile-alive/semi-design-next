<script lang="ts">
    import type { SelectProps } from '../select/interface.js';
    import Select from '../select/select.svelte';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<SelectProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={Select} />

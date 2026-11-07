<script lang="ts">
    import type { TreeSelectProps } from '../tree-select/interface.js';
    import TreeSelect from '../tree-select/tree-select.svelte';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<TreeSelectProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={TreeSelect} />

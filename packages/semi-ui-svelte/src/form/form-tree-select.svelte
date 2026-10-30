<script lang="ts">
    import type { TreeSelectProps } from '../tree-select/interface.js';
    import TreeSelect from '../tree-select/tree-select.svelte';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<TreeSelectProps> = $props();
</script>

<Field {...props} component={TreeSelect} />

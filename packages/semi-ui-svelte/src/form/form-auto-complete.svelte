<script lang="ts">
    import AutoComplete from '../auto-complete/auto-complete.svelte';
    import type { AutoCompleteProps } from '../auto-complete/interface.js';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<AutoCompleteProps> = $props();
</script>

<Field {...props} component={AutoComplete} />

<script lang="ts">
    import type { SelectProps } from '../select/interface.js';
    import Select from '../select/select.svelte';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<SelectProps> = $props();
</script>

<Field {...props} component={Select} />

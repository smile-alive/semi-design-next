<script lang="ts">
    import Input from '../input/input.svelte';
    import type { InputProps } from '../input/interface.js';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<InputProps> = $props();
</script>

<Field {...props} component={Input} />

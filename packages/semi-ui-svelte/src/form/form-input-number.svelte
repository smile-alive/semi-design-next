<script lang="ts">
    import InputNumber from '../input-number/input-number.svelte';
    import type { InputNumberProps } from '../input-number/interface.js';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<InputNumberProps> = $props();
</script>

<Field {...props} component={InputNumber} />

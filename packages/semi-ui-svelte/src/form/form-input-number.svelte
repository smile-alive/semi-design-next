<script lang="ts">
    import InputNumber from '../input-number/input-number.svelte';
    import type { InputNumberProps } from '../input-number/interface.js';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<InputNumberProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={InputNumber} />

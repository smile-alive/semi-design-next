<script lang="ts">
    import Input from '../input/input.svelte';
    import type { InputProps } from '../input/interface.js';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<InputProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={Input} />

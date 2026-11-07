<script lang="ts">
    import AutoComplete from '../auto-complete/auto-complete.svelte';
    import type { AutoCompleteProps } from '../auto-complete/interface.js';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<AutoCompleteProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={AutoComplete} />

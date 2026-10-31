<script lang="ts">
    import Cascader from '../cascader/cascader.svelte';
    import type { CascaderProps } from '../cascader/interface.js';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<CascaderProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={Cascader} />

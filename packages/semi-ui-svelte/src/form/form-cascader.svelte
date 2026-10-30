<script lang="ts">
    import Cascader from '../cascader/cascader.svelte';
    import type { CascaderProps } from '../cascader/interface.js';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<CascaderProps> = $props();
</script>

<Field {...props} component={Cascader} />

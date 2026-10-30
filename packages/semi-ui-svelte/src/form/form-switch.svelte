<script lang="ts">
    import type { SwitchProps } from '../switch/interface.js';
    import Switch from '../switch/switch.svelte';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<SwitchProps> = $props();

    // Switch forwards native focus listeners to its input
    const fieldOptions: WithFieldOption = { valueKey: 'checked', onBlurFnName: 'onblur', insetLabel: false, validateStatus: false };
</script>

<Field {...props} component={Switch} {fieldOptions} />

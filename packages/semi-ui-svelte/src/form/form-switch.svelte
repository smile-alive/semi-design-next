<script lang="ts">
    import type { SwitchProps } from '../switch/interface.js';
    import Switch from '../switch/switch.svelte';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<SwitchProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    // Switch forwards native focus listeners to its input
    const fieldOptions: WithFieldOption = { valueKey: 'checked', onBlurFnName: 'onblur', insetLabel: false, validateStatus: false };

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={Switch} {fieldOptions} />

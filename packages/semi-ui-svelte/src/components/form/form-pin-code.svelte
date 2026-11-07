<script lang="ts">
    import type { PinCodeProps } from '../pincode/interface.js';
    import PinCode from '../pincode/pincode.svelte';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<PinCodeProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    const fieldOptions: WithFieldOption = { insetLabel: false };

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={PinCode} {fieldOptions} />

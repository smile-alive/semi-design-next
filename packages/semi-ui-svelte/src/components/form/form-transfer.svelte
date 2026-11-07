<script lang="ts">
    import type { TransferProps } from '../transfer/interface.js';
    import Transfer from '../transfer/transfer.svelte';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<TransferProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    // Transfer has no inset label or validateStatus
    const fieldOptions: WithFieldOption = { insetLabel: false, validateStatus: false };

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={Transfer} {fieldOptions} />

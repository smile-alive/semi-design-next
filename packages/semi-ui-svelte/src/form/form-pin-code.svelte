<script lang="ts">
    import type { PinCodeProps } from '../pincode/interface.js';
    import PinCode from '../pincode/pincode.svelte';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<PinCodeProps> = $props();

    const fieldOptions: WithFieldOption = { insetLabel: false };
</script>

<Field {...props} component={PinCode} {fieldOptions} />

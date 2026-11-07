<script lang="ts">
    import type { TimePickerProps } from '../time-picker/interface.js';
    import TimePicker from '../time-picker/time-picker.svelte';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<TimePickerProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={TimePicker} />

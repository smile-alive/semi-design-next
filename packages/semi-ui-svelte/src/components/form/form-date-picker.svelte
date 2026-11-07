<script lang="ts">
    import DatePicker from '../date-picker/date-picker.svelte';
    import type { DatePickerProps } from '../date-picker/interface.js';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<DatePickerProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={DatePicker} />

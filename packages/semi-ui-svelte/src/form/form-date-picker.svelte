<script lang="ts">
    import DatePicker from '../date-picker/date-picker.svelte';
    import type { DatePickerProps } from '../date-picker/interface.js';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<DatePickerProps> = $props();
</script>

<Field {...props} component={DatePicker} />

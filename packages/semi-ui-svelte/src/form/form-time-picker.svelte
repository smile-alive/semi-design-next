<script lang="ts">
    import type { TimePickerProps } from '../time-picker/interface.js';
    import TimePicker from '../time-picker/time-picker.svelte';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<TimePickerProps> = $props();
</script>

<Field {...props} component={TimePicker} />

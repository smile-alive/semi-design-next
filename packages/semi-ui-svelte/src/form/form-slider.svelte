<script lang="ts">
    import type { SliderProps } from '../slider/interface.js';
    import Slider from '../slider/slider.svelte';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<SliderProps> = $props();

    const fieldOptions: WithFieldOption = { insetLabel: false, validateStatus: false };
</script>

<Field {...props} component={Slider} {fieldOptions} />

<script lang="ts">
    import type { SliderProps } from '../slider/interface.js';
    import Slider from '../slider/slider.svelte';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<SliderProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    const fieldOptions: WithFieldOption = { insetLabel: false, validateStatus: false };

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={Slider} {fieldOptions} />

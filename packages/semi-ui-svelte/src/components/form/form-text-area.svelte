<script lang="ts">
    import type { TextAreaProps } from '../input/interface.js';
    import TextArea from '../input/textarea.svelte';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<TextAreaProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    const fieldOptions: WithFieldOption = { insetLabel: false };

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={TextArea} {fieldOptions} />

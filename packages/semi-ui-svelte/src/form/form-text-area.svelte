<script lang="ts">
    import type { TextAreaProps } from '../input/interface.js';
    import TextArea from '../input/textarea.svelte';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<TextAreaProps> = $props();

    const fieldOptions: WithFieldOption = { insetLabel: false };
</script>

<Field {...props} component={TextArea} {fieldOptions} />

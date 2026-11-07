<script lang="ts">
    import type { TagInputProps } from '../tag-input/interface.js';
    import TagInput from '../tag-input/tag-input.svelte';
    import Field from './field.svelte';
    import type { FieldProps } from './interface.js';

    let props: FieldProps<TagInputProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={TagInput} />

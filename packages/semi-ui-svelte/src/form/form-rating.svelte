<script lang="ts">
    import type { RatingProps } from '../rating/interface.js';
    import Rating from '../rating/rating.svelte';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<RatingProps> = $props();

    let field: ReturnType<typeof Field> | undefined;

    const fieldOptions: WithFieldOption = { insetLabel: false, validateStatus: false };

    export function getControl() {
        return field?.getControl();
    }
</script>

<Field bind:this={field} {...props} component={Rating} {fieldOptions} />

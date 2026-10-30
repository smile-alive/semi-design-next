<script lang="ts">
    import type { RatingProps } from '../rating/interface.js';
    import Rating from '../rating/rating.svelte';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<RatingProps> = $props();

    const fieldOptions: WithFieldOption = { insetLabel: false, validateStatus: false };
</script>

<Field {...props} component={Rating} {fieldOptions} />

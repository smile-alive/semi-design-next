<script lang="ts" module>
    import type { SchemaArrayContext, SchemaFieldRenderers, SchemaLeafContext, SchemaObjectContext } from '../interface.js';
    import SemiArray from './semi-array.svelte';
    import SemiField from './semi-field.svelte';
    import SemiSection from './semi-section.svelte';

    /**
     * Renders SchemaField with Semi Form controls: objects and arrays as Sections, array rows with move and remove buttons,
     * single-value rows without a label. Spread it to replace one kind: `{ ...semiRenderers, array: myArray }`.
     */
    export const semiRenderers: Required<SchemaFieldRenderers> = { object, array, field };
</script>

{#snippet object(context: SchemaObjectContext)}
    <SemiSection node={context.node}>{@render context.content()}</SemiSection>
{/snippet}

{#snippet array(context: SchemaArrayContext)}
    <SemiArray {context} />
{/snippet}

{#snippet field(context: SchemaLeafContext)}
    <SemiField node={context.node} />
{/snippet}

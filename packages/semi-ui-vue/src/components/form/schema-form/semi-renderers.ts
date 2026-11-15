import { h } from 'vue';
import type { SchemaFieldRenderers } from '../interface';
import SemiArray from './semi-array.vue';
import SemiField from './semi-field.vue';
import SemiSection from './semi-section.vue';

/**
 * Renders SchemaField with Semi Form controls: objects and arrays as Sections, array rows with move and remove buttons,
 * single-value rows without a label. Spread it to replace one kind: `{ ...semiRenderers, array: myArray }`.
 */
export const semiRenderers: Required<SchemaFieldRenderers> = {
    object: ({ node, content }) => h(SemiSection, { node }, () => content),
    array: (context) => h(SemiArray, { context }),
    field: (context) => h(SemiField, { context }),
};

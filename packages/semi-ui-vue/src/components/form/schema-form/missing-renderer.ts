import { defineComponent, watchEffect } from 'vue';
import { schemaFieldWarnings } from '@fibrae/semi-foundation/components/form/json-schema';
import { warning } from '@fibrae/semi-foundation/utils';

// A component of its own because a render function must not warn: the warning runs after mount, as no server render does
export default defineComponent({
    name: 'MissingRenderer',
    props: { field: { type: String, required: true }, kind: { type: String, required: true } },
    setup(props) {
        watchEffect(
            () => {
                warning(true, schemaFieldWarnings.noRenderer(props.field, props.kind));
            },
            { flush: 'post' }
        );

        return () => null;
    },
});

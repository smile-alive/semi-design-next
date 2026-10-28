import { defineComponent } from 'vue';

// Renders its default slot without a wrapper. `<component :is="cond ? SlotFragment : 'div'">` drops a wrapper element
// conditionally; `Fragment` cannot stand in because it ignores slots. A `.ts` module, unlike a `.vue` one, resolves
// extensionless both through the repo's source alias and in the published dist, so semi-ai-vue imports it by subpath.
export default defineComponent({
    name: 'SlotFragment',
    inheritAttrs: false,
    setup(_, { slots }) {
        return () => slots.default?.();
    },
});

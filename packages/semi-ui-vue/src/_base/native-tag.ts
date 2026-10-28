import { type FunctionalComponent, h } from 'vue';

const tags = new Map<string, FunctionalComponent>();

/**
 * A component that always renders the native element `tag`. A string `:is` goes through resolveDynamicComponent, which
 * looks up the instance and app registries first, so a globally registered `Table` or `Search` would replace the
 * element. The component is cached per tag so `:is` keeps the same type across renders and does not remount.
 */
export function nativeTag(tag: string): FunctionalComponent {
    let component = tags.get(tag);
    if (!component) {
        component = (_, { attrs, slots }) => h(tag, attrs, slots.default?.());
        // attrs are passed to h(); fallthrough would apply them twice
        component.inheritAttrs = false;
        tags.set(tag, component);
    }
    return component;
}

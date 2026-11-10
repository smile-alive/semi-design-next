import { type FunctionalComponent, h } from 'vue';

export type NativeTagComponent = FunctionalComponent & { nativeTag: string };

const tags = new Map<string, NativeTagComponent>();

/**
 * A component that always renders the native element `tag`, which it exposes as `nativeTag` so code inspecting slot
 * VNodes (Tooltip's `canCarryPopupState`) can treat it like the element. A string `:is` goes through
 * resolveDynamicComponent, which looks up the instance and app registries first, so a globally registered `Table` or
 * `Search` would replace the element. The component is cached per tag so `:is` keeps the same type across renders and
 * does not remount.
 */
export function nativeTag(tag: string): NativeTagComponent {
    let component = tags.get(tag);
    if (!component) {
        const render: FunctionalComponent = (_, { attrs, slots }) => h(tag, attrs, slots.default?.());
        // attrs are passed to h(); fallthrough would apply them twice
        render.inheritAttrs = false;
        component = Object.assign(render, { nativeTag: tag });
        tags.set(tag, component);
    }
    return component;
}

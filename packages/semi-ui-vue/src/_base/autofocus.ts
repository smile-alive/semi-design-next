import type { ObjectDirective } from 'vue';

// Browsers skip the autofocus attribute on elements inserted after page load, and jsdom and SSR ignore it.
// Use it on native elements only: on a component the directive applies to the root node alone, and a multi-root
// component warns. `v-autofocus.prevent-scroll` keeps the page from scrolling; `v-autofocus="false"` opts out.
export const vAutofocus: ObjectDirective<HTMLElement, boolean | undefined> = {
    mounted(el, { value, modifiers }) {
        if (value !== false) el.focus({ preventScroll: Boolean(modifiers.preventScroll) });
    },
};

// A bare `autofocus` attribute arrives as '', so truthiness would miss it.
export function hasAutofocus(attrs: Record<string, unknown>) {
    return attrs.autofocus !== undefined && attrs.autofocus !== false;
}

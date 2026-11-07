/**
 * Focuses `element` when `flag` is set; call it once the element is in the document (`onMount`, or the effect that
 * reacts to late content appearing). Solid inserts elements at runtime and the browser only
 * honors the `autofocus` attribute at page load, so the attribute alone never focuses anything (Vue's v-autofocus
 * works around the same limit).
 */
export default function autofocus(flag?: boolean, element?: HTMLElement | null, options?: FocusOptions) {
    if (flag) {
        element?.focus(options);
    }
}

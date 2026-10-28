// JS fallback for CSS `field-sizing: content`, used by TextArea autosize and the TagInput text input.

/**
 * Whether the browser sizes form controls to their content in CSS. Called after mount only, so SSR never touches the
 * DOM. Removable, together with its callers and the `@supports not (field-sizing: content)` blocks, once the oldest
 * supported browsers are Chrome 123, Firefox 152 and Safari 26.2.
 */
export function supportsFieldSizing() {
    return CSS.supports('field-sizing', 'content');
}

/**
 * Sets the textarea's inline height to fit its content. Rows bounds are not applied here: the stylesheet's
 * min-block-size and max-block-size clamp the height.
 */
export function fitTextareaHeight(textarea: HTMLTextAreaElement) {
    const { scrollTop } = textarea;
    // collapsed first, so scrollHeight is the content height rather than the previous height
    textarea.style.height = '0px';
    const style = getComputedStyle(textarea);
    const height = style.boxSizing === 'border-box' ? textarea.scrollHeight + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth) : textarea.scrollHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    textarea.style.height = `${height}px`;
    textarea.scrollTop = scrollTop;
    return height;
}

/** Sets the input's inline width to fit its value, or its placeholder while empty. */
export function fitInputWidth(input: HTMLInputElement) {
    const style = getComputedStyle(input);
    const mirror = document.createElement('span');
    Object.assign(mirror.style, {
        position: 'absolute',
        visibility: 'hidden',
        whiteSpace: 'pre',
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        fontStretch: style.fontStretch,
        letterSpacing: style.letterSpacing,
        textTransform: style.textTransform,
    });
    mirror.textContent = input.value || input.placeholder;
    // beside the input, so that inherited font features apply
    input.after(mirror);
    const textWidth = mirror.getBoundingClientRect().width;
    mirror.remove();
    const chrome = style.boxSizing === 'border-box' ? parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth) : 0;
    const width = Math.ceil(textWidth) + chrome;
    input.style.width = `${width}px`;
    return width;
}

/** Calls `refit` when web fonts finish loading, which changes text metrics after the first measurement. */
export function onFontsLoaded(refit: () => void, signal: AbortSignal) {
    document.fonts.addEventListener('loadingdone', refit, { signal });
}
